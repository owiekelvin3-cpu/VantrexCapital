export interface AIBot {
  id: string;
  name: string;
  description: string;
  simpleDescription: string;
  beginnerFriendly?: boolean;
  winRate: number;
  monthlyReturn: string;
  hourlyReturn: string;
  risk: "low" | "medium" | "high";
  markets: string[];
  minPower: number;
  accent: string;
}

export const RECOMMENDED_BOT_ID = "nexus";

export const AI_BOTS: AIBot[] = [
  {
    id: "nexus",
    name: "Velion Core",
    description: "Conservative execution model focused on capital preservation and steady hourly accrual across major crypto pairs.",
    simpleDescription: "Best for beginners — steady automated crypto trading.",
    beginnerFriendly: true,
    winRate: 100,
    monthlyReturn: "",
    hourlyReturn: "",
    risk: "low",
    markets: ["BTC", "ETH", "SOL"],
    minPower: 250,
    accent: "#10b981",
  },
  {
    id: "quantum",
    name: "Velion Momentum",
    description: "Balanced cross-market engine that rotates exposure across liquid assets.",
    simpleDescription: "Balanced bot for active market conditions.",
    winRate: 100,
    monthlyReturn: "",
    hourlyReturn: "",
    risk: "medium",
    markets: ["BTC", "ETH", "BNB", "XRP"],
    minPower: 500,
    accent: "#6366f1",
  },
  {
    id: "apex",
    name: "Velion Alpha",
    description: "High-conviction momentum system for larger allocations.",
    simpleDescription: "Advanced bot for larger allocations.",
    winRate: 100,
    monthlyReturn: "",
    hourlyReturn: "",
    risk: "high",
    markets: ["BTC", "ETH", "SOL", "DOGE"],
    minPower: 1000,
    accent: "#f59e0b",
  },
];

export function getBotById(botId: string): AIBot | undefined {
  return AI_BOTS.find((b) => b.id === botId);
}

export function getBotName(botId: string): string {
  return getBotById(botId)?.name ?? botId;
}

/** Simplified duration options shown first to beginners */
export const BEGINNER_DURATIONS = [
  { hours: 6, labelKey: "aiTrading.duration6h", shortLabel: "6h" },
  { hours: 24, labelKey: "aiTrading.duration24h", shortLabel: "24h" },
  { hours: 168, labelKey: "aiTrading.duration7d", shortLabel: "7d" },
] as const;

export const BOT_DURATIONS = [
  { hours: 6, label: "6 hours" },
  { hours: 12, label: "12 hours" },
  { hours: 24, label: "24 hours" },
  { hours: 48, label: "48 hours" },
  { hours: 72, label: "72 hours" },
  { hours: 168, label: "7 days" },
] as const;

export const BEGINNER_CRYPTO = [
  { id: "BTC", label: "Bitcoin", pair: "BTC/USDT", emoji: "₿" },
  { id: "ETH", label: "Ethereum", pair: "ETH/USDT", emoji: "Ξ" },
] as const;

export const CRYPTO_ASSETS = [
  { id: "BTC", label: "Bitcoin", pair: "BTC/USDT" },
  { id: "ETH", label: "Ethereum", pair: "ETH/USDT" },
  { id: "SOL", label: "Solana", pair: "SOL/USDT" },
  { id: "BNB", label: "BNB", pair: "BNB/USDT" },
  { id: "XRP", label: "XRP", pair: "XRP/USDT" },
  { id: "DOGE", label: "Dogecoin", pair: "DOGE/USDT" },
] as const;

export const LIVE_SIGNALS = [
  { botId: "nexus", asset: "BTC/USDT", action: "Accumulation zone identified — long bias confirmed", confidence: 96 },
  { botId: "quantum", asset: "ETH/USDT", action: "Momentum breakout validated — target engaged", confidence: 94 },
  { botId: "apex", asset: "SOL/USDT", action: "Short-cycle execution closed — allocation credited", confidence: 98 },
  { botId: "nexus", asset: "ETH/USDT", action: "Mean-reversion signal — automated entry executed", confidence: 92 },
  { botId: "quantum", asset: "BNB/USDT", action: "Order-flow imbalance resolved — position closed", confidence: 95 },
  { botId: "apex", asset: "DOGE/USDT", action: "Volatility capture complete — profit secured", confidence: 97 },
] as const;
