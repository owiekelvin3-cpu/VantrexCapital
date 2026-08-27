import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft, ArrowRight, Bot, Sparkles, TrendingUp, X,
} from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { markWalkthroughSeen } from "@/lib/ai-trading-onboarding";
import { getBotName, RECOMMENDED_BOT_ID } from "@/constants/ai-bots";

interface AITradingWalkthroughProps {
  userId: string;
  open: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

const STEP_ICONS = [Sparkles, Bot, TrendingUp] as const;

export default function AITradingWalkthrough({
  userId, open, onClose, onComplete,
}: AITradingWalkthroughProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const recommendedBot = getBotName(RECOMMENDED_BOT_ID);
  const withBot = (text?: string) => text?.replaceAll("{{bot}}", recommendedBot) ?? "";

  const steps = t("aiTrading.walkthrough.steps", { returnObjects: true }) as Array<{
    title: string;
    body: string;
    tip?: string;
  }>;
  const total = Array.isArray(steps) ? steps.length : 0;

  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  const finish = () => {
    markWalkthroughSeen(userId);
    onClose();
    onComplete?.();
  };

  const handleSkip = () => {
    markWalkthroughSeen(userId);
    onClose();
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        markWalkthroughSeen(userId);
        onClose();
      }
      if (e.key === "ArrowRight" && step < total - 1) setStep((s) => s + 1);
      if (e.key === "ArrowLeft" && step > 0) setStep((s) => s - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, step, total, userId, onClose]);

  if (!open || total === 0) return null;

  const isLast = step === total - 1;
  const current = steps[step];
  const Icon = STEP_ICONS[step] ?? Sparkles;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-walkthrough-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-label={t("aiTrading.walkthrough.close")}
        onClick={handleSkip}
      />

      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-void shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-emerald">
              {t("aiTrading.walkthrough.badge")}
            </p>
            <p className="text-xs text-muted">
              {t("aiTrading.walkthrough.progress", { current: step + 1, total })}
            </p>
          </div>
          <button
            type="button"
            onClick={handleSkip}
            className="rounded-lg p-2 text-muted transition-colors hover:bg-secondary hover:text-foreground"
            aria-label={t("aiTrading.walkthrough.skip")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex justify-center gap-1.5 px-5 pt-4">
          {steps.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setStep(i)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === step ? "w-6 bg-emerald" : i < step ? "w-3 bg-emerald/50" : "w-3 bg-white/10"
              )}
              aria-label={t("aiTrading.walkthrough.goToStep", { step: i + 1 })}
            />
          ))}
        </div>

        <div className="px-5 py-6">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald/10 text-emerald">
            <Icon className="h-7 w-7" />
          </div>

          <h2 id="ai-walkthrough-title" className="font-display text-xl font-bold text-foreground">
            {current?.title}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">{withBot(current?.body)}</p>

          {current?.tip && (
            <div className="mt-4 rounded-xl border border-emerald/20 bg-emerald/5 px-4 py-3">
              <p className="text-xs leading-relaxed text-emerald/90">{withBot(current.tip)}</p>
            </div>
          )}

          {step === 1 && (
            <div className="mt-5 space-y-2">
              {(["pickBot", "setPlan", "watch"] as const).map((key, i) => (
                <div
                  key={key}
                  className="flex items-center gap-3 rounded-xl border border-border bg-secondary/50 px-4 py-3"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald/20 text-xs font-bold text-emerald">
                    {i + 1}
                  </span>
                  <span className="text-sm">
                    {t(`aiTrading.walkthrough.flow.${key}`, { bot: recommendedBot })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-4">
          <Button variant="ghost" size="sm" className="text-muted" onClick={handleSkip}>
            {t("aiTrading.walkthrough.skip")}
          </Button>

          <div className="flex gap-2">
            {step > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="border-border"
                onClick={() => setStep((s) => s - 1)}
              >
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                {t("aiTrading.back")}
              </Button>
            )}
            {isLast ? (
              <Button size="sm" onClick={finish}>
                {t("aiTrading.walkthrough.start")}
                <Sparkles className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button size="sm" onClick={() => setStep((s) => s + 1)}>
                {t("aiTrading.walkthrough.next")}
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
