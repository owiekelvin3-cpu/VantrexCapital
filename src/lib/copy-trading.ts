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

function mapCopyRow(row: Record<string, unknown>): CopySubscription {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    trader_name: String(row.trader_name),
    allocation: Number(row.allocation ?? 0),
    // Defaults to 0 until migration 042 adds the column.
    profit_earned: Number(row.profit_earned ?? 0),
    status: String(row.status),
    created_at: String(row.created_at),
  };
}

export async function getCopySubscriptions(userId: string): Promise<CopySubscription[]> {
  const { data, error } = await supabase
    .from("copy_trading_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapCopyRow(row as Record<string, unknown>));
}

export async function subscribeToTrader(params: {
  userId: string;
  traderName: string;
  allocation?: number;
}): Promise<CopySubscription> {
  const allocation = params.allocation ?? 0;

  const { data: existing, error: existingError } = await supabase
    .from("copy_trading_subscriptions")
    .select("*")
    .eq("user_id", params.userId)
    .eq("trader_name", params.traderName)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existingError) throw new Error(existingError.message);

  if (existing) {
    if (existing.status === "active") {
      return mapCopyRow(existing as Record<string, unknown>);
    }
    const { data: reactivated, error: reactivateError } = await supabase
      .from("copy_trading_subscriptions")
      .update({ status: "active", allocation })
      .eq("id", existing.id)
      .eq("user_id", params.userId)
      .select("*")
      .single();
    if (reactivateError) throw new Error(reactivateError.message);
    return mapCopyRow(reactivated as Record<string, unknown>);
  }

  const { data, error } = await supabase
    .from("copy_trading_subscriptions")
    .insert({
      user_id: params.userId,
      trader_name: params.traderName,
      allocation,
      status: "active",
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapCopyRow(data as Record<string, unknown>);
}

export async function uncopyTrader(traderName: string): Promise<void> {
  const { error } = await supabase.rpc("uncopy_trader", { p_trader_name: traderName });
  if (error) throw new Error(error.message);
}
