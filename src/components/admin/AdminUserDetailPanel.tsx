import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  X, Mail, Globe2, Wallet, Shield, Clock, Key, Globe,
  Copy, Check, ExternalLink, RefreshCw, Coins, Plus, AlertTriangle, FileCheck,
  ArrowDownToLine, ArrowUpFromLine, Trash2,
} from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { LoadingScreen } from "@/components/ui/loading-screen";
import {
  fetchAdminUserDetails, sendUserPasswordReset,
  assignUserFee, updateUserFeeStatus, moderateAdminUser, adjustAdminUserBalance,
  deleteAdminUser,
  type AdminUserDetails, type AdminModerationUiAction, type AdminBalanceDirection,
} from "@/lib/admin-api";
import { createKycDocumentSignedUrl } from "@/lib/kyc";
import { FEE_TYPES, type FeeTypeId } from "@/constants/fee-types";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { UserFeeStatus } from "@/types/database";

interface AdminUserDetailPanelProps {
  userId: string | null;
  onClose: () => void;
  onUpdated?: () => void;
  onDeleted?: () => void;
}

function DetailRow({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  const empty = value === null || value === undefined || value === "";
  return (
    <div className="flex flex-col gap-1 border-b border-border py-3 last:border-0 sm:flex-row sm:items-start sm:justify-between">
      <span className="shrink-0 text-xs font-medium uppercase tracking-wider text-muted">{label}</span>
      <span className={cn(
        "text-sm sm:text-right",
        empty ? "text-muted italic" : "text-foreground",
        mono && !empty && "font-mono text-xs break-all"
      )}>
        {empty ? "—" : value}
      </span>
    </div>
  );
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

function hasLocationData(profile: AdminUserDetails["profile"]): boolean {
  return Boolean(
    profile.last_known_location
    || profile.last_known_ip
    || profile.country
    || profile.city
    || profile.timezone
  );
}

export function AdminUserDetailPanel({ userId, onClose, onUpdated, onDeleted }: AdminUserDetailPanelProps) {
  const { t } = useTranslation();
  const [data, setData] = useState<AdminUserDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [feeType, setFeeType] = useState<FeeTypeId>("kyc_aml");
  const [customLabel, setCustomLabel] = useState("");
  const [feeAmount, setFeeAmount] = useState("");
  const [feeNotes, setFeeNotes] = useState("");
  const [feeBusy, setFeeBusy] = useState(false);
  const [moderationReason, setModerationReason] = useState("");
  const [moderationBusy, setModerationBusy] = useState(false);
  const [reasonError, setReasonError] = useState("");
  const reasonFieldRef = useRef<HTMLTextAreaElement | null>(null);
  const [fundDirection, setFundDirection] = useState<AdminBalanceDirection>("credit");
  const [fundAmount, setFundAmount] = useState("");
  const [fundReason, setFundReason] = useState("");
  const [fundBusy, setFundBusy] = useState(false);
  const [deleteConfirming, setDeleteConfirming] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!userId) return;
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const details = await fetchAdminUserDetails(userId);
      setData(details);
      onUpdated?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load user");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, onUpdated]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    setDeleteConfirming(false);
    setDeleteBusy(false);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const interval = window.setInterval(() => { void load(true); }, 15000);
    return () => window.clearInterval(interval);
  }, [userId, load]);

  useEffect(() => {
    if (!userId) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [userId, onClose]);

  if (!userId) return null;

  const profile = data?.profile;
  const auth = data?.auth;
  const stats = data?.stats;
  const fees = data?.fees ?? [];
  const balanceAdjustments = data?.balance_adjustments ?? [];
  const moderationActions = data?.moderation_actions ?? [];
  const outstandingTotal = Number(data?.outstanding_fees_total ?? 0);
  const locationReady = profile ? hasLocationData(profile) : false;
  const displayLocation = profile?.last_known_location
    || [profile?.city, profile?.country].filter(Boolean).join(", ")
    || null;

  const runModeration = async (action: AdminModerationUiAction) => {
    if (!userId) return;
    const typedReason = moderationReason.trim();
    // Lift suspension must not block on an empty reason field.
    if (action !== "unsuspend" && typedReason.length < 3) {
      setReasonError(t("admin.userDetail.reasonRequired"));
      setError(t("admin.userDetail.reasonRequired"));
      setMessage("");
      reasonFieldRef.current?.focus();
      reasonFieldRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setModerationBusy(true);
    setError("");
    setReasonError("");
    setMessage("");
    try {
      await moderateAdminUser({ userId, action, reason: typedReason });
      setMessage(t(`admin.userDetail.actionSuccess.${action}`));
      if (action !== "note") setModerationReason("");
      await load(true);
      onUpdated?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("admin.userDetail.actionFailed");
      setError(msg);
    } finally {
      setModerationBusy(false);
    }
  };

  const requestDeleteUser = () => {
    const typedReason = moderationReason.trim();
    if (typedReason.length < 3) {
      setReasonError(t("admin.userDetail.reasonRequired"));
      setError(t("admin.userDetail.reasonRequired"));
      setMessage("");
      reasonFieldRef.current?.focus();
      reasonFieldRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setReasonError("");
    setError("");
    setMessage("");
    setDeleteConfirming(true);
  };

  const confirmDeleteUser = async () => {
    if (!userId) return;
    const typedReason = moderationReason.trim();
    if (typedReason.length < 3) {
      setReasonError(t("admin.userDetail.reasonRequired"));
      return;
    }
    setDeleteBusy(true);
    setError("");
    setMessage("");
    try {
      await deleteAdminUser({ userId, reason: typedReason });
      onDeleted?.();
      onClose();
    } catch (err) {
      setDeleteConfirming(false);
      setError(err instanceof Error ? err.message : t("admin.userDetail.deleteFailed"));
    } finally {
      setDeleteBusy(false);
    }
  };

  const copyId = async () => {
    if (!userId) return;
    await navigator.clipboard.writeText(userId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePasswordReset = async () => {
    if (!profile?.email) return;
    setMessage("");
    try {
      await sendUserPasswordReset(profile.email);
      setMessage(t("admin.userDetail.resetSent", { email: profile.email }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reset failed");
    }
  };

  const selectedFeeMeta = FEE_TYPES.find((f) => f.id === feeType)!;

  const handleAssignFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    const amount = parseFloat(feeAmount);
    if (!amount || amount <= 0) {
      setError(t("admin.userDetail.feeInvalidAmount"));
      return;
    }
    const label = feeType === "custom"
      ? customLabel.trim()
      : selectedFeeMeta.label;
    if (!label) {
      setError(t("admin.userDetail.feeLabelRequired"));
      return;
    }

    setFeeBusy(true);
    setError("");
    setMessage("");
    try {
      await assignUserFee({
        userId,
        feeType,
        label,
        amount,
        notes: feeNotes.trim() || undefined,
      });
      setFeeAmount("");
      setFeeNotes("");
      setCustomLabel("");
      setMessage(t("admin.userDetail.feeAssigned"));
      await load(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.userDetail.feeAssignFailed"));
    } finally {
      setFeeBusy(false);
    }
  };

  const handleFeeStatus = async (feeId: string, status: Extract<UserFeeStatus, "paid" | "waived" | "cancelled">) => {
    setFeeBusy(true);
    setError("");
    setMessage("");
    try {
      await updateUserFeeStatus(feeId, status);
      setMessage(t(`admin.userDetail.feeStatus.${status}`));
      await load(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.userDetail.feeUpdateFailed"));
    } finally {
      setFeeBusy(false);
    }
  };

  const handleAdjustFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    const amount = parseFloat(fundAmount);
    const reason = fundReason.trim();
    if (!amount || amount <= 0) {
      setError(t("admin.userDetail.fundInvalidAmount"));
      setMessage("");
      return;
    }
    if (reason.length < 3) {
      setError(t("admin.userDetail.fundReasonRequired"));
      setMessage("");
      return;
    }
    if (fundDirection === "debit" && amount > Number(data?.balance ?? 0)) {
      setError(t("admin.userDetail.fundInsufficient"));
      setMessage("");
      return;
    }

    setFundBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await adjustAdminUserBalance({
        userId,
        direction: fundDirection,
        amount,
        reason,
      });
      setFundAmount("");
      setFundReason("");
      setMessage(
        t(
          fundDirection === "credit"
            ? "admin.userDetail.fundCredited"
            : "admin.userDetail.fundDebited",
          { amount: formatCurrency(Number(result.amount)), balance: formatCurrency(Number(result.balance_after)) }
        )
      );
      await load(true);
      onUpdated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.userDetail.fundFailed"));
    } finally {
      setFundBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-label={t("admin.userDetail.close")} />

      <div className="relative z-10 flex h-full w-full max-w-xl flex-col border-l border-border bg-void shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-5">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-emerald">{t("admin.userDetail.title")}</p>
            <h2 className="mt-1 truncate font-display text-xl font-bold">{profile?.full_name || profile?.email || "…"}</h2>
            <p className="truncate text-sm text-muted">{profile?.email}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-muted hover:bg-secondary hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {loading ? (
            <LoadingScreen />
          ) : error && !data ? (
            <p className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">{error}</p>
          ) : data && profile ? (
            <div className="space-y-6">
              {(error || message) && (
                <p className={cn("rounded-lg border px-4 py-3 text-sm", message
                  ? "border-emerald/30 bg-emerald/10 text-emerald"
                  : "border-red-500/20 bg-red-500/5 text-red-400"
                )}>{message || error}</p>
              )}

              <section className="rounded-xl border border-border bg-secondary/50 p-4">
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <StatusBadge status={profile.role} />
                  <StatusBadge status={profile.kyc_status} />
                  {profile.is_suspended && (
                    <Badge variant="destructive">{t("admin.userDetail.suspendedBadge")}</Badge>
                  )}
                </div>
                {profile.is_suspended && (
                  <div className="mb-4 rounded-xl border border-red-500/25 bg-red-500/[0.06] px-3 py-3">
                    <p className="text-xs font-semibold text-red-400">
                      {t("admin.userDetail.suspendedSince", {
                        date: formatDate(profile.suspended_at),
                      })}
                    </p>
                    {profile.suspension_reason && (
                      <p className="mt-1 text-sm text-foreground">
                        <span className="text-muted">{t("admin.userDetail.suspensionReason")}: </span>
                        {profile.suspension_reason}
                      </p>
                    )}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-secondary/80 p-3">
                    <p className="text-xs text-muted">{t("admin.userDetail.balance")}</p>
                    <p className="mt-1 font-display text-lg font-bold text-emerald">{formatCurrency(data.balance)}</p>
                  </div>
                  <div className="rounded-lg bg-secondary/80 p-3">
                    <p className="text-xs text-muted">{t("admin.userDetail.outstandingFees")}</p>
                    <p className={cn(
                      "mt-1 font-display text-lg font-bold",
                      outstandingTotal > 0 ? "text-amber-400" : "text-foreground"
                    )}>
                      {formatCurrency(outstandingTotal)}
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-border bg-secondary/50 p-4">
                <h3 className="mb-1 flex items-center gap-2 font-display text-sm font-semibold">
                  <Shield className="h-4 w-4 text-emerald" />
                  {t("admin.userDetail.accountActions")}
                </h3>
                <p className="mb-4 text-xs leading-relaxed text-muted">
                  {t("admin.userDetail.accountActionsDesc")}
                </p>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="moderation-reason">
                      {profile.is_suspended
                        ? t("admin.userDetail.reasonLabelOptional")
                        : t("admin.userDetail.reasonLabel")}
                    </Label>
                    <textarea
                      ref={reasonFieldRef}
                      id="moderation-reason"
                      value={moderationReason}
                      onChange={(e) => {
                        setModerationReason(e.target.value);
                        if (reasonError) setReasonError("");
                      }}
                      rows={3}
                      className={cn(
                        "mt-1.5 w-full rounded-xl border bg-void px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-1",
                        reasonError
                          ? "border-red-500/50 focus:border-red-500/60 focus:ring-red-500/20"
                          : "border-border focus:border-emerald/40 focus:ring-emerald/20"
                      )}
                      placeholder={
                        profile.is_suspended
                          ? t("admin.userDetail.unsuspendReasonPlaceholder")
                          : t("admin.userDetail.reasonPlaceholder")
                      }
                    />
                    {reasonError && (
                      <p className="mt-1.5 text-xs text-red-400">{reasonError}</p>
                    )}
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    {profile.is_suspended ? (
                      <Button
                        type="button"
                        size="sm"
                        disabled={moderationBusy}
                        onClick={() => void runModeration("unsuspend")}
                      >
                        {moderationBusy ? t("admin.userDetail.acting") : t("admin.userDetail.unsuspend")}
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        disabled={moderationBusy || profile.role === "admin"}
                        onClick={() => void runModeration("suspend")}
                      >
                        <AlertTriangle className="h-3.5 w-3.5" />
                        {moderationBusy ? t("admin.userDetail.acting") : t("admin.userDetail.suspend")}
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={moderationBusy}
                      onClick={() => void runModeration("reset_kyc")}
                    >
                      <FileCheck className="h-3.5 w-3.5" />
                      {t("admin.userDetail.resetKyc")}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={moderationBusy}
                      onClick={() => void runModeration("note")}
                    >
                      {t("admin.userDetail.saveNote")}
                    </Button>
                  </div>

                  <div className="rounded-xl border border-border/70 bg-secondary/40 px-3 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                      {t("admin.userDetail.adminNotes")}
                    </p>
                    <p className="mt-1 text-sm text-foreground">
                      {profile.admin_notes || t("admin.userDetail.noAdminNotes")}
                    </p>
                  </div>

                  <div>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                      {t("admin.userDetail.moderationHistory")}
                    </p>
                    {moderationActions.length === 0 ? (
                      <p className="text-xs text-muted">{t("admin.userDetail.noModerationHistory")}</p>
                    ) : (
                      <ul className="space-y-2">
                        {moderationActions.map((action) => (
                          <li
                            key={action.id}
                            className="rounded-lg border border-border/60 bg-secondary/50 px-3 py-2.5 text-xs"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="font-semibold text-foreground">
                                {t(`admin.userDetail.actionTypes.${action.action_type}`)}
                              </span>
                              <span className="text-muted">{formatDate(action.created_at)}</span>
                            </div>
                            <p className="mt-1 text-muted">{action.reason}</p>
                            <p className="mt-1 text-[11px] text-muted/80">
                              {action.admin_name || action.admin_email || action.admin_id}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-red-500/25 bg-red-500/5 p-4">
                <h3 className="mb-1 flex items-center gap-2 font-display text-sm font-semibold text-red-400">
                  <Trash2 className="h-4 w-4" />
                  {t("admin.userDetail.deleteUserTitle")}
                </h3>
                <p className="mb-4 text-xs leading-relaxed text-muted">
                  {t("admin.userDetail.deleteUserDesc")}
                </p>

                {deleteConfirming ? (
                  <div className="space-y-3 rounded-xl border border-red-500/30 bg-card/80 p-4">
                    <p className="text-sm text-foreground">
                      {t("admin.userDetail.deleteConfirmBody", {
                        name: profile.full_name || profile.email,
                        email: profile.email,
                      })}
                    </p>
                    <p className="text-xs text-muted">{t("admin.userDetail.deleteConfirmHint")}</p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        disabled={deleteBusy}
                        onClick={() => void confirmDeleteUser()}
                      >
                        {deleteBusy ? t("admin.userDetail.deleting") : t("admin.userDetail.deleteConfirmSubmit")}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={deleteBusy}
                        onClick={() => setDeleteConfirming(false)}
                      >
                        {t("common.cancel")}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    disabled={moderationBusy || deleteBusy}
                    onClick={requestDeleteUser}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {t("admin.userDetail.deleteUser")}
                  </Button>
                )}
              </section>

              <section className="rounded-xl border border-border bg-secondary/50 p-4">
                <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold">
                  <Wallet className="h-4 w-4 text-emerald" />
                  {t("admin.userDetail.adjustFunds")}
                </h3>
                <p className="mb-4 text-xs leading-relaxed text-muted">
                  {t("admin.userDetail.adjustFundsDesc")}
                </p>

                <form onSubmit={handleAdjustFunds} className="space-y-3 rounded-lg border border-border bg-secondary/80 p-3">
                  <div>
                    <Label>{t("admin.userDetail.fundDirection")}</Label>
                    <div className="mt-1.5 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setFundDirection("credit")}
                        className={cn(
                          "flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors",
                          fundDirection === "credit"
                            ? "border-emerald/40 bg-emerald/10 text-emerald"
                            : "border-border bg-void text-muted hover:text-foreground"
                        )}
                      >
                        <ArrowDownToLine className="h-3.5 w-3.5" />
                        {t("admin.userDetail.fundAdd")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setFundDirection("debit")}
                        className={cn(
                          "flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors",
                          fundDirection === "debit"
                            ? "border-red-500/40 bg-red-500/10 text-red-400"
                            : "border-border bg-void text-muted hover:text-foreground"
                        )}
                      >
                        <ArrowUpFromLine className="h-3.5 w-3.5" />
                        {t("admin.userDetail.fundRemove")}
                      </button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="fund-amount">{t("admin.userDetail.fundAmount")}</Label>
                    <Input
                      id="fund-amount"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={fundAmount}
                      onChange={(e) => setFundAmount(e.target.value)}
                      className="mt-1.5"
                      placeholder="0.00"
                      required
                    />
                    <p className="mt-1 text-[11px] text-muted">
                      {t("admin.userDetail.fundCurrentBalance", {
                        balance: formatCurrency(Number(data.balance ?? 0)),
                      })}
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="fund-reason">{t("admin.userDetail.fundReason")}</Label>
                    <textarea
                      id="fund-reason"
                      value={fundReason}
                      onChange={(e) => setFundReason(e.target.value)}
                      rows={3}
                      required
                      className="mt-1.5 w-full rounded-xl border border-border bg-void px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-emerald/40 focus:outline-none focus:ring-1 focus:ring-emerald/20"
                      placeholder={t("admin.userDetail.fundReasonPlaceholder")}
                    />
                  </div>
                  <Button
                    type="submit"
                    size="sm"
                    variant={fundDirection === "credit" ? "default" : "destructive"}
                    disabled={fundBusy}
                    className="w-full"
                  >
                    {fundBusy
                      ? t("admin.userDetail.fundWorking")
                      : fundDirection === "credit"
                        ? t("admin.userDetail.fundAddSubmit")
                        : t("admin.userDetail.fundRemoveSubmit")}
                  </Button>
                </form>

                <div className="mt-4 space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                    {t("admin.userDetail.fundHistory")}
                  </p>
                  {balanceAdjustments.length === 0 ? (
                    <p className="text-sm text-muted">{t("admin.userDetail.noFundHistory")}</p>
                  ) : (
                    balanceAdjustments.map((adj) => (
                      <div key={adj.id} className="rounded-lg bg-secondary/80 px-3 py-3 text-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className={cn(
                              "font-medium",
                              adj.direction === "credit" ? "text-emerald" : "text-red-400"
                            )}>
                              {adj.direction === "credit" ? "+" : "−"}
                              {formatCurrency(Number(adj.amount))}
                              <span className="ml-2 text-xs font-normal text-muted">
                                {t(`admin.userDetail.fundDirections.${adj.direction}`)}
                              </span>
                            </p>
                            <p className="mt-1 text-xs text-muted">{adj.reason}</p>
                            <p className="mt-1 text-[11px] text-muted/80">
                              {adj.admin_name || adj.admin_email || adj.admin_id}
                              {" · "}
                              {formatDate(adj.created_at)}
                            </p>
                          </div>
                          <p className="shrink-0 text-right text-xs text-muted">
                            {formatCurrency(Number(adj.balance_before))}
                            {" → "}
                            <span className="text-foreground">{formatCurrency(Number(adj.balance_after))}</span>
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="rounded-xl border border-border bg-secondary/50 p-4">
                <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold">
                  <Coins className="h-4 w-4 text-emerald" />
                  {t("admin.userDetail.withdrawalFees")}
                </h3>
                <p className="mb-4 text-xs leading-relaxed text-muted">
                  {t("admin.userDetail.withdrawalFeesDesc")}
                </p>

                <form onSubmit={handleAssignFee} className="space-y-3 rounded-lg border border-border bg-secondary/80 p-3">
                  <div>
                    <Label htmlFor="fee-type">{t("admin.userDetail.feeType")}</Label>
                    <select
                      id="fee-type"
                      value={feeType}
                      onChange={(e) => setFeeType(e.target.value as FeeTypeId)}
                      className="mt-1.5 flex h-10 w-full rounded-xl border border-border bg-void px-3 text-sm text-foreground"
                    >
                      {FEE_TYPES.map((opt) => (
                        <option key={opt.id} value={opt.id}>{t(opt.i18nKey, { defaultValue: opt.label })}</option>
                      ))}
                    </select>
                  </div>
                  {feeType === "custom" && (
                    <div>
                      <Label htmlFor="fee-label">{t("admin.userDetail.feeCustomLabel")}</Label>
                      <Input
                        id="fee-label"
                        value={customLabel}
                        onChange={(e) => setCustomLabel(e.target.value)}
                        className="mt-1.5"
                        placeholder={t("admin.userDetail.feeCustomPlaceholder")}
                        required
                      />
                    </div>
                  )}
                  <div>
                    <Label htmlFor="fee-amount">{t("admin.userDetail.feeAmount")}</Label>
                    <Input
                      id="fee-amount"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={feeAmount}
                      onChange={(e) => setFeeAmount(e.target.value)}
                      className="mt-1.5"
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="fee-notes">{t("admin.notes")}</Label>
                    <Input
                      id="fee-notes"
                      value={feeNotes}
                      onChange={(e) => setFeeNotes(e.target.value)}
                      className="mt-1.5"
                      placeholder={t("admin.userDetail.feeNotesPlaceholder")}
                    />
                  </div>
                  <Button type="submit" size="sm" variant="gold" disabled={feeBusy} className="w-full">
                    <Plus className="mr-2 h-3.5 w-3.5" />
                    {feeBusy ? t("admin.userDetail.assigningFee") : t("admin.userDetail.assignFee")}
                  </Button>
                </form>

                <div className="mt-4 space-y-2">
                  {fees.length === 0 ? (
                    <p className="text-sm text-muted">{t("admin.userDetail.noFees")}</p>
                  ) : (
                    fees.map((fee) => (
                      <div key={fee.id} className="rounded-lg bg-secondary/80 px-3 py-3 text-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium text-foreground">{fee.label}</p>
                            <p className="mt-0.5 text-xs text-muted">{formatDate(fee.created_at)}</p>
                            {fee.notes && <p className="mt-1 text-xs text-muted">{fee.notes}</p>}
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="font-medium">{formatCurrency(Number(fee.amount))}</p>
                            <div className="mt-1 flex justify-end">
                              <StatusBadge status={fee.status} />
                            </div>
                          </div>
                        </div>
                        {fee.status === "pending" && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Button type="button" size="sm" variant="outline" disabled={feeBusy} onClick={() => void handleFeeStatus(fee.id, "paid")}>
                              {t("admin.userDetail.markPaid")}
                            </Button>
                            <Button type="button" size="sm" variant="outline" disabled={feeBusy} onClick={() => void handleFeeStatus(fee.id, "waived")}>
                              {t("admin.userDetail.waive")}
                            </Button>
                            <Button type="button" size="sm" variant="ghost" disabled={feeBusy} onClick={() => void handleFeeStatus(fee.id, "cancelled")}>
                              {t("admin.userDetail.cancelFee")}
                            </Button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="rounded-xl border border-border bg-secondary/50 p-4">
                <h3 className="mb-2 flex items-center gap-2 font-display text-sm font-semibold">
                  <Mail className="h-4 w-4 text-emerald" />
                  {t("admin.userDetail.identity")}
                </h3>
                <DetailRow label={t("admin.name")} value={profile.full_name} />
                <DetailRow label={t("admin.email")} value={profile.email} />
                <DetailRow label={t("admin.userDetail.phone")} value={profile.phone} />
                <DetailRow label={t("admin.userDetail.bio")} value={profile.bio} />
                <DetailRow
                  label={t("admin.userDetail.userId")}
                  value={
                    <button type="button" onClick={copyId} className="inline-flex items-center gap-1.5 text-emerald hover:underline">
                      <span className="font-mono text-xs">{userId.slice(0, 8)}…</span>
                      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  }
                />
              </section>

              <section className="rounded-xl border border-border bg-secondary/50 p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h3 className="flex items-center gap-2 font-display text-sm font-semibold">
                    <Globe2 className="h-4 w-4 text-emerald" />
                    {t("admin.userDetail.location")}
                  </h3>
                  <div className="flex items-center gap-2">
                    {locationReady && (
                      <Badge variant="success" className="text-[10px]">{t("admin.userDetail.locationLive")}</Badge>
                    )}
                    <button
                      type="button"
                      onClick={() => void load(true)}
                      disabled={refreshing}
                      className="rounded-lg p-1.5 text-muted hover:bg-secondary hover:text-foreground disabled:opacity-50"
                      aria-label={t("admin.userDetail.refreshLocation")}
                    >
                      <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
                    </button>
                  </div>
                </div>

                {locationReady ? (
                  <>
                    <div className="mb-4 rounded-lg border border-emerald/20 bg-emerald/5 px-4 py-3">
                      <div className="flex items-start gap-2">
                        <Globe2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald" />
                        <div className="min-w-0">
                          <p className="font-medium text-foreground">{displayLocation}</p>
                          <p className="mt-1 text-xs text-muted">
                            {t("admin.userDetail.locationDetectedAt", {
                              time: formatDate(profile.location_updated_at ?? profile.updated_at),
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                    <DetailRow label={t("admin.userDetail.lastKnownIp")} value={profile.last_known_ip} mono />
                <DetailRow label={t("admin.userDetail.country")} value={profile.country} />
                <DetailRow label={t("admin.userDetail.region")} value={profile.region} />
                <DetailRow label={t("admin.userDetail.city")} value={profile.city} />
                <DetailRow label={t("admin.userDetail.timezone")} value={profile.timezone} />
                  </>
                ) : (
                  <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-200/90">
                    {t("admin.userDetail.locationPending")}
                  </div>
                )}
              </section>

              <section className="rounded-xl border border-border bg-secondary/50 p-4">
                <h3 className="mb-2 flex items-center gap-2 font-display text-sm font-semibold">
                  <Shield className="h-4 w-4 text-emerald" />
                  {t("admin.userDetail.security")}
                </h3>
                <DetailRow
                  label={t("admin.userDetail.password")}
                  value={
                    <span className="text-muted">
                      {auth?.has_password ? t("admin.userDetail.passwordEncrypted") : t("admin.userDetail.noPassword")}
                    </span>
                  }
                />
                <DetailRow label={t("admin.userDetail.emailVerified")} value={auth?.email_confirmed_at ? formatDate(auth.email_confirmed_at) : t("admin.userDetail.notVerified")} />
                <DetailRow label={t("admin.userDetail.lastSignIn")} value={formatDate(auth?.last_sign_in_at)} />
                <DetailRow label={t("admin.userDetail.authProviders")} value={
                  auth?.providers?.length
                    ? auth.providers.join(", ")
                    : "email"
                } />
                <DetailRow label={t("admin.userDetail.accountCreated")} value={formatDate(auth?.created_at)} />
                <Button variant="outline" size="sm" className="mt-3 border-border" onClick={handlePasswordReset}>
                  <Key className="mr-2 h-3.5 w-3.5" />
                  {t("admin.userDetail.sendReset")}
                </Button>
                <p className="mt-2 text-xs text-muted">{t("admin.userDetail.passwordNote")}</p>
              </section>

              <section className="rounded-xl border border-border bg-secondary/50 p-4">
                <h3 className="mb-2 flex items-center gap-2 font-display text-sm font-semibold">
                  <Wallet className="h-4 w-4 text-emerald" />
                  {t("admin.userDetail.wallet")}
                </h3>
                <DetailRow label={t("admin.userDetail.walletLabel")} value={profile.wallet_label} />
                <DetailRow label={t("admin.userDetail.walletAddress")} value={profile.wallet_address} mono />
              </section>

              <section className="rounded-xl border border-border bg-secondary/50 p-4">
                <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold">
                  <Globe className="h-4 w-4 text-emerald" />
                  {t("admin.userDetail.activity")}
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {[
                    { label: t("admin.userDetail.deposits"), value: `${stats?.deposits_count ?? 0} · ${formatCurrency(stats?.deposits_total ?? 0)}` },
                    { label: t("admin.userDetail.withdrawals"), value: `${stats?.withdrawals_count ?? 0} · ${formatCurrency(stats?.withdrawals_total ?? 0)}` },
                    { label: t("admin.userDetail.trades"), value: String(stats?.trades_count ?? 0) },
                    { label: t("admin.userDetail.activeTrades"), value: String(stats?.active_trades ?? 0) },
                    { label: t("admin.userDetail.aiBots"), value: String(stats?.ai_bots_active ?? 0) },
                  ].map((item) => (
                    <div key={item.label} className="rounded-lg bg-secondary/80 px-3 py-2">
                      <p className="text-[10px] uppercase tracking-wider text-muted">{item.label}</p>
                      <p className="mt-0.5 font-medium">{item.value}</p>
                    </div>
                  ))}
                </div>
              </section>

              {data.recent_deposits.length > 0 && (
                <section className="rounded-xl border border-border bg-secondary/50 p-4">
                  <h3 className="mb-3 font-display text-sm font-semibold">{t("admin.userDetail.recentDeposits")}</h3>
                  <div className="space-y-2">
                    {data.recent_deposits.map((d) => (
                      <div key={d.id} className="flex items-center justify-between gap-3 rounded-lg bg-secondary/80 px-3 py-2 text-sm">
                        <span className="min-w-0 truncate text-muted">{d.method} · {formatDate(d.created_at)}</span>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="font-medium">{formatCurrency(d.amount)}</span>
                          <Badge variant={d.status === "completed" ? "success" : "secondary"} className="text-[10px]">{d.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {data.kyc_submissions.length > 0 && (
                <section className="rounded-xl border border-border bg-secondary/50 p-4">
                  <h3 className="mb-3 font-display text-sm font-semibold">{t("admin.userDetail.kycDocs")}</h3>
                  <div className="space-y-2">
                    {data.kyc_submissions.map((k) => (
                      <div key={k.id} className="flex items-center justify-between gap-3 rounded-lg bg-secondary/80 px-3 py-2 text-sm">
                        <span className="min-w-0 truncate">{k.document_type}{k.selfie_url ? " · face" : ""}</span>
                        <div className="flex shrink-0 items-center gap-2">
                          <StatusBadge status={k.status} />
                          {k.document_url && (
                            <button
                              type="button"
                              className="text-emerald hover:underline"
                              onClick={() => {
                                void createKycDocumentSignedUrl(k.document_url).then((url) => {
                                  if (url) window.open(url, "_blank", "noopener,noreferrer");
                                });
                              }}
                              aria-label={t("admin.viewDocument")}
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button asChild variant="outline" size="sm" className="mt-3 border-border">
                    <Link to="/dashboard/admin/kyc">{t("admin.userDetail.reviewKyc")}</Link>
                  </Button>
                </section>
              )}

              <p className="flex items-center gap-1.5 text-xs text-muted">
                <Clock className="h-3.5 w-3.5" />
                {t("admin.userDetail.lastUpdated")}: {formatDate(profile.updated_at)}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
