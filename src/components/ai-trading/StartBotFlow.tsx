import { useTranslation } from "react-i18next";
import {
  Bot, CheckCircle, ChevronRight, Sparkles,
} from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FadeIn } from "@/components/motion/Motion";
import {
  AI_BOTS, BEGINNER_DURATIONS, CRYPTO_ASSETS, RECOMMENDED_BOT_ID, getBotName,
} from "@/constants/ai-bots";
import { formatCurrency, cn } from "@/lib/utils";
import { convertFromUsd } from "@/lib/currency";
import type { StartStep } from "./types";

interface StartBotFlowProps {
  step: StartStep;
  onStepChange: (step: StartStep) => void;
  selectedBot: string;
  onSelectBot: (id: string) => void;
  durationHours: number;
  onDurationChange: (hours: number) => void;
  cryptoAsset: string;
  onCryptoChange: (asset: string) => void;
  amount: string;
  onAmountChange: (value: string) => void;
  balance: number;
  loading: boolean;
  onStart: () => void;
}

export function StartBotFlow({
  step,
  onStepChange,
  selectedBot,
  onSelectBot,
  durationHours,
  onDurationChange,
  cryptoAsset,
  onCryptoChange,
  amount,
  onAmountChange,
  balance,
  loading,
  onStart,
}: StartBotFlowProps) {
  const { t } = useTranslation();
  const bot = AI_BOTS.find((b) => b.id === selectedBot)!;
  const minPower = convertFromUsd(bot.minPower);
  const amountNum = parseFloat(amount) || 0;
  const needsFunds = balance < minPower;
  const canStart = amountNum >= minPower && amountNum <= balance && !needsFunds;

  const presets = [
    { label: t("aiTrading.amountLow"), pct: 0.25 },
    { label: t("aiTrading.amountMid"), pct: 0.5 },
    { label: t("aiTrading.amountMax"), pct: 1 },
  ];

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        {[
          { n: 1 as const, label: t("aiTrading.step1Short") },
          { n: 2 as const, label: t("aiTrading.step2Short") },
        ].map(({ n, label }) => {
          const active = step === n;
          const done = step > n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => done && onStepChange(n)}
              disabled={!done && !active}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "border-emerald/40 bg-emerald/10 text-foreground"
                  : done
                    ? "border-border bg-secondary/40 text-muted hover:text-foreground"
                    : "border-transparent bg-secondary/20 text-muted"
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold",
                  done || active ? "bg-emerald text-white" : "bg-secondary text-muted"
                )}
              >
                {done ? <CheckCircle className="h-3.5 w-3.5" /> : n}
              </span>
              <span className="hidden sm:inline">{label}</span>
            </button>
          );
        })}
      </div>

      {step === 1 && (
        <FadeIn className="space-y-4">
          <div className="rounded-2xl border border-border bg-secondary/30 p-5">
            <h2 className="font-display text-lg font-semibold text-foreground">
              {t("aiTrading.step1Title")}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {t("aiTrading.step1Desc", { bot: getBotName(RECOMMENDED_BOT_ID) })}
            </p>
          </div>

          <div className="space-y-3">
            {AI_BOTS.map((b) => {
              const selected = selectedBot === b.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => onSelectBot(b.id)}
                  className={cn(
                    "w-full rounded-2xl border p-5 text-left transition-all",
                    selected
                      ? "border-emerald/45 bg-emerald/[0.08] ring-1 ring-emerald/20"
                      : "border-border bg-secondary/25 hover:bg-secondary/40"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <span
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                      style={{ backgroundColor: `${b.accent}22`, color: b.accent }}
                    >
                      <Bot className="h-6 w-6" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display font-semibold text-foreground">{b.name}</h3>
                        {b.beginnerFriendly && (
                          <Badge variant="success" className="text-[10px]">
                            {t("aiTrading.recommended")}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted">{b.simpleDescription}</p>
                      <p className="mt-2 text-xs text-muted">
                        {t("aiTrading.startsAt")} {formatCurrency(convertFromUsd(b.minPower))}
                      </p>
                    </div>
                    {selected && <CheckCircle className="h-5 w-5 shrink-0 text-emerald" />}
                  </div>
                </button>
              );
            })}
          </div>

          <Button className="h-12 w-full text-base" onClick={() => onStepChange(2)}>
            {t("aiTrading.continue")}
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </FadeIn>
      )}

      {step === 2 && (
        <FadeIn className="space-y-4">
          <div className="rounded-2xl border border-border bg-secondary/30 p-5">
            <h2 className="font-display text-lg font-semibold text-foreground">
              {t("aiTrading.step2Title")}
            </h2>
            <p className="mt-1 text-sm text-muted">{t("aiTrading.step2Desc")}</p>
          </div>

          <div className="rounded-2xl border border-border bg-secondary/25 p-5">
            <Label className="text-base font-medium">{t("aiTrading.howLong")}</Label>
            <p className="mt-1 text-xs text-muted">{t("aiTrading.howLongHint")}</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {BEGINNER_DURATIONS.map((d) => (
                <button
                  key={d.hours}
                  type="button"
                  onClick={() => onDurationChange(d.hours)}
                  className={cn(
                    "rounded-xl border py-4 text-center transition-colors",
                    durationHours === d.hours
                      ? "border-emerald/40 bg-emerald/10 text-emerald"
                      : "border-border bg-secondary/40 text-foreground hover:border-emerald/25"
                  )}
                >
                  <p className="font-display text-lg font-bold">{d.shortLabel}</p>
                  <p className="mt-0.5 text-[10px] text-muted">{t(d.labelKey)}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-secondary/25 p-5">
            <Label htmlFor="ai-amount" className="text-base font-medium">
              {t("aiTrading.howMuch")}
            </Label>
            <p className="mt-1 text-xs text-muted">
              {t("aiTrading.howMuchHint", { min: formatCurrency(minPower) })}
            </p>
            <Input
              id="ai-amount"
              type="number"
              min={minPower}
              value={amount}
              onChange={(e) => onAmountChange(e.target.value)}
              placeholder={String(minPower)}
              className="mt-3 h-14 text-center text-xl font-bold"
            />
            <div className="mt-3 grid grid-cols-3 gap-2">
              {presets.map(({ label, pct }) => {
                const amt = Math.floor(balance * pct);
                if (amt < minPower) return null;
                return (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => onAmountChange(String(amt))}
                    className="rounded-xl border border-border bg-secondary/40 py-3 text-center hover:border-emerald/30"
                  >
                    <p className="text-xs text-muted">{label}</p>
                    <p className="font-semibold text-emerald">{formatCurrency(amt)}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-secondary/25 p-5">
            <Label className="text-base font-medium">{t("aiTrading.whichCoin")}</Label>
            <p className="mt-1 text-xs text-muted">{t("aiTrading.whichCoinHint")}</p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {CRYPTO_ASSETS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onCryptoChange(c.id)}
                  className={cn(
                    "rounded-xl border py-3 text-center transition-colors",
                    cryptoAsset === c.id
                      ? "border-emerald/40 bg-emerald/10 text-emerald"
                      : "border-border bg-secondary/40 hover:border-emerald/25"
                  )}
                >
                  <p className="font-display font-bold">{c.id}</p>
                  <p className="text-[10px] text-muted">{c.label}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border/70 bg-secondary/15 px-4 py-3 text-xs leading-relaxed text-muted">
            {t("aiTrading.whatHappensNext")}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="h-12 flex-1" onClick={() => onStepChange(1)}>
              {t("aiTrading.back")}
            </Button>
            <Button
              className="h-12 flex-[2] text-base"
              onClick={onStart}
              disabled={loading || !canStart}
            >
              {loading ? t("aiTrading.purchasing") : t("aiTrading.startBot")}
              <Sparkles className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </FadeIn>
      )}
    </div>
  );
}
