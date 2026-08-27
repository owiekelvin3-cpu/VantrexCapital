import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  ArrowUpFromLine,
  Camera,
  CheckCircle,
  Clock,
  CreditCard,
  FileCheck,
  FileText,
  Globe,
  Lock,
  Shield,
  Sparkles,
  TrendingUp,
  Upload,
  X,
} from "@/lib/icons";
import { DashboardSheet } from "@/components/dashboard/DashboardSheet";
import { FaceVerificationCapture } from "@/components/kyc/FaceVerificationCapture";
import { FadeIn } from "@/components/motion/Motion";
import { BRAND } from "@/constants/brand";
import { getKycStatus, type KycStatus } from "@/lib/kyc";
import {
  ensureValidSession,
  forceRefreshSession,
  formatAuthError,
  isJwtExpiredError,
} from "@/lib/auth-session";
import { cn } from "@/lib/utils";

const DOC_TYPES = [
  { id: "passport", labelKey: "kyc.passport", hintKey: "kyc.docPassportHint", icon: Globe },
  { id: "drivers_license", labelKey: "kyc.driversLicense", hintKey: "kyc.docLicenseHint", icon: CreditCard },
  { id: "national_id", labelKey: "kyc.nationalId", hintKey: "kyc.docIdHint", icon: FileText },
] as const;

const MAX_BYTES = 10 * 1024 * 1024;
type WizardStep = 1 | 2 | 3 | 4;

function statusMeta(status: KycStatus) {
  if (status === "approved") {
    return {
      badgeClass: "border-emerald/30 bg-emerald/10 text-emerald",
      labelKey: "dashboard.verified" as const,
    };
  }
  if (status === "pending") {
    return {
      badgeClass: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
      labelKey: "dashboard.kycPending" as const,
    };
  }
  if (status === "rejected") {
    return {
      badgeClass: "border-red-500/30 bg-red-500/10 text-red-500",
      labelKey: "dashboard.kycRejected" as const,
    };
  }
  return {
    badgeClass: "border-border bg-secondary/60 text-muted",
    labelKey: "dashboard.kycNone" as const,
  };
}

export default function KYCPage() {
  const { t } = useTranslation();
  const { user, profile, refreshProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [docType, setDocType] = useState<(typeof DOC_TYPES)[number]["id"]>("passport");
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [step, setStep] = useState<WizardStep>(1);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const status = getKycStatus(profile);
  const meta = statusMeta(status);
  const canSubmit = status === "none" || status === "rejected";

  const wizardSteps = useMemo(
    () => [
      { n: 1 as const, label: t("kyc.stepDocument") },
      { n: 2 as const, label: t("kyc.stepUpload") },
      { n: 3 as const, label: t("kyc.stepFace") },
      { n: 4 as const, label: t("kyc.stepConfirm") },
    ],
    [t]
  );

  const unlockPoints = useMemo(
    () => [
      { icon: ArrowDownToLine, label: t("kyc.unlockDeposits") },
      { icon: ArrowUpFromLine, label: t("kyc.unlockWithdrawals") },
      { icon: TrendingUp, label: t("kyc.unlockTrading") },
    ],
    [t]
  );

  const tips = useMemo(
    () => [t("kyc.tipClear"), t("kyc.tipCorners"), t("kyc.tipReadable"), t("kyc.tipMatch")],
    [t]
  );

  const trustChips = useMemo(
    () => [
      { icon: Lock, label: t("kyc.secureBadge") },
      { icon: Clock, label: t("kyc.etaBadge") },
      { icon: Camera, label: t("kyc.trustFaceTitle") },
    ],
    [t]
  );

  useEffect(() => {
    if (!file || !file.type.startsWith("image/")) {
      setFilePreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      return;
    }
    const url = URL.createObjectURL(file);
    setFilePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!selfie) {
      setSelfiePreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      return;
    }
    const url = URL.createObjectURL(selfie);
    setSelfiePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [selfie]);

  const pickFile = (next: File | null) => {
    setError("");
    setSuccess("");
    if (!next) {
      setFile(null);
      return;
    }
    const allowed = /^(image\/(jpeg|jpg|png|webp)|application\/pdf)$/i.test(next.type);
    if (!allowed) {
      setError(t("kyc.errorFileType"));
      setFile(null);
      return;
    }
    if (next.size > MAX_BYTES) {
      setError(t("kyc.errorFileSize"));
      setFile(null);
      return;
    }
    setFile(next);
  };

  const canContinue =
    step === 1 ||
    (step === 2 && Boolean(file)) ||
    (step === 3 && Boolean(selfie));

  const goNext = () => {
    setError("");
    if (step === 1) setStep(2);
    else if (step === 2) {
      if (!file) {
        setError(t("kyc.errorNoFile"));
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!selfie) {
        setError(t("kyc.errorNoFace"));
        return;
      }
      setStep(4);
    }
  };

  const goBack = () => {
    setError("");
    if (step > 1) setStep((s) => (s - 1) as WizardStep);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!user || !file) {
      setError(t("kyc.errorNoFile"));
      setStep(2);
      return;
    }
    if (!selfie) {
      setError(t("kyc.errorNoFace"));
      setStep(3);
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    const stamp = Date.now();
    const safeName = file.name.replace(/[^\w.-]+/g, "_").slice(0, 80);
    const docPath = `${user.id}/${stamp}-${safeName}`;
    const selfiePath = `${user.id}/${stamp}-face-selfie.jpg`;

    const sessionOk = await ensureValidSession();
    if (!sessionOk) {
      setError(t("auth.sessionExpired"));
      setLoading(false);
      return;
    }

    const uploadWithRefresh = async (path: string, body: File, contentType: string) => {
      const first = await supabase.storage.from("kyc-documents").upload(path, body, {
        cacheControl: "3600",
        upsert: false,
        contentType,
      });
      if (!first.error || !isJwtExpiredError(first.error)) return first;
      const refreshed = await forceRefreshSession();
      if (!refreshed) return first;
      return supabase.storage.from("kyc-documents").upload(path, body, {
        cacheControl: "3600",
        upsert: false,
        contentType,
      });
    };

    const { error: uploadError } = await uploadWithRefresh(docPath, file, file.type);
    if (uploadError) {
      setError(formatAuthError(uploadError, t("auth.sessionExpired")));
      setLoading(false);
      return;
    }

    const { error: selfieError } = await uploadWithRefresh(selfiePath, selfie, "image/jpeg");
    if (selfieError) {
      setError(formatAuthError(selfieError, t("auth.sessionExpired")));
      setLoading(false);
      return;
    }

    const insertOnce = () =>
      supabase.from("kyc_submissions").insert({
        user_id: user.id,
        document_type: docType,
        document_url: docPath,
        selfie_url: selfiePath,
        face_captured_at: new Date().toISOString(),
        status: "approved",
      });

    let { error: insertError } = await insertOnce();
    if (insertError && isJwtExpiredError(insertError)) {
      const refreshed = await forceRefreshSession();
      if (refreshed) {
        ({ error: insertError } = await insertOnce());
      }
    }

    if (insertError) {
      setError(formatAuthError(insertError, t("auth.sessionExpired")));
      setLoading(false);
      return;
    }

    await supabase.from("profiles").update({ kyc_status: "approved" }).eq("id", user.id);
    await refreshProfile();
    setFile(null);
    setSelfie(null);
    setStep(1);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setSuccess(t("kyc.submitted"));
    setLoading(false);
  };

  const selectedDoc = DOC_TYPES.find((d) => d.id === docType)!;
  const progressPct = (step / wizardSteps.length) * 100;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader
        eyebrow={t("dashboard.navGroupAccount")}
        title={t("dashboard.kyc")}
        subtitle={t("kyc.subtitle")}
      />

      <FadeIn>
        <section
          className={cn(
            "relative overflow-hidden rounded-[1.75rem] border border-border px-5 py-5 sm:px-6 sm:py-6",
            status === "approved"
              ? "bg-emerald/[0.07]"
              : status === "rejected"
                ? "bg-red-500/[0.05]"
                : "bg-card"
          )}
        >
          <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-emerald/10 blur-3xl" />
          <div className="relative flex gap-3.5">
            <div
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
                status === "approved"
                  ? "bg-emerald/15 text-emerald"
                  : status === "pending"
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                    : status === "rejected"
                      ? "bg-red-500/15 text-red-500"
                      : "bg-emerald/10 text-emerald"
              )}
            >
              {status === "approved" ? (
                <CheckCircle className="h-6 w-6" />
              ) : status === "pending" ? (
                <Clock className="h-6 w-6" />
              ) : (
                <Shield className="h-6 w-6" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-lg font-semibold text-foreground">
                  {status === "approved"
                    ? t("kyc.statusApprovedTitle")
                    : status === "pending"
                      ? t("kyc.statusPendingTitle")
                      : status === "rejected"
                        ? t("kyc.statusRejectedTitle")
                        : t("kyc.statusNoneTitle")}
                </h2>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
                    meta.badgeClass
                  )}
                >
                  {t(meta.labelKey)}
                </span>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                {status === "approved"
                  ? t("kyc.approvedDesc")
                  : status === "pending"
                    ? t("kyc.pendingDesc")
                    : status === "rejected"
                      ? t("kyc.rejectedDesc")
                      : t("kyc.introDesc")}
              </p>
            </div>
          </div>

          {canSubmit && (
            <div className="relative mt-5">
              <div className="mb-2 flex items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                <span>{t("kyc.wizardOf", { current: step, total: wizardSteps.length })}</span>
                <span className="normal-case tracking-normal text-foreground/70">
                  {wizardSteps[step - 1]?.label}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-emerald transition-all duration-500 ease-out"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <ol className="mt-3 hidden gap-1.5 sm:grid sm:grid-cols-4">
                {wizardSteps.map((s) => {
                  const done = step > s.n;
                  const current = step === s.n;
                  return (
                    <li
                      key={s.n}
                      className={cn(
                        "flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium transition-colors",
                        done || current ? "text-foreground" : "text-muted"
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                          done
                            ? "bg-emerald text-white"
                            : current
                              ? "bg-emerald/15 text-emerald ring-1 ring-emerald/30"
                              : "bg-secondary text-muted"
                        )}
                      >
                        {done ? <CheckCircle className="h-3 w-3" /> : s.n}
                      </span>
                      <span className="truncate">{s.label}</span>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}
        </section>
      </FadeIn>

      {status === "approved" ? (
        <FadeIn delay={0.05}>
          <DashboardSheet>
            <div className="flex items-start gap-3 rounded-2xl border border-emerald/20 bg-emerald/[0.06] p-4">
              <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-emerald" />
              <div>
                <p className="text-sm font-semibold text-foreground">{t("kyc.statusApprovedTitle")}</p>
                <p className="mt-1 text-sm text-muted">{t("kyc.approvedSupport", { brand: BRAND.name })}</p>
              </div>
            </div>
            <div className="mt-5 grid gap-2.5 sm:grid-cols-3">
              {unlockPoints.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-2xl border border-border/70 bg-secondary/25 px-4 py-3.5"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald/10 text-emerald">
                    <Icon className="h-4 w-4" />
                  </span>
                  <p className="text-sm font-medium text-foreground">{label}</p>
                </div>
              ))}
            </div>
          </DashboardSheet>
        </FadeIn>
      ) : status === "pending" ? (
        <FadeIn delay={0.05}>
          <DashboardSheet>
            <div className="mx-auto max-w-md text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Clock className="h-7 w-7" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold text-foreground">
                {t("kyc.pendingCardTitle")}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{t("kyc.pendingCardDesc")}</p>
              <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/40 px-3 py-1.5 text-xs font-medium text-muted">
                <Clock className="h-3.5 w-3.5" />
                {t("kyc.pendingEta")}
              </p>
            </div>
            <ul className="mt-8 space-y-3 border-t border-border/70 pt-6">
              {[t("kyc.pendingPoint1"), t("kyc.pendingPoint2"), t("kyc.pendingPoint3")].map((point) => (
                <li key={point} className="flex gap-2.5 text-sm text-muted">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald" />
                  {point}
                </li>
              ))}
            </ul>
          </DashboardSheet>
        </FadeIn>
      ) : canSubmit ? (
        <FadeIn delay={0.05}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <DashboardSheet className="!py-5 sm:!py-6">
              {status === "rejected" && step === 1 && (
                <div className="mb-5 rounded-2xl border border-red-500/25 bg-red-500/[0.06] px-4 py-3 text-sm text-red-500">
                  {t("kyc.rejectedBanner")}
                </div>
              )}

              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-display text-base font-semibold text-foreground">
                      {t("kyc.documentType")}
                    </h3>
                    <p className="mt-1 text-sm text-muted">{t("kyc.documentTypeHint")}</p>
                  </div>
                  <div className="grid gap-2.5">
                    {DOC_TYPES.map((doc) => {
                      const Icon = doc.icon;
                      const selected = docType === doc.id;
                      return (
                        <button
                          key={doc.id}
                          type="button"
                          onClick={() => setDocType(doc.id)}
                          className={cn(
                            "flex items-center gap-3.5 rounded-2xl border px-4 py-3.5 text-left transition-all",
                            selected
                              ? "border-emerald/40 bg-emerald/[0.08] ring-1 ring-emerald/20"
                              : "border-border bg-secondary/20 hover:border-border hover:bg-secondary/40"
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
                              selected ? "bg-emerald/15 text-emerald" : "bg-secondary text-muted"
                            )}
                          >
                            <Icon className="h-5 w-5" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold text-foreground">
                              {t(doc.labelKey)}
                            </span>
                            <span className="mt-0.5 block text-xs text-muted">{t(doc.hintKey)}</span>
                          </span>
                          <span
                            className={cn(
                              "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                              selected
                                ? "border-emerald bg-emerald text-white"
                                : "border-border text-transparent"
                            )}
                          >
                            <CheckCircle className="h-3 w-3" />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-display text-base font-semibold text-foreground">
                      {t("kyc.uploadDocument")}
                    </h3>
                    <p className="mt-1 text-sm text-muted">{t("kyc.uploadHint")}</p>
                  </div>

                  <input
                    ref={fileInputRef}
                    id="kyc-document"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf,.pdf,.jpg,.jpeg,.png,.webp"
                    className="sr-only"
                    onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
                  />

                  {!file ? (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      onDragEnter={(e) => {
                        e.preventDefault();
                        setDragging(true);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragging(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        setDragging(false);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragging(false);
                        pickFile(e.dataTransfer.files?.[0] ?? null);
                      }}
                      className={cn(
                        "flex w-full flex-col items-center justify-center gap-3 rounded-[1.5rem] border border-dashed px-4 py-12 text-center transition-all",
                        dragging
                          ? "border-emerald bg-emerald/[0.08] scale-[1.01]"
                          : "border-border bg-secondary/15 hover:border-emerald/40 hover:bg-emerald/[0.04]"
                      )}
                    >
                      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald/10 text-emerald">
                        <Upload className="h-6 w-6" />
                      </span>
                      <span className="text-sm font-semibold text-foreground">{t("kyc.dropHint")}</span>
                      <span className="max-w-xs text-xs text-muted">{t("kyc.uploadFormats")}</span>
                    </button>
                  ) : (
                    <div className="overflow-hidden rounded-[1.5rem] border border-border bg-secondary/20">
                      {filePreview ? (
                        <div className="relative aspect-[16/10] bg-[#0a0a0b]">
                          <img
                            src={filePreview}
                            alt=""
                            className="h-full w-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="flex aspect-[16/10] flex-col items-center justify-center gap-2 bg-secondary/40">
                          <FileCheck className="h-10 w-10 text-emerald" />
                          <p className="text-xs font-medium text-muted">PDF</p>
                        </div>
                      )}
                      <div className="flex items-center gap-3 px-4 py-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
                          <p className="text-xs text-muted">
                            {(file.size / (1024 * 1024)).toFixed(2)} MB · {t(selectedDoc.labelKey)}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          {t("kyc.changeFile")}
                        </Button>
                        <button
                          type="button"
                          onClick={() => {
                            pickFile(null);
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                          className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-secondary hover:text-foreground"
                          aria-label={t("kyc.removeFile")}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  <ul className="space-y-2 rounded-2xl border border-border/70 bg-secondary/15 p-3.5">
                    {tips.map((tip) => (
                      <li key={tip} className="flex gap-2 text-xs leading-relaxed text-muted">
                        <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {step === 3 && (
                <FaceVerificationCapture
                  value={selfie}
                  onChange={(next) => {
                    setError("");
                    setSelfie(next);
                  }}
                  disabled={loading}
                />
              )}

              {step === 4 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="font-display text-base font-semibold text-foreground">
                      {t("kyc.reviewTitle")}
                    </h3>
                    <p className="mt-1 text-sm text-muted">{t("kyc.reviewDesc")}</p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="overflow-hidden rounded-2xl border border-border bg-secondary/20">
                      <div className="aspect-[4/3] bg-[#0a0a0b]">
                        {filePreview ? (
                          <img src={filePreview} alt="" className="h-full w-full object-contain" />
                        ) : (
                          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted">
                            <FileCheck className="h-8 w-8 text-emerald" />
                            <span className="text-xs">PDF</span>
                          </div>
                        )}
                      </div>
                      <div className="px-3.5 py-3">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                          {t("kyc.reviewDocLabel")}
                        </p>
                        <p className="mt-1 truncate text-sm font-medium text-foreground">
                          {t(selectedDoc.labelKey)}
                        </p>
                        <button
                          type="button"
                          className="mt-1 text-xs font-medium text-emerald hover:underline"
                          onClick={() => setStep(2)}
                        >
                          {t("kyc.changeFile")}
                        </button>
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-border bg-secondary/20">
                      <div className="aspect-[4/3] bg-[#0a0a0b]">
                        {selfiePreview ? (
                          <img src={selfiePreview} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-muted">
                            <Camera className="h-8 w-8" />
                          </div>
                        )}
                      </div>
                      <div className="px-3.5 py-3">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                          {t("kyc.reviewFaceLabel")}
                        </p>
                        <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-emerald">
                          <CheckCircle className="h-3.5 w-3.5" />
                          {t("kyc.faceCaptured")}
                        </p>
                        <button
                          type="button"
                          className="mt-1 text-xs font-medium text-emerald hover:underline"
                          onClick={() => setStep(3)}
                        >
                          {t("kyc.faceRetake")}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-secondary/20 px-4 py-3">
                    <Clock className="h-4 w-4 shrink-0 text-emerald" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted">{t("kyc.reviewEta")}</p>
                      <p className="text-sm font-semibold text-foreground">{t("kyc.reviewEtaValue")}</p>
                    </div>
                  </div>
                </div>
              )}

              {(error || success) && (
                <p
                  className={cn(
                    "mt-5 rounded-xl px-3 py-2.5 text-sm",
                    error
                      ? "border border-red-500/25 bg-red-500/[0.06] text-red-400"
                      : "border border-emerald/25 bg-emerald/[0.06] text-emerald"
                  )}
                >
                  {error || success}
                </p>
              )}
            </DashboardSheet>

            <div className="flex items-center gap-2 pt-1">
              {step > 1 ? (
                <Button type="button" variant="outline" className="shrink-0 rounded-full px-3 sm:px-4" onClick={goBack}>
                  <ArrowLeft className="h-4 w-4" />
                  <span className="max-sm:sr-only">{t("kyc.back")}</span>
                </Button>
              ) : null}
              <div className="ml-auto flex min-w-0 flex-1 justify-end gap-2 sm:flex-none">
                {step < 4 ? (
                  <Button
                    type="button"
                    variant="pill"
                    disabled={!canContinue}
                    onClick={goNext}
                    className="min-w-0 flex-1 sm:min-w-[8.5rem] sm:flex-none"
                  >
                    {t("kyc.continue")}
                    <ArrowRight className="h-4 w-4 shrink-0" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    variant="pill"
                    disabled={loading || !file || !selfie}
                    className="min-w-0 flex-1 sm:min-w-[10rem] sm:flex-none"
                  >
                    <Shield className="h-4 w-4 shrink-0" />
                    {loading ? t("common.saving") : t("kyc.submit")}
                  </Button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              {trustChips.map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-secondary/30 px-3 py-1.5 text-[11px] font-medium text-muted"
                >
                  <Icon className="h-3 w-3 text-emerald" />
                  {label}
                </span>
              ))}
            </div>
          </form>
        </FadeIn>
      ) : null}
    </div>
  );
}
