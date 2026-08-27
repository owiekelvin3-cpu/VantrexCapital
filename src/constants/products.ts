/** Dashboard product catalogs — figures are illustrative, not guarantees. */

export type RiskLevel = "low" | "medium" | "high";

export interface CopyStrategy {
  id: string;
  name: string;
  focusKey: string;
  styleKey: string;
  risk: RiskLevel;
  /** Illustrative 90-day sample range shown in UI (not a promise). */
  sampleRange: string;
  minAllocation: number;
}

export interface MiningPackage {
  id: string;
  nameKey: string;
  investment: number;
  /** Indicative daily target % stored on purchase — not guaranteed. */
  dailyReturnEstimate: number;
  hashrate: string;
  termDays: number;
}

export interface SignalPackage {
  id: string;
  nameKey: string;
  price: number;
  durationDays: number;
  volumeKey: string;
  includes: string[];
}

export const COPY_STRATEGIES: CopyStrategy[] = [
  {
    id: "brooks-core",
    name: "Diana Brooks",
    focusKey: "copyTrading.strategies.brooks.focus",
    styleKey: "copyTrading.strategies.brooks.style",
    risk: "low",
    sampleRange: "+6% to +14%",
    minAllocation: 100,
  },
  {
    id: "mercer-balanced",
    name: "Alex Mercer",
    focusKey: "copyTrading.strategies.mercer.focus",
    styleKey: "copyTrading.strategies.mercer.style",
    risk: "medium",
    sampleRange: "+8% to +22%",
    minAllocation: 100,
  },
  {
    id: "chen-growth",
    name: "Marcus Chen",
    focusKey: "copyTrading.strategies.chen.focus",
    styleKey: "copyTrading.strategies.chen.style",
    risk: "high",
    sampleRange: "+10% to +28%",
    minAllocation: 250,
  },
];

export const MINING_PACKAGES: MiningPackage[] = [
  {
    id: "starter",
    nameKey: "mining.packages.starter",
    investment: 500,
    dailyReturnEstimate: 0.18,
    hashrate: "10 TH/s",
    termDays: 90,
  },
  {
    id: "professional",
    nameKey: "mining.packages.professional",
    investment: 2500,
    dailyReturnEstimate: 0.24,
    hashrate: "50 TH/s",
    termDays: 120,
  },
  {
    id: "enterprise",
    nameKey: "mining.packages.enterprise",
    investment: 10000,
    dailyReturnEstimate: 0.3,
    hashrate: "200 TH/s",
    termDays: 180,
  },
];

export const SIGNAL_PACKAGES: SignalPackage[] = [
  {
    id: "starter",
    nameKey: "signals.packages.starter",
    price: 500,
    durationDays: 30,
    volumeKey: "signals.packages.starterVolume",
    includes: ["signals.includes.desk", "signals.includes.alerts", "signals.includes.support"],
  },
  {
    id: "professional",
    nameKey: "signals.packages.professional",
    price: 1000,
    durationDays: 30,
    volumeKey: "signals.packages.professionalVolume",
    includes: ["signals.includes.desk", "signals.includes.alerts", "signals.includes.prioritized", "signals.includes.support"],
  },
  {
    id: "elite",
    nameKey: "signals.packages.elite",
    price: 2500,
    durationDays: 30,
    volumeKey: "signals.packages.eliteVolume",
    includes: ["signals.includes.desk", "signals.includes.alerts", "signals.includes.prioritized", "signals.includes.concierge"],
  },
  {
    id: "institutional",
    nameKey: "signals.packages.institutional",
    price: 5000,
    durationDays: 30,
    volumeKey: "signals.packages.institutionalVolume",
    includes: ["signals.includes.desk", "signals.includes.alerts", "signals.includes.prioritized", "signals.includes.concierge"],
  },
];
