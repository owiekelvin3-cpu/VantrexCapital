import { supabase } from "@/lib/supabase";
import { signalTierRank, userTierRankFromPackages } from "@/lib/signal-plans";

export type SignalDirection = "buy" | "sell";
export type SignalStatus = "active" | "closed" | "cancelled";

export interface TradingSignal {
  id: string;
  symbol: string;
  direction: SignalDirection;
  entry_price: string;
  target_price: string;
  stop_price: string;
  status: SignalStatus;
  min_tier: string;
  confidence: number;
  outcome: string | null;
  notes: string | null;
  published_at: string;
  closed_at: string | null;
}

export interface SignalSubscription {
  id: string;
  package_id: string | null;
  package_name: string;
  price: number;
  status: string;
  expires_at: string | null;
  created_at: string;
}

export function isSubscriptionActive(sub: SignalSubscription): boolean {
  if (sub.status !== "active") return false;
  if (!sub.expires_at) return true;
  return new Date(sub.expires_at).getTime() > Date.now();
}

export function getUserSignalTierRank(subs: SignalSubscription[]): number {
  return userTierRankFromPackages(subs);
}

export async function fetchSignalSubscriptions(userId: string): Promise<SignalSubscription[]> {
  const { data, error } = await supabase
    .from("signal_packages")
    .select("id, package_id, package_name, price, status, expires_at, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({ ...row, price: Number(row.price) }));
}

export async function fetchTradingSignals(): Promise<TradingSignal[]> {
  const { data, error } = await supabase
    .from("trading_signals")
    .select("*")
    .order("published_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as TradingSignal[];
}

export function computeSignalDeskStats(signals: TradingSignal[]) {
  const closed = signals.filter((s) => s.status === "closed");
  const wins = closed.filter((s) => s.outcome === "win").length;
  const winRate = closed.length > 0 ? Math.round((wins / closed.length) * 100) : null;
  const active = signals.filter((s) => s.status === "active").length;
  return { active, closed: closed.length, winRate };
}

export function riskRewardRatio(signal: TradingSignal): number | null {
  const entry = parseFloat(signal.entry_price);
  const target = parseFloat(signal.target_price);
  const stop = parseFloat(signal.stop_price);
  if (!Number.isFinite(entry) || !Number.isFinite(target) || !Number.isFinite(stop)) return null;
  const reward = Math.abs(target - entry);
  const risk = Math.abs(entry - stop);
  if (risk <= 0) return null;
  return Math.round((reward / risk) * 100) / 100;
}

export function canViewSignal(signal: TradingSignal, userTierRank: number): boolean {
  if (userTierRank <= 0) return false;
  return signalTierRank(signal.min_tier) <= userTierRank;
}

export async function purchaseSignalPackage(params: {
  userId: string;
  planId: string;
  planName: string;
  price: number;
  days: number;
}): Promise<SignalSubscription> {
  const expires = new Date();
  expires.setDate(expires.getDate() + params.days);
  const { data, error } = await supabase
    .from("signal_packages")
    .insert({
      user_id: params.userId,
      package_id: params.planId,
      package_name: params.planName,
      price: params.price,
      status: "active",
      expires_at: expires.toISOString(),
    })
    .select("id, package_id, package_name, price, status, expires_at, created_at")
    .single();
  if (error) throw error;
  return { ...data, price: Number(data.price) };
}
