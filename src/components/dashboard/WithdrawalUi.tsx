import { Link } from "react-router-dom";
import {
  Wallet, ArrowDownToLine, ArrowLeft, Shield, Clock, CheckCircle, AlertTriangle, Coins,
} from "@/lib/icons";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { FadeIn } from "@/components/motion/Motion";
import type { UserFee } from "@/types/database";

export function WithdrawPageHeader({
  title,
  subtitle,
  backTo = "/dashboard",
}: {
  title: string;
  subtitle?: string;
  backTo?: string;
}) {
  const { t } = useTranslation();
  return (
    <FadeIn className="mb-6 sm:mb-8">
      <Link
        to={backTo}
        className="mb-4 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-secondary/40">
          <ArrowLeft className="h-4 w-4" />
        </span>
        {t("common.back")}
      </Link>
      <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
      {subtitle && <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-muted">{subtitle}</p>}
    </FadeIn>
  );
}

export function WithdrawalBalanceBanner({ balance }: { balance: number }) {
  const { t } = useTranslation();

  return (
    <div className="rounded-2xl border border-border bg-card px-5 py-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-secondary/50 text-muted">
            <Wallet className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              {t("withdrawals.availableBalance")}
            </p>
            <p className="mt-0.5 font-display text-3xl font-semibold tracking-tight text-foreground">
              {formatCurrency(balance)}
            </p>
          </div>
        </div>

        {balance > 0 ? (
          <p className="max-w-xs text-xs leading-relaxed text-muted sm:text-right">
            {t("withdrawals.balanceHint")}
          </p>
        ) : (
          <Button asChild size="sm" variant="outline">
            <Link to="/dashboard/deposits">
              <ArrowDownToLine className="h-4 w-4" />
              {t("withdrawals.addFunds")}
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}

export function OutstandingFeesPanel({
  fees,
}: {
  fees: UserFee[];
  balance?: number;
  onPaid?: () => void | Promise<void>;
}) {
  const { t } = useTranslation();
  const total = fees.reduce((sum, f) => sum + Number(f.amount), 0);

  if (fees.length === 0) return null;

  return (
    <div className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.06] p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
          <AlertTriangle className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-sm font-semibold text-foreground">
            {t("withdrawals.feesRequiredTitle")}
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-muted sm:text-sm">
            {t("withdrawals.feesRequiredDesc")}
          </p>
          <p className="mt-2 text-sm font-medium text-foreground">
            {t("withdrawals.feesOutstandingTotal", { amount: formatCurrency(total) })}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {fees.map((fee) => (
          <div
            key={fee.id}
            className="flex flex-col gap-3 rounded-xl border border-border bg-card/60 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Coins className="h-3.5 w-3.5 text-muted" />
                {fee.label}
              </p>
              {fee.notes && <p className="mt-1 text-xs text-muted">{fee.notes}</p>}
            </div>
            <span className="font-semibold text-foreground">{formatCurrency(Number(fee.amount))}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted">{t("withdrawals.feesNeedDeposit")}</p>
        <Button asChild size="sm">
          <Link to="/dashboard/deposits">{t("withdrawals.depositFeesCta")}</Link>
        </Button>
      </div>
    </div>
  );
}

export function WithdrawalSecurityCard() {
  const { t } = useTranslation();

  return (
    <div className="flex gap-3 rounded-2xl border border-border/70 bg-secondary/30 px-4 py-3.5">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald/12 text-emerald">
        <Shield className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 space-y-1 text-xs leading-relaxed text-muted sm:text-sm">
        <p className="font-medium text-foreground">{t("withdrawals.secureTitle")}</p>
        <p>{t("withdrawals.securityNote")}</p>
      </div>
    </div>
  );
}

export function WithdrawalFormPanel({
  title,
  description,
  children,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      {title && <h2 className="font-display text-base font-semibold text-foreground">{title}</h2>}
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      <div className={title || description ? "mt-5 space-y-4" : "space-y-4"}>{children}</div>
    </div>
  );
}

export function WithdrawalHistoryPanel({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <Clock className="h-4 w-4 text-muted" />
        <h2 className="font-display text-base font-semibold text-foreground">{t("withdrawals.recent")}</h2>
      </div>
      {children}
    </div>
  );
}

export function WithdrawalAlert({
  type,
  children,
}: {
  type: "error" | "success";
  children: React.ReactNode;
}) {
  return (
    <p
      className={cn(
        "flex items-center gap-2 rounded-xl border px-4 py-3 text-sm",
        type === "success"
          ? "border-emerald/30 bg-emerald/10 text-emerald"
          : "border-red-500/30 bg-red-500/10 text-red-400"
      )}
    >
      {type === "success" ? <CheckCircle className="h-4 w-4 shrink-0" /> : null}
      {children}
    </p>
  );
}

interface WithdrawalAmountFieldProps {
  id?: string;
  balance: number;
  amount: string;
  onChange: (value: string) => void;
  min?: number;
  hint?: string;
}

export function WithdrawalAmountField({
  id = "amount",
  balance,
  amount,
  onChange,
  min = 10,
  hint,
}: WithdrawalAmountFieldProps) {
  const { t } = useTranslation();

  const presets = [
    { label: "25%", pct: 0.25 },
    { label: "50%", pct: 0.5 },
    { label: t("withdrawals.max"), pct: 1 },
  ];

  return (
    <div className="rounded-xl border border-border bg-secondary/20 p-4">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id} className="text-sm font-medium">
          {t("withdrawals.amountUsd")}
        </Label>
        <span className="text-xs text-muted">
          {formatCurrency(balance)} {t("withdrawals.availableShort")}
        </span>
      </div>
      <div className="relative mt-2">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-muted">
          $
        </span>
        <Input
          id={id}
          type="number"
          min={min}
          step="0.01"
          max={balance}
          value={amount}
          onChange={(e) => onChange(e.target.value)}
          required
          className="h-12 pl-8 text-lg font-semibold"
        />
      </div>
      {balance > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {presets.map(({ label, pct }) => {
            const val = pct === 1 ? balance : Math.floor(balance * pct * 100) / 100;
            if (val < min) return null;
            return (
              <button
                key={label}
                type="button"
                onClick={() => onChange(val.toString())}
                className={cn(
                  "rounded-lg border py-2 text-center text-sm transition-colors",
                  amount === val.toString()
                    ? "border-border bg-secondary text-foreground"
                    : "border-border bg-card text-muted hover:bg-secondary/60 hover:text-foreground"
                )}
              >
                <span className="block text-[10px] uppercase tracking-wider opacity-70">{label}</span>
                <span className="font-semibold">{formatCurrency(val)}</span>
              </button>
            );
          })}
        </div>
      )}
      {hint && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted">
          <Clock className="h-3 w-3" />
          {hint}
        </p>
      )}
    </div>
  );
}

/** Confirm step before submitting a withdrawal request. */
export function WithdrawalConfirmBar({
  amount,
  methodLabel,
  loading,
  onCancel,
  onConfirm,
}: {
  amount: number;
  methodLabel: string;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3 rounded-xl border border-border bg-secondary/30 p-4">
      <p className="text-sm text-foreground">
        {t("withdrawals.confirmBody", {
          amount: formatCurrency(amount),
          method: methodLabel,
        })}
      </p>
      <p className="text-xs leading-relaxed text-muted">{t("withdrawals.confirmHint")}</p>
      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          {t("common.cancel")}
        </Button>
        <Button type="button" onClick={onConfirm} disabled={loading}>
          {loading ? t("withdrawals.submitting") : t("withdrawals.confirmSubmit")}
        </Button>
      </div>
    </div>
  );
}
