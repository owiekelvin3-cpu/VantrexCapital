import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/hooks/useAuth";
import { ensureValidSession } from "@/lib/auth-session";
import { isKycApproved, formatTransactionError } from "@/lib/kyc";
import { KycRequiredGate } from "@/components/dashboard/KycRequiredGate";
import { ProductNotice } from "@/components/dashboard/ProductNotice";
import { Button } from "@/components/ui/button";
import { formatCurrency, cn } from "@/lib/utils";
import { DashboardSheet } from "@/components/dashboard/DashboardSheet";
import { COPY_TRADER_SECTIONS, COPY_TRADERS } from "@/lib/copy-traders";
import {
  getCopySubscriptions,
  subscribeToTrader,
  uncopyTrader,
  type CopySubscription,
} from "@/lib/copy-trading";
import { CopyTraderCard } from "@/components/dashboard/copy-trading/CopyTraderCard";
import { TraderAvatar } from "@/components/dashboard/copy-trading/TraderAvatar";
import { ChevronRight, RefreshCw } from "@/lib/icons";

const COPY_ALLOCATION = 0;

export default function CopyTradingPage() {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const [subscriptions, setSubscriptions] = useState<CopySubscription[]>([]);
  const [loadingTrader, setLoadingTrader] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [sectionIndex, setSectionIndex] = useState(0);

  const section = COPY_TRADER_SECTIONS[sectionIndex];
  const sectionCount = COPY_TRADER_SECTIONS.length;

  const load = useCallback(async () => {
    if (!user) return;
    await ensureValidSession();
    try {
      const rows = await getCopySubscriptions(user.id);
      setSubscriptions(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("copyTrading.loadFailed"));
    }
  }, [user, t]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCopy(traderName: string) {
    setError("");
    if (!user) return;
    if (!isKycApproved(profile)) {
      setError(t("kyc.required"));
      return;
    }
    setLoadingTrader(traderName);
    try {
      const row = await subscribeToTrader({
        userId: user.id,
        traderName,
        allocation: COPY_ALLOCATION,
      });
      setSubscriptions((prev) => {
        const without = prev.filter((s) => s.trader_name !== traderName);
        return [row, ...without];
      });
    } catch (err) {
      setError(formatTransactionError(err, t("copyTrading.subscribeFailed"), t("kyc.required")));
    } finally {
      setLoadingTrader(null);
    }
  }

  async function handleUncopy(traderName: string) {
    setError("");
    if (!user) return;
    setLoadingTrader(traderName);
    try {
      await uncopyTrader(traderName);
      setSubscriptions((prev) =>
        prev.map((s) =>
          s.trader_name === traderName && s.status === "active"
            ? { ...s, status: "cancelled" }
            : s
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : t("copyTrading.uncopyFailed"));
    } finally {
      setLoadingTrader(null);
    }
  }

  const activeSubscriptions = subscriptions.filter((s) => s.status === "active");
  const activeTraders = new Set(activeSubscriptions.map((s) => s.trader_name));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow={t("dashboard.navGroupProducts")}
        title={t("copyTrading.title")}
        subtitle={t("copyTrading.subtitleFree")}
      />

      <KycRequiredGate>
        <DashboardSheet>
          <ProductNotice
            className="mb-6"
            title={t("copyTrading.howItWorksTitle")}
            body={t("copyTrading.howItWorksBody")}
          />

          {error && (
            <p role="alert" className="mb-4 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
              {error}
            </p>
          )}

          {activeSubscriptions.length > 0 && (
            <div className="mb-6 rounded-2xl border border-border bg-card p-4 sm:p-5">
              <h2 className="text-sm font-semibold text-foreground">{t("copyTrading.following")}</h2>
              <div className="mt-3 space-y-3">
                {activeSubscriptions.map((sub) => {
                  const trader = COPY_TRADERS.find((item) => item.name === sub.trader_name);
                  const profit = Number(sub.profit_earned ?? 0);
                  return (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        {trader ? (
                          <TraderAvatar trader={trader} size="sm" />
                        ) : (
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold">
                            {sub.trader_name.charAt(0)}
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">{sub.trader_name}</p>
                          <p className="text-xs capitalize text-muted">
                            {sub.status} · {t("copyTrading.free")}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <div className="text-right">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                            {t("copyTrading.copyPnL")}
                          </p>
                          <p className={cn("text-sm font-semibold tabular-nums", profit >= 0 ? "text-emerald" : "text-red-400")}>
                            {profit >= 0 ? "+" : ""}
                            {formatCurrency(profit)}
                          </p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={loadingTrader === sub.trader_name}
                          onClick={() => void handleUncopy(sub.trader_name)}
                        >
                          {loadingTrader === sub.trader_name ? (
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            t("copyTrading.uncopy")
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mb-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {COPY_TRADER_SECTIONS.map((s, index) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSectionIndex(index)}
                className={cn(
                  "shrink-0 rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors",
                  sectionIndex === index
                    ? "border-emerald/40 bg-emerald/15 text-emerald"
                    : "border-border bg-card text-muted hover:text-foreground"
                )}
              >
                {s.title}
              </button>
            ))}
          </div>

          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold text-foreground">{section.title}</h2>
              <p className="mt-1 max-w-2xl text-sm text-muted">{section.subtitle}</p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={sectionIndex <= 0}
                onClick={() => setSectionIndex((i) => Math.max(0, i - 1))}
              >
                Prev
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={sectionIndex >= sectionCount - 1}
                onClick={() => setSectionIndex((i) => Math.min(sectionCount - 1, i + 1))}
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {section.traders.map((trader, index) => (
              <CopyTraderCard
                key={trader.name}
                trader={trader}
                index={index}
                isActive={activeTraders.has(trader.name)}
                loading={loadingTrader === trader.name}
                onCopy={() => void handleCopy(trader.name)}
                onUncopy={() => void handleUncopy(trader.name)}
              />
            ))}
          </div>
        </DashboardSheet>
      </KycRequiredGate>
    </div>
  );
}
