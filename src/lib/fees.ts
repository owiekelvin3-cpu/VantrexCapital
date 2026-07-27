import { supabase } from "@/lib/supabase";
import type { UserFee } from "@/types/database";

export async function fetchUserFees(userId: string, pendingOnly = false): Promise<UserFee[]> {
  let query = supabase
    .from("user_fees")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (pendingOnly) {
    query = query.eq("status", "pending");
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as UserFee[];
}

export async function fetchOutstandingFees(userId: string): Promise<UserFee[]> {
  return fetchUserFees(userId, true);
}

export function sumOutstandingFees(fees: UserFee[]): number {
  return fees
    .filter((f) => f.status === "pending")
    .reduce((sum, f) => sum + Number(f.amount), 0);
}
