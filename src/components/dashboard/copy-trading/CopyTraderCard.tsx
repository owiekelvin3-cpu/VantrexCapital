import { motion } from "framer-motion";
import type { CopyTraderProfile } from "@/lib/copy-traders";
import { formatPercent } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { RefreshCw, Star, TrendingUp, Users } from "@/lib/icons";
import { TraderAvatar } from "./TraderAvatar";

export function CopyTraderCard({
  trader,
  index,
  isActive,
  loading,
  onCopy,
  onUncopy,
}: {
  trader: CopyTraderProfile;
  index: number;
  isActive: boolean;
  loading: boolean;
  onCopy: () => void;
  onUncopy: () => void;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3 }}
      className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-4 sm:p-5"
    >
      <div className="flex items-start gap-3">
        <TraderAvatar trader={trader} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="truncate text-[15px] font-bold text-foreground">{trader.name}</h3>
            {trader.verified && (
              <span
                className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#3b82f6] text-[9px] font-bold text-white"
                title="Verified trader"
              >
                ✓
              </span>
            )}
            {trader.badge && (
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                {trader.badge}
              </span>
            )}
          </div>
          <p className="text-xs text-muted">{trader.handle}</p>
          <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-muted">{trader.bio}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3 text-[11px] text-muted">
        <span className="inline-flex items-center gap-1">
          <Star className="h-3 w-3 text-amber-400" />
          <span className="font-semibold text-foreground">{trader.rating.toFixed(1)}</span>
        </span>
        <span className="text-border">·</span>
        <span className="inline-flex items-center gap-1">
          <Users className="h-3 w-3" />
          {trader.followers.toLocaleString()} followers
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl border border-border/80 bg-secondary/40 p-3">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted">30d ROI</p>
          <p className="text-lg font-bold text-emerald">{formatPercent(trader.roi)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted">Win rate</p>
          <p className="text-lg font-bold text-foreground">{trader.winRate}%</p>
        </div>
      </div>

      <div className="mt-4 pt-1">
        {isActive ? (
          <Button type="button" className="w-full" size="sm" variant="outline" disabled={loading} onClick={onUncopy}>
            {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : "Uncopy trader"}
          </Button>
        ) : (
          <Button type="button" className="w-full" size="sm" disabled={loading} onClick={onCopy}>
            {loading ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <>
                <TrendingUp className="h-3.5 w-3.5" />
                Copy trader
              </>
            )}
          </Button>
        )}
      </div>
    </motion.article>
  );
}
