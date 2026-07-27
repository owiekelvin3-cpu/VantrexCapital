import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, RefreshCw } from "@/lib/icons";
import { supabase } from "@/lib/supabase";
import { approveDeposit, updateUserFeeStatus } from "@/lib/admin-api";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { formatCurrency, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Deposit, UserFee, UserFeeStatus } from "@/types/database";

type FilterKey = "all" | "pending" | "paid" | "waived" | "cancelled";

type AdminFee = UserFee & {
  profiles?: { email: string | null; full_name: string | null } | null;
};

type PendingDeposit = Pick<Deposit, "id" | "user_id" | "amount" | "status" | "method" | "created_at" | "related_fee_id">;

function findMatchingDeposit(fee: AdminFee, deposits: PendingDeposit[]): PendingDeposit | null {
  const candidates = deposits.filter(
    (d) => d.user_id === fee.user_id && d.status === "pending" && Number(d.amount) >= Number(fee.amount)
  );
  if (candidates.length === 0) return null;

  const linked = candidates.find((d) => d.related_fee_id === fee.id);
  if (linked) return linked;

  const exact = candidates
    .filter((d) => Number(d.amount) === Number(fee.amount))
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  if (exact[0]) return exact[0];

  return [...candidates].sort((a, b) => a.created_at.localeCompare(b.created_at))[0] ?? null;
}

export default function AdminFeesPage() {
  const { t } = useTranslation();
  const [fees, setFees] = useState<AdminFee[]>([]);
  const [pendingDeposits, setPendingDeposits] = useState<PendingDeposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [acting, setActing] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>("pending");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const [feesRes, depsRes] = await Promise.all([
      supabase
        .from("user_fees")
        .select("*, profiles!user_fees_user_id_fkey(email, full_name)")
        .order("created_at", { ascending: false }),
      supabase
        .from("deposits")
        .select("id, user_id, amount, status, method, created_at, related_fee_id")
        .eq("status", "pending")
        .order("created_at", { ascending: true }),
    ]);

    if (feesRes.error) setError(feesRes.error.message);
    else setFees((feesRes.data as AdminFee[]) ?? []);

    if (depsRes.error && !feesRes.error) setError(depsRes.error.message);
    else setPendingDeposits((depsRes.data as PendingDeposit[]) ?? []);

    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleApprovePayment = async (fee: AdminFee) => {
    const deposit = findMatchingDeposit(fee, pendingDeposits);
    if (!deposit) {
      setError(t("admin.feesNoMatchingDeposit"));
      return;
    }

    setActing(fee.id);
    setError("");
    setSuccess("");
    try {
      await approveDeposit(deposit.id, deposit.user_id, Number(deposit.amount));
      setSuccess(
        t("admin.feesApprovedWithDeposit", {
          fee: formatCurrency(Number(fee.amount)),
          deposit: formatCurrency(Number(deposit.amount)),
        })
      );
      await load();
      setExpandedId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("admin.actionFailed"));
    }
    setActing(null);
  };

  const handleStatus = async (feeId: string, status: Extract<UserFeeStatus, "paid" | "waived" | "cancelled">) => {
    setActing(feeId);
    setError("");
    setSuccess("");
    try {
      await updateUserFeeStatus(feeId, status);
      setSuccess(t(`admin.userDetail.feeStatus.${status}`));
      await load();
      setExpandedId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("admin.actionFailed"));
    }
    setActing(null);
  };

  const filtered = useMemo(
    () => fees.filter((f) => (filter === "all" ? true : f.status === filter)),
    [fees, filter]
  );

  const pendingCount = fees.filter((f) => f.status === "pending").length;
  const paidCount = fees.filter((f) => f.status === "paid").length;
  const waivedCount = fees.filter((f) => f.status === "waived").length;
  const cancelledCount = fees.filter((f) => f.status === "cancelled").length;
  const pendingTotal = fees
    .filter((f) => f.status === "pending")
    .reduce((sum, f) => sum + Number(f.amount), 0);

  const FILTERS: { key: FilterKey; label: string; count?: number }[] = [
    { key: "pending", label: t("admin.filterPending"), count: pendingCount },
    { key: "paid", label: t("admin.feesFilterPaid"), count: paidCount },
    { key: "waived", label: t("admin.feesFilterWaived"), count: waivedCount },
    { key: "cancelled", label: t("admin.feesFilterCancelled"), count: cancelledCount },
    { key: "all", label: t("admin.filterAll"), count: fees.length },
  ];

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title={t("admin.feesTitle")}
        subtitle={t("admin.feesSubtitle")}
        action={
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            {t("admin.refresh")}
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label={t("admin.feesPendingCount")} value={pendingCount} accent={pendingCount > 0} />
        <StatCard label={t("admin.feesPendingTotal")} value={formatCurrency(pendingTotal)} accent={pendingTotal > 0} />
        <StatCard label={t("admin.feesFilterPaid")} value={paidCount} />
        <StatCard label={t("admin.feesTotalAssigned")} value={fees.length} />
      </div>

      {error && (
        <p className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">{error}</p>
      )}
      {success && (
        <p className="rounded-xl border border-emerald/30 bg-emerald/10 px-4 py-3 text-sm text-emerald">{success}</p>
      )}

      <AdminPanel
        title={t("admin.feesListTitle")}
        description={
          pendingCount > 0 ? t("admin.feesPendingHint", { count: pendingCount }) : t("admin.feesNonePending")
        }
        action={
          <div className="flex gap-1 overflow-x-auto rounded-lg border border-border bg-secondary/40 p-0.5 scrollbar-none">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={cn(
                  "shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  filter === f.key ? "bg-card text-foreground shadow-sm" : "text-muted hover:text-foreground"
                )}
              >
                {f.label}
                {f.count !== undefined && f.count > 0 && (
                  <span className="ml-1.5 text-[10px] opacity-60">{f.count}</span>
                )}
              </button>
            ))}
          </div>
        }
      >
        {loading ? (
          <LoadingScreen />
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-12 text-center">
            <p className="text-sm text-muted">{t("admin.feesEmpty")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((fee) => {
              const isExpanded = expandedId === fee.id;
              const pending = fee.status === "pending";
              const userLabel = fee.profiles?.full_name || fee.profiles?.email || fee.user_id.slice(0, 8);
              const match = pending ? findMatchingDeposit(fee, pendingDeposits) : null;
              const userPendingDeposits = pendingDeposits.filter((d) => d.user_id === fee.user_id);

              return (
                <div
                  key={fee.id}
                  className={cn(
                    "rounded-xl border bg-card transition-colors",
                    pending ? "border-amber-500/20" : "border-border"
                  )}
                >
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="font-display text-base font-semibold text-foreground">
                          {formatCurrency(Number(fee.amount))}
                        </span>
                        <StatusBadge status={fee.status} />
                        {pending && match && (
                          <span className="inline-flex items-center rounded-full border border-emerald/30 bg-emerald/10 px-2 py-0.5 text-[10px] font-medium text-emerald">
                            {t("admin.feesDepositReady")}
                          </span>
                        )}
                        {pending && !match && (
                          <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                            {t("admin.feesAwaitingDeposit")}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-sm text-muted">
                        <span className="font-medium text-foreground">{userLabel}</span>
                        {" · "}
                        {fee.label}
                        {" · "}
                        {formatDate(fee.created_at)}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setExpandedId(isExpanded ? null : fee.id)}
                        aria-label={isExpanded ? t("admin.hideDetails") : t("admin.viewDetails")}
                      >
                        {isExpanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      {pending && !isExpanded && (
                        <>
                          <Button
                            size="sm"
                            disabled={acting === fee.id || !match}
                            onClick={() => void handleApprovePayment(fee)}
                          >
                            {t("admin.feesApprove")}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={acting === fee.id}
                            onClick={() => void handleStatus(fee.id, "waived")}
                          >
                            {t("admin.userDetail.waive")}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="space-y-4 border-t border-border p-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <DetailRow label={t("admin.user")} value={userLabel} />
                        <DetailRow label={t("admin.userDetail.feeType")} value={fee.fee_type} />
                        <DetailRow label={t("admin.feesLabel")} value={fee.label} />
                        <DetailRow label={t("admin.feesAmount")} value={formatCurrency(Number(fee.amount))} />
                        <DetailRow label={t("admin.feesAssignedAt")} value={formatDate(fee.created_at)} />
                        {fee.paid_at && (
                          <DetailRow label={t("admin.feesPaidAt")} value={formatDate(fee.paid_at)} />
                        )}
                      </div>

                      {fee.notes && (
                        <div className="rounded-lg border border-border bg-secondary/30 px-3 py-2">
                          <p className="text-[11px] font-medium uppercase tracking-wider text-muted">
                            {t("admin.feesNotes")}
                          </p>
                          <p className="mt-1 text-sm text-foreground">{fee.notes}</p>
                        </div>
                      )}

                      {pending && (
                        <div className="rounded-lg border border-border bg-secondary/20 px-3 py-3">
                          <p className="text-[11px] font-medium uppercase tracking-wider text-muted">
                            {t("admin.feesMatchingDeposits")}
                          </p>
                          {userPendingDeposits.length === 0 ? (
                            <p className="mt-2 text-sm text-muted">{t("admin.feesNoPendingDeposits")}</p>
                          ) : (
                            <ul className="mt-2 space-y-2">
                              {userPendingDeposits.map((d) => (
                                <li
                                  key={d.id}
                                  className={cn(
                                    "flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm",
                                    match?.id === d.id ? "border-emerald/30 bg-emerald/5" : "border-border"
                                  )}
                                >
                                  <span>
                                    {formatCurrency(Number(d.amount))} · {d.method} · {formatDate(d.created_at)}
                                    {match?.id === d.id && (
                                      <span className="ml-2 text-xs text-emerald">{t("admin.feesWillUseDeposit")}</span>
                                    )}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                          <p className="mt-2 text-xs text-muted">
                            <Link to="/dashboard/admin/deposits" className="text-foreground underline-offset-2 hover:underline">
                              {t("admin.feesOpenDeposits")}
                            </Link>
                          </p>
                        </div>
                      )}

                      {pending && (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            disabled={acting === fee.id || !match}
                            onClick={() => void handleApprovePayment(fee)}
                          >
                            {t("admin.feesApprove")}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={acting === fee.id}
                            onClick={() => void handleStatus(fee.id, "paid")}
                          >
                            {t("admin.userDetail.markPaid")}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={acting === fee.id}
                            onClick={() => void handleStatus(fee.id, "waived")}
                          >
                            {t("admin.userDetail.waive")}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={acting === fee.id}
                            onClick={() => void handleStatus(fee.id, "cancelled")}
                          >
                            {t("admin.userDetail.cancelFee")}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setExpandedId(null)}>
                            {t("admin.hideDetails")}
                          </Button>
                        </div>
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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-0.5 text-sm text-foreground">{value}</p>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted">{label}</p>
      <p className={cn("mt-1 font-display text-lg font-semibold", accent ? "text-amber-400" : "text-foreground")}>
        {value}
      </p>
    </div>
  );
}
