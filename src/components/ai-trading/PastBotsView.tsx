import { useTranslation } from "react-i18next";
import { FadeIn } from "@/components/motion/Motion";
import { formatCurrency } from "@/lib/utils";
import type { AISubscription } from "./types";

interface PastBotsViewProps {
  completedSubs: AISubscription[];
}

export function PastBotsView({ completedSubs }: PastBotsViewProps) {
  const { t } = useTranslation();

  return (
    <FadeIn className="rounded-2xl border border-border bg-secondary/25 p-5">
      <h2 className="font-display text-lg font-semibold text-foreground">
        {t("aiTrading.historyTitle")}
      </h2>
      <p className="mt-1 text-sm text-muted">{t("aiTrading.historyDesc")}</p>

      {completedSubs.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted">{t("aiTrading.noHistory")}</p>
      ) : (
        <div className="mt-4 space-y-2.5">
          {completedSubs.map((s) => {
            const profit = Number(s.profit_earned ?? 0);
            const positive = profit >= 0;
            return (
            <div
              key={s.id}
              className="flex items-center justify-between rounded-xl border border-border bg-secondary/40 px-4 py-3.5"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{s.bot_name}</p>
                <p className="text-xs text-muted">
                  {formatCurrency(s.allocation)} · {s.crypto_asset} · {s.duration_hours}h
                </p>
              </div>
              <p className={`shrink-0 font-semibold ${positive ? "text-emerald" : "text-red-500"}`}>
                {positive ? "+" : ""}
                {formatCurrency(profit)}
              </p>
            </div>
            );
          })}
        </div>
      )}
    </FadeIn>
  );
}
