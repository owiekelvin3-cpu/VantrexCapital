import { supabase } from "@/lib/supabase";

export type CopySubscription = {
  id: string;
  user_id: string;
  trader_name: string;
  allocation: number;
  profit_earned: number;
  status: string;
  created_at: string;
};

const SELECT_COLS = "id, user_id, trader_name, allocation, profit_earned, status, created_at";

export async function getCopySubscriptions(userId: string): Promise<CopySubscription[]> {
  const { data, error } = await supabase
    .from("copy_trading_subscriptions")
    .select(SELECT_COLS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as CopySubscription[]).map((row) => ({
    ...row,
    allocation: Number(row.allocation),
    profit_earned: Number(row.profit_earned ?? 0),
  }));
}

export async function subscribeToTrader(params: {
  userId: string;
  traderName: string;
  allocation?: number;
}): Promise<CopySubscription> {
  const allocation = params.allocation ?? 0;

  const { data: existing, error: existingError } = await supabase
    .from("copy_trading_subscriptions")
    .select(SELECT_COLS)
    .eq("user_id", params.userId)
    .eq("trader_name", params.traderName)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existingError) throw new Error(existingError.message);

  if (existing) {
    if (existing.status === "active") {
      return {
        ...(existing as CopySubscription),
        allocation: Number(existing.allocation),
        profit_earned: Number(existing.profit_earned ?? 0),
      };
    }
    const { data: reactivated, error: reactivateError } = await supabase
      .from("copy_trading_subscriptions")
      .update({ status: "active", allocation })
      .eq("id", existing.id)
      .eq("user_id", params.userId)
      .select(SELECT_COLS)
      .single();
    if (reactivateError) throw new Error(reactivateError.message);
    return {
      ...(reactivated as CopySubscription),
      allocation: Number(reactivated.allocation),
      profit_earned: Number(reactivated.profit_earned ?? 0),
    };
  }

  const { data, error } = await supabase
    .from("copy_trading_subscriptions")
    .insert({
      user_id: params.userId,
      trader_name: params.traderName,
      allocation,
      status: "active",
    })
    .select(SELECT_COLS)
    .single();
  if (error) throw new Error(error.message);
  return {
    ...(data as CopySubscription),
    allocation: Number(data.allocation),
    profit_earned: Number(data.profit_earned ?? 0),
  };
}

export async function uncopyTrader(traderName: string): Promise<void> {
  const { error } = await supabase.rpc("uncopy_trader", { p_trader_name: traderName });
  if (error) throw new Error(error.message);
}
