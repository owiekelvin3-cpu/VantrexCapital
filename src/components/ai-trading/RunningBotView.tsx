import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Bot, Clock, Sparkles } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AiBotTradingAnimation } from "./AiBotTradingAnimation";
import { FadeIn } from "@/components/motion/Motion";
import {
  computeLiveProfit,
  computeMarketPnL,
  formatCountdown,
  getRunProgress,
} from "@/lib/ai-trading";
import { supabase } from "@/lib/supabase";
import { formatCurrency, cn } from "@/lib/utils";
import type { AISubscription } from "./types";

interface RunningBotViewProps {
  activeSubs: AISubscription[];
  selectedSub: AISubscription | null;
  onSelectSub: (id: string) => void;
  tick: number;
  onStartAnother: () => void;
}

export function RunningBotView({
  activeSubs,
  selectedSub,
  onSelectSub,
  tick,
  onStartAnother,
}: RunningBotViewProps) {
  const { t } = useTranslation();
  const [markPrice, setMarkPrice] = useState<number | null>(null);

  useEffect(() => {
    setMarkPrice(selectedSub?.last_mark_price ? Number(selectedSub.last_mark_price) : null);
  }, [selectedSub?.id, selectedSub?.last_mark_price]);

  useEffect(() => {
    if (!selectedSub?.id || !markPrice || markPrice <= 0) return;

    const pushMark = () => {
      void supabase.rpc("mark_ai_bot_market_pnl", {
        p_subscription_id: selectedSub.id,
        p_mark_price: markPrice,
      });
    };

    pushMark();
    const id = window.setInterval(pushMark, 8000);
    return () => window.clearInterval(id);
  }, [selectedSub?.id, markPrice]);

  if (activeSubs.length === 0 || !selectedSub) {
    return (
      <FadeIn className="rounded-2xl border border-border bg-secondary/25 py-16 text-center">
        <Bot className="mx-auto h-12 w-12 text-muted" />
        <p className="mt-4 font-medium text-foreground">{t("aiTrading.noActiveBots")}</p>
        <p className="mt-1 text-sm text-muted">{t("aiTrading.noActiveBotsDesc")}</p>
        <Button className="mt-6" onClick={onStartAnother}>
          {t("aiTrading.startNow")}
          <Sparkles className="ml-2 h-4 w-4" />
        </Button>
      </FadeIn>
    );
  }

  const earnings = computeLiveProfit(selectedSub, markPrice);
  const entry = Number(selectedSub.entry_price ?? 0);
  const marketMove =
    entry > 0 && markPrice && markPrice > 0
      ? computeMarketPnL(selectedSub.allocation, entry, markPrice)
      : null;
  const progress = getRunProgress(selectedSub);
  const earningsPositive = earnings >= 0;
  const movePct =
    entry > 0 && markPrice && markPrice > 0 ? ((markPrice - entry) / entry) * 100 : null;

  return (
    <FadeIn className="space-y-4">
      {activeSubs.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {activeSubs.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelectSub(s.id)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                selectedSub.id === s.id
                  ? "border-emerald/40 bg-emerald/10 text-emerald"
                  : "border-border text-muted hover:text-foreground"
              )}
            >
              {s.bot_name}
            </button>
          ))}
        </div>
      )}

      <div className="overflow-hidden rounded-[1.75rem] border border-emerald/25 bg-gradient-to-br from-emerald/10 via-emerald/[0.04] to-transparent p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-emerald">
              {t("aiTrading.botRunning")}
            </p>
            <h2 className="mt-1 font-display text-xl font-bold text-foreground sm:text-2xl">
              {selectedSub.bot_name}
            </h2>
            <p className="mt-1 text-xs text-muted">
              {selectedSub.crypto_asset} · {formatCurrency(selectedSub.allocation)}
            </p>
          </div>
          <Badge variant="success" className="gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald opacity-70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald" />
            </span>
            {t("aiTrading.running")}
          </Badge>
        </div>

        <AiBotTradingAnimation
          key={selectedSub.id}
          cryptoAsset={selectedSub.crypto_asset || "BTC"}
          botName={selectedSub.bot_name}
          onMarkPrice={setMarkPrice}
        />

        <div className="mt-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            {t("aiTrading.earningsSoFar")}
          </p>
          <p
            className={cn(
              "mt-2 font-display text-4xl font-bold sm:text-5xl transition-colors duration-300",
              earningsPositive ? "text-emerald" : "text-red-500"
            )}
            key={`${tick}-${earnings}`}
          >
            {earningsPositive ? "+" : ""}
            {formatCurrency(earnings)}
          </p>
          {movePct != null && (
            <p
              className={cn(
                "mt-1 text-sm font-semibold tabular-nums",
                movePct >= 0 ? "text-emerald" : "text-red-500"
              )}
            >
              {selectedSub.crypto_asset} {movePct >= 0 ? "+" : ""}
              {movePct.toFixed(2)}%
              {marketMove != null && (
                <span className="ml-2 font-normal text-muted">
                  ({marketMove >= 0 ? "+" : ""}
                  {formatCurrency(marketMove)})
                </span>
              )}
            </p>
          )}
          <p className="mt-2 text-xs text-muted">{t("aiTrading.marketLinkedHint")}</p>
        </div>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-xs text-muted">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {t("aiTrading.timeRemaining")}
            </span>
            <span className="font-mono font-semibold text-foreground" key={`t-${tick}`}>
              {selectedSub.expires_at ? formatCountdown(selectedSub.expires_at) : "—"}
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-emerald transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <p className="mt-4 text-center text-sm text-muted">{t("aiTrading.moneyBackNote")}</p>
      </div>

      <Button variant="outline" className="w-full" onClick={onStartAnother}>
        {t("aiTrading.buyAnother")}
      </Button>
    </FadeIn>
  );
}
