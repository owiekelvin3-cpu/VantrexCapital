export interface FinMarketPair {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
}

export const FIN_MARKET_PAIRS: FinMarketPair[] = [
  { symbol: "BTC/USDT", name: "Bitcoin", price: 97234.5, change24h: 2.34 },
  { symbol: "ETH/USDT", name: "Ethereum", price: 3456.78, change24h: 1.87 },
  { symbol: "SOL/USDT", name: "Solana", price: 187.42, change24h: -0.56 },
  { symbol: "BNB/USDT", name: "BNB", price: 612.3, change24h: 0.92 },
  { symbol: "XRP/USDT", name: "XRP", price: 2.34, change24h: 3.12 },
  { symbol: "AAPL", name: "Apple Inc.", price: 228.45, change24h: 0.67 },
  { symbol: "TSLA", name: "Tesla Inc.", price: 412.89, change24h: -1.23 },
  { symbol: "NVDA", name: "NVIDIA Corp.", price: 134.56, change24h: 2.89 },
  { symbol: "EUR/USD", name: "Euro / US Dollar", price: 1.0842, change24h: -0.12 },
  { symbol: "GBP/USD", name: "British Pound / USD", price: 1.2678, change24h: 0.08 },
];

export const FIN_PRODUCTS = [
  {
    title: "Spot Trading",
    desc: "Sub-millisecond execution with deep liquidity across 500+ pairs. Transparent 0.10% fees.",
    cta: "Open trade desk",
    href: "/dashboard/trading-room",
  },
  {
    title: "AI Trading",
    desc: "Automated strategies powered by machine learning. Backtested, monitored, always on.",
    cta: "See strategies",
    href: "/dashboard/ai-trading",
  },
  {
    title: "Copy Trading",
    desc: "Follow top performers for free — one click, no subscription fee.",
    cta: "Browse traders",
    href: "/dashboard/copy-trading",
  },
  {
    title: "Trading Signals",
    desc: "Institutional-grade alerts delivered to your desk in real time.",
    cta: "View signals",
    href: "/trading-signals",
  },
] as const;

export const FIN_PLATFORM_STATS = [
  { value: 12, suffix: "M+", label: "Registered users" },
  { value: 500, suffix: "+", label: "Trading pairs" },
  { value: 180, suffix: "+", label: "Countries served" },
  { value: 99.99, suffix: "%", label: "Platform uptime" },
] as const;

export const FIN_LIVE_METRICS = [
  { value: 99.99, suffix: "%", label: "Execution uptime", decimals: 2 },
  { value: 100, suffix: "%", label: "Fee transparency", decimals: 0 },
] as const;

export const FIN_PREMIUM_FEATURES = [
  {
    title: "Lightning execution",
    desc: "Orders routed through our proprietary matching engine with median latency under 8ms.",
    tag: "Performance",
  },
  {
    title: "Deep liquidity",
    desc: "Aggregated order books across tier-1 venues ensure tight spreads even in volatile markets.",
    tag: "Markets",
  },
  {
    title: "Smart portfolio",
    desc: "Real-time P&L, allocation breakdowns, and performance analytics in one unified view.",
    tag: "Analytics",
  },
  {
    title: "Global compliance",
    desc: "Licensed and regulated across major jurisdictions with full AML/KYC infrastructure.",
    tag: "Trust",
  },
] as const;

export const FIN_SECURITY_FEATURES = [
  "Cold storage for 95% of assets",
  "Multi-signature withdrawal approval",
  "Real-time anomaly detection",
  "SOC 2 Type II certified",
  "Insurance fund coverage",
  "Bug bounty program",
] as const;
