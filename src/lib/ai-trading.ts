import type { AIBot } from "@/constants/ai-bots";

export function getHourlyRate(botId: string): number {
  switch (botId) {
    case "nexus": return 0.35;
    case "quantum": return 0.55;
    case "apex": return 0.85;
    default: return 0.30;
  }
}

export function getTradeRate(botId: string): number {
  switch (botId) {
    case "nexus": return 1.8;
    case "quantum": return 2.5;
    case "apex": return 3.5;
    default: return 1.5;
  }
}

export function estimatePassiveProfit(power: number, botId: string, hours: number): number {
  return Math.round(power * (getHourlyRate(botId) / 100) * hours * 100) / 100;
}

export function estimateTradeProfit(tradeAmount: number, botId: string): number {
  return Math.round(tradeAmount * (getTradeRate(botId) / 100) * 100) / 100;
}

export function estimateTotalProfit(power: number, bot: AIBot, hours: number, trades = 3): number {
  const passive = estimatePassiveProfit(power, bot.id, hours);
  const perTrade = estimateTradeProfit(power * 0.25, bot.id);
  return Math.round((passive + perTrade * trades) * 100) / 100;
}

export interface LiveProfitInput {
  id?: string;
  bot_id: string | null;
  bot_name?: string;
  allocation: number;
  profit_earned: number;
  entry_price?: number | null;
  last_mark_price?: number | null;
  admin_pnl?: number | null;
  last_sync_at?: string | null;
  created_at: string;
  status: string;
  expires_at: string | null;
  duration_hours?: number;
}

/** Mark-to-market P/L from entry → current coin price. */
export function computeMarketPnL(allocation: number, entryPrice: number, markPrice: number): number {
  if (!Number.isFinite(allocation) || !Number.isFinite(entryPrice) || !Number.isFinite(markPrice)) return 0;
  if (allocation <= 0 || entryPrice <= 0 || markPrice <= 0) return 0;
  return Math.round(allocation * ((markPrice - entryPrice) / entryPrice) * 100) / 100;
}

/** Live result = coin move since entry + any admin adjustment. */
export function computeLiveProfit(sub: LiveProfitInput, markPrice?: number | null): number {
  const admin = Number(sub.admin_pnl ?? 0);
  const entry = Number(sub.entry_price ?? 0);
  const mark = Number(
    markPrice && markPrice > 0
      ? markPrice
      : sub.last_mark_price && Number(sub.last_mark_price) > 0
        ? sub.last_mark_price
        : 0
  );

  if (entry > 0 && mark > 0) {
    return Math.round((computeMarketPnL(sub.allocation, entry, mark) + admin) * 100) / 100;
  }

  return Math.round(Number(sub.profit_earned ?? 0) * 100) / 100;
}

export function getProfitPerSecond(allocation: number, botId: string): number {
  return (allocation * (getHourlyRate(botId) / 100)) / 3600;
}

export function getProfitPerHour(allocation: number, botId: string): number {
  return allocation * (getHourlyRate(botId) / 100);
}

export function getRunProgress(sub: LiveProfitInput, at = Date.now()): number {
  if (!sub.expires_at) return 0;
  const start = new Date(sub.created_at).getTime();
  const end = new Date(sub.expires_at).getTime();
  const total = end - start;
  if (total <= 0) return 100;
  return Math.min(100, Math.max(0, ((at - start) / total) * 100));
}

export function getProjectedProfitAtExpiry(sub: LiveProfitInput): number {
  return Number(sub.profit_earned ?? 0);
}

export function getProjectedPayout(sub: LiveProfitInput): number {
  return Math.round((sub.allocation + getProjectedProfitAtExpiry(sub)) * 100) / 100;
}

export function getTimeRemaining(expiresAt: string): { hours: number; minutes: number; seconds: number; expired: boolean } {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0, expired: true };
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return { hours, minutes, seconds, expired: false };
}

export function formatCountdown(expiresAt: string): string {
  const { hours, minutes, seconds, expired } = getTimeRemaining(expiresAt);
  if (expired) return "00:00:00";
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
