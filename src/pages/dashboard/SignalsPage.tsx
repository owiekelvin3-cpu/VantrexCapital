import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { ensureValidSession } from "@/lib/auth-session";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { DashboardSheet } from "@/components/dashboard/DashboardSheet";
import { KycRequiredGate } from "@/components/dashboard/KycRequiredGate";
import { ProductNotice } from "@/components/dashboard/ProductNotice";
import { isKycApproved, formatTransactionError } from "@/lib/kyc";
import { SIGNAL_PLANS } from "@/lib/signal-plans";
import {
  canViewSignal,
  computeSignalDeskStats,
  fetchSignalSubscriptions,
  fetchTradingSignals,
  getUserSignalTierRank,
  isSubscriptionActive,
  purchaseSignalPackage,
  riskRewardRatio,
  type SignalSubscription,
  type TradingSignal,
} from "@/lib/signals";
import { convertFromUsd } from "@/lib/currency";
import { ArrowDownToLine, Bell, CandlestickChart, Check, Lock, Radio, TrendingDown, TrendingUp } from "@/lib/icons";

function SignalRow({ signal }: { signal: TradingSignal }) {
  const { t } = useTranslation();
  const rr = riskRewardRatio(signal);
  const isBuy = signal.direction === "buy";

  return (
    <tr className="border-b border-border/60 last:border-0">
      <td className="px-3 py-3">
        <span className="font-mono text-sm font-semibold text-foreground">{signal.symbol}</span>
      </td>
      <td className="px-3 py-3">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase",
            isBuy ? "bg-emerald/15 text-emerald" : "bg-red-500/15 text-red-400"
          )}
        >
          {isBuy ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {signal.direction}
        </span>
      </td>
      <td className="hidden px-3 py-3 font-mono text-xs text-muted sm:table-cell">{signal.entry_price}</td>
      <td className="hidden px-3 py-3 font-mono text-xs text-emerald md:table-cell">{signal.target_price}</td>
      <td className="hidden px-3 py-3 font-mono text-xs text-red-400 md:table-cell">{signal.stop_price}</td>
      <td className="hidden px-3 py-3 text-xs lg:table-cell">{rr != null ? `${rr.toFixed(1)}R` : "—"}</td>
      <td className="px-3 py-3 text-xs text-muted">{signal.confidence}%</td>
      <td className="px-3 py-3">
        <Badge variant={signal.status === "active" ? "success" : "secondary"} className="capitalize">
          {t(`signals.signalStatus.${signal.status}`, { defaultValue: signal.status })}
        </Badge>
      </td>
    </tr>
  );
}

export default function SignalsPage() {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const [subs, setSubs] = useState<SignalSubscription[]>([]);
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [balance, setBalance] = useState(0);
  const [pending, setPending] = useState<(typeof SIGNAL_PLANS)[number] | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "closed">("active");

  const load = useCallback(async () => {
    if (!user) return;
    await ensureValidSession();
    const [subList, balRes] = await Promise.all([
      fetchSignalSubscriptions(user.id),
      supabase.from("balances").select("amount").eq("user_id", user.id).single(),
    ]);
    setSubs(subList);
    setBalance(Number(balRes.data?.amount ?? 0));

    const tierRank = getUserSignalTierRank(subList);
    if (tierRank > 0) {
      try {
        const desk = await fetchTradingSignals();
        setSignals(desk.filter((s) => canViewSignal(s, tierRank)));
      } catch {
        setSignals([]);
      }
    } else {
      setSignals([]);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const tierRank = useMemo(() => getUserSignalTierRank(subs), [subs]);
  const stats = useMemo(() => computeSignalDeskStats(signals), [signals]);
  const currentPlanLabel = useMemo(() => {
    const active = subs.find(isSubscriptionActive);
    return active ? active.package_name : null;
  }, [subs]);

  const filteredSignals = useMemo(() => {
    if (filter === "all") return signals;
    return signals.filter((s) => s.status === filter);
  }, [signals, filter]);

  const requestSubscribe = (plan: (typeof SIGNAL_PLANS)[number]) => {
    setMessage("");
    setIsSuccess(false);
    if (!isKycApproved(profile)) {
      setMessage(t("kyc.required"));
      return;
    }
    if (convertFromUsd(plan.price) > balance) {
      setMessage(t("signals.insufficientBalance"));
      return;
    }
    setPending(plan);
  };

  const confirmSubscribe = async () => {
    if (!user || !pending) return;
    setLoading(pending.id);
    setMessage("");
    setIsSuccess(false);
    try {
      await purchaseSignalPackage({
        userId: user.id,
        planId: pending.id,
        planName: pending.name,
        price: convertFromUsd(pending.price),
        days: pending.days,
      });
      setIsSuccess(true);
      setMessage(t("signals.subscribed", { name: pending.name }));
      setPending(null);
      await load();
    } catch (error) {
      setMessage(
        formatTransactionError(
          error,
          error instanceof Error && error.message.includes("Insufficient")
            ? t("signals.insufficientBalance")
            : error instanceof Error
              ? error.message
              : t("signals.subscribeFailed"),
          t("kyc.required")
        )
      );
      setIsSuccess(false);
    }
    setLoading(null);
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        eyebrow={t("signals.eyebrow")}
        title={t("signals.title")}
        subtitle={t("signals.subtitle")}
        actions={
          <div className="rounded-full border border-border bg-card px-3.5 py-2 text-sm">
            <span className="text-muted">{t("signals.balance")}</span>
            <span className="ml-2 font-semibold text-emerald">{formatCurrency(balance)}</span>
          </div>
        }
      />

      {tierRank > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-xl border border-emerald/30 bg-emerald/10 px-4 py-3">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted">{t("signals.currentPlan")}</p>
              <p className="mt-1 font-display text-lg font-semibold text-emerald">
                {currentPlanLabel || "—"}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card px-4 py-3">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted">{t("signals.deskActive")}</p>
              <p className="mt-1 font-display text-lg font-semibold">{stats.active}</p>
            </div>
            <div className="rounded-xl border border-border bg-card px-4 py-3">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted">{t("signals.deskClosed")}</p>
              <p className="mt-1 font-display text-lg font-semibold">{stats.closed}</p>
            </div>
            <div className="rounded-xl border border-border bg-card px-4 py-3">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted">{t("signals.winRate")}</p>
              <p className="mt-1 font-display text-lg font-semibold">
                {stats.winRate != null ? `${stats.winRate}%` : "—"}
              </p>
            </div>
          </div>

          <DashboardSheet flush className="overflow-hidden !p-0">
            <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4 text-emerald" />
                <h2 className="font-display text-base font-semibold">{t("signals.deskTitle")}</h2>
              </div>
              <div className="flex flex-wrap gap-1">
                {(["active", "closed", "all"] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors",
                      filter === f ? "bg-foreground text-background" : "text-muted hover:text-foreground"
                    )}
                  >
                    {t(`signals.filter.${f}`)}
                  </button>
                ))}
              </div>
            </div>

            {filteredSignals.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-muted">{t("signals.deskEmpty")}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left">
                  <thead>
                    <tr className="border-b border-border bg-secondary/40 text-[10px] font-semibold uppercase tracking-wider text-muted">
                      <th className="px-3 py-2.5">{t("signals.colSymbol")}</th>
                      <th className="px-3 py-2.5">{t("signals.colSide")}</th>
                      <th className="hidden px-3 py-2.5 sm:table-cell">{t("signals.colEntry")}</th>
                      <th className="hidden px-3 py-2.5 md:table-cell">{t("signals.colTarget")}</th>
                      <th className="hidden px-3 py-2.5 md:table-cell">{t("signals.colStop")}</th>
                      <th className="hidden px-3 py-2.5 lg:table-cell">{t("signals.colRR")}</th>
                      <th className="px-3 py-2.5">{t("signals.colConf")}</th>
                      <th className="px-3 py-2.5">{t("signals.colStatus")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSignals.map((s) => (
                      <SignalRow key={s.id} signal={s} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex flex-wrap gap-2 border-t border-border px-4 py-3 sm:px-5">
              <Button size="sm" className="rounded-full" asChild>
                <Link to="/dashboard/trading-room">
                  <CandlestickChart className="h-3.5 w-3.5" />
                  {t("signals.openTradingRoom")}
                </Link>
              </Button>
              <Button size="sm" variant="outline" className="rounded-full" asChild>
                <Link to="/dashboard/notifications">
                  <Bell className="h-3.5 w-3.5" />
                  {t("signals.openNotifications")}
                </Link>
              </Button>
            </div>
          </DashboardSheet>
        </>
      ) : (
        <DashboardSheet>
          <div className="flex flex-col items-center py-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-secondary">
              <Lock className="h-6 w-6 text-muted" />
            </div>
            <p className="mt-4 font-display text-lg font-semibold">{t("signals.lockedTitle")}</p>
            <p className="mt-2 max-w-md text-sm text-muted">{t("signals.lockedBody")}</p>
          </div>
        </DashboardSheet>
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        <ProductNotice title={t("signals.howItWorksTitle")} body={t("signals.howItWorksBody")} />
        <ProductNotice variant="risk" title={t("signals.riskTitle")} body={t("signals.riskBody")} />
      </div>

      <KycRequiredGate>
        <div>
          <h2 className="mb-3 font-display text-base font-semibold">{t("signals.plansTitle")}</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {SIGNAL_PLANS.map((plan) => {
              const isCurrent = subs.some((s) => isSubscriptionActive(s) && s.package_id === plan.id);
              const price = convertFromUsd(plan.price);
              return (
                <div
                  key={plan.id}
                  className={cn(
                    "flex flex-col rounded-2xl border bg-card p-4",
                    plan.highlighted ? "border-emerald/40 ring-1 ring-emerald/20" : "border-border/70",
                    isCurrent && "border-emerald/40"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-display text-lg font-semibold text-foreground">{plan.name}</p>
                    {isCurrent && <Badge variant="success">{t("signals.currentPlan")}</Badge>}
                  </div>
                  <p className="mt-3 font-display text-2xl font-semibold tracking-tight">
                    {formatCurrency(price)}
                    <span className="ml-1 text-sm font-normal text-muted">
                      {t("signals.perPeriod", { days: plan.days })}
                    </span>
                  </p>
                  <p className="mt-2 text-sm text-muted">{plan.description}</p>
                  <ul className="mt-4 flex-1 space-y-1.5">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-xs text-muted">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    size="sm"
                    className="mt-4 w-full rounded-full"
                    variant={isCurrent ? "outline" : "default"}
                    disabled={loading === plan.id || isCurrent}
                    onClick={() => requestSubscribe(plan)}
                  >
                    {isCurrent ? t("signals.planActive") : loading === plan.id ? t("common.saving") : t("signals.subscribe")}
                  </Button>
                  {balance < price && !isCurrent && (
                    <Button variant="ghost" size="sm" className="mt-1 w-full text-xs" asChild>
                      <Link to="/dashboard/deposits">
                        <ArrowDownToLine className="h-3.5 w-3.5" />
                        {t("dashboard.deposits")}
                      </Link>
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {pending && (
          <DashboardSheet className="mt-4">
            <ProductNotice
              variant="risk"
              title={t("signals.confirmTitle")}
              body={t("signals.confirmBody", {
                amount: formatCurrency(convertFromUsd(pending.price)),
                name: pending.name,
                days: pending.days,
              })}
            />
            <div className="mt-4 flex flex-wrap gap-2">
              <Button className="rounded-full" disabled={!!loading} onClick={() => void confirmSubscribe()}>
                {loading ? t("common.saving") : t("signals.subscribe")}
              </Button>
              <Button variant="outline" className="rounded-full" disabled={!!loading} onClick={() => setPending(null)}>
                {t("signals.cancel")}
              </Button>
            </div>
          </DashboardSheet>
        )}

        {message && (
          <p className={cn("mt-3 text-sm", isSuccess ? "text-emerald" : "text-amber-400")}>{message}</p>
        )}
      </KycRequiredGate>

      <DashboardSheet>
        <h2 className="mb-4 font-display text-base font-semibold">{t("signals.activeSubs")}</h2>
        {subs.length === 0 ? (
          <p className="text-sm text-muted">{t("signals.noSubs")}</p>
        ) : (
          <div className="divide-y divide-border/50">
            {subs.map((s) => {
              const active = isSubscriptionActive(s);
              return (
                <div key={s.id} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">{s.package_name}</p>
                    <p className="text-xs text-muted">
                      {formatCurrency(s.price)} · {formatDate(s.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={active ? "success" : "secondary"}>
                      {active ? t("signals.status.active") : t("signals.status.expired")}
                    </Badge>
                    {s.expires_at && (
                      <p className="mt-1 text-xs text-muted">
                        {t("signals.expires")} {formatDate(s.expires_at)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DashboardSheet>
    </div>
  );
}
