import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Users } from "@/lib/icons";
import { supabase } from "@/lib/supabase";
import { adminAdjustCopyTradingProfit } from "@/lib/admin-api";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

type CopySubRow = {
  id: string;
  user_id: string;
  trader_name: string;
  allocation: number;
  profit_earned: number;
  status: string;
  created_at: string;
  profiles?: { email: string | null; full_name: string | null } | null;
};

type Filter = "active" | "all";

export default function AdminCopyTradingPage() {
  const { t } = useTranslation();
  const [rows, setRows] = useState<CopySubRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filter, setFilter] = useState<Filter>("active");
  const [openId, setOpenId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    let query = supabase
      .from("copy_trading_subscriptions")
      .select("*, profiles:user_id(email, full_name)")
      .order("created_at", { ascending: false })
      .limit(100);

    if (filter === "active") query = query.eq("status", "active");

    const { data, error: err } = await query;
    if (err) setError(err.message);
    else setRows((data as CopySubRow[]) ?? []);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  const adjust = async (subId: string, signedAmount: number) => {
    if (!Number.isFinite(signedAmount) || signedAmount === 0) {
      setError(t("admin.copyTradingAmountInvalid"));
      return;
    }
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const data = await adminAdjustCopyTradingProfit(subId, signedAmount, note);
      setSuccess(
        t("admin.copyTradingProfitUpdated", {
          amount: formatCurrency(signedAmount),
          total: formatCurrency(Number(data.profit_after ?? 0)),
          balance: formatCurrency(Number(data.balance_after ?? 0)),
        })
      );
      setAmount("");
      setNote("");
      setOpenId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.copyTradingAmountInvalid"));
    } finally {
      setBusy(false);
    }
  };

  const submitSigned = (subId: string, mode: "profit" | "loss") => {
    const raw = Math.abs(parseFloat(amount));
    if (!Number.isFinite(raw) || raw <= 0) {
      setError(t("admin.copyTradingAmountInvalid"));
      return;
    }
    void adjust(subId, mode === "profit" ? raw : -raw);
  };

  if (loading && rows.length === 0) return <LoadingScreen />;

  return (
    <div className="space-y-6">
      <AdminPageHeader title={t("admin.copyTradingTitle")} subtitle={t("admin.copyTradingSubtitle")} />

      {error && (
        <p className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">{error}</p>
      )}
      {success && (
        <p className="rounded-lg border border-emerald/30 bg-emerald/10 px-4 py-3 text-sm text-emerald">{success}</p>
      )}

      <div className="flex flex-wrap gap-1.5 rounded-xl border border-border bg-secondary/30 p-1">
        {(
          [
            ["active", t("admin.copyTradingFilterActive")],
            ["all", t("admin.copyTradingFilterAll")],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={cn(
              "rounded-lg px-3 py-2 text-xs font-medium transition-colors",
              filter === id ? "bg-surface-elevated text-foreground shadow-sm" : "text-muted hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <AdminPanel title={t("admin.copyTradingRuns")}>
        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">{t("admin.copyTradingRunsEmpty")}</p>
        ) : (
          <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
            {rows.map((row) => {
              const open = openId === row.id;
              const profit = Number(row.profit_earned ?? 0);
              const canAdjust = row.status === "active";
              return (
                <div key={row.id} className="bg-surface-elevated/40">
                  <button
                    type="button"
                    className="flex w-full flex-col gap-2 px-4 py-3.5 text-left hover:bg-secondary/30 sm:flex-row sm:items-center sm:justify-between"
                    onClick={() => setOpenId(open ? null : row.id)}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Users className="h-4 w-4 text-emerald" />
                        <p className="font-medium text-foreground">{row.trader_name}</p>
                        <StatusBadge status={row.status} />
                      </div>
                      <p className="mt-1 truncate text-sm text-muted">
                        {row.profiles?.full_name || row.profiles?.email || row.user_id.slice(0, 8)}
                        {row.profiles?.email && row.profiles?.full_name ? ` · ${row.profiles.email}` : ""}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {t("admin.copyTradingSince", { date: formatDate(row.created_at) })}
                        {row.allocation != null ? ` · ${formatCurrency(row.allocation)}` : ""}
                      </p>
                    </div>
                    <div className="shrink-0 sm:text-right">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                        {t("admin.copyTradingCurrentPnL")}
                      </p>
                      <p
                        className={cn(
                          "font-display text-lg font-semibold tabular-nums",
                          profit >= 0 ? "text-emerald" : "text-red-400"
                        )}
                      >
                        {profit >= 0 ? "+" : ""}
                        {formatCurrency(profit)}
                      </p>
                    </div>
                  </button>

                  {open && (
                    <div className="border-t border-border bg-secondary/15 px-4 py-4">
                      {canAdjust ? (
                        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                          <div>
                            <Label>{t("admin.copyTradingAmount")}</Label>
                            <Input
                              type="number"
                              min={0.01}
                              step="0.01"
                              value={amount}
                              onChange={(e) => setAmount(e.target.value)}
                              placeholder="100"
                              className="mt-1.5"
                            />
                          </div>
                          <div>
                            <Label>{t("admin.copyTradingNote")}</Label>
                            <Input
                              value={note}
                              onChange={(e) => setNote(e.target.value)}
                              placeholder={t("admin.copyTradingNotePlaceholder")}
                              className="mt-1.5"
                            />
                          </div>
                          <div className="flex items-end gap-2">
                            <Button
                              disabled={busy}
                              onClick={() => submitSigned(row.id, "profit")}
                              className="flex-1"
                            >
                              {t("admin.copyTradingAddProfit")}
                            </Button>
                            <Button
                              variant="destructive"
                              disabled={busy}
                              onClick={() => submitSigned(row.id, "loss")}
                              className="flex-1"
                            >
                              {t("admin.copyTradingAddLoss")}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted">{t("admin.copyTradingOnlyActive")}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </AdminPanel>
    </div>
  );
}
