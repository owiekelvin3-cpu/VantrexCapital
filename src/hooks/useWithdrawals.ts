import { useCallback, useState } from "react";
import i18n from "@/i18n";
import { supabase } from "@/lib/supabase";
import { ensureValidSession } from "@/lib/auth-session";
import { fetchOutstandingFees, sumOutstandingFees } from "@/lib/fees";
import { formatTransactionError } from "@/lib/kyc";
import type { UserFee, Withdrawal } from "@/types/database";

export type WithdrawalFilter = "crypto" | "bank_transfer" | "wire_transfer" | "ewallet";

function matchesFilter(method: string, filter?: WithdrawalFilter) {
  if (!filter) return true;
  if (filter === "crypto") return method.startsWith("crypto_");
  if (filter === "ewallet") return method.startsWith("ewallet_");
  return method === filter;
}

export function useWithdrawalData(filter?: WithdrawalFilter) {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [balance, setBalance] = useState(0);
  const [outstandingFees, setOutstandingFees] = useState<UserFee[]>([]);

  const load = useCallback(async (userId: string) => {
    await ensureValidSession();
    const [wRes, bRes, fees] = await Promise.all([
      supabase.from("withdrawals").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(10),
      supabase.from("balances").select("amount").eq("user_id", userId).single(),
      fetchOutstandingFees(userId).catch(() => [] as UserFee[]),
    ]);
    const all = wRes.data ?? [];
    setWithdrawals(filter ? all.filter((w) => matchesFilter(w.method, filter)) : all);
    setBalance(bRes.data?.amount ?? 0);
    setOutstandingFees(fees);
  }, [filter]);

  const outstandingTotal = sumOutstandingFees(outstandingFees);
  const hasOutstandingFees = outstandingFees.length > 0;

  return { withdrawals, balance, outstandingFees, outstandingTotal, hasOutstandingFees, load };
}

export function useWithdrawalForm(
  userId: string | undefined,
  load: (id: string) => Promise<void>,
  hasOutstandingFees = false
) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const submit = async (data: {
    amount: number;
    method: string;
    wallet_address?: string | null;
    notes?: string | null;
  }) => {
    if (!userId) return false;
    if (hasOutstandingFees) {
      setMessage("Outstanding fees must be paid before withdrawing");
      return false;
    }
    if (!data.amount || data.amount <= 0) {
      setMessage("Invalid amount");
      return false;
    }

    setLoading(true);
    setMessage("");
    setSuccess(false);

    await ensureValidSession();

    const { error } = await supabase.from("withdrawals").insert({
      user_id: userId,
      amount: data.amount,
      method: data.method,
      wallet_address: data.wallet_address ?? null,
      notes: data.notes ?? null,
      status: "pending",
    });

    if (error) {
      setMessage(formatTransactionError(error, error.message, i18n.t("errors.tryAgain")));
    } else {
      setSuccess(true);
      await load(userId);
    }
    setLoading(false);
    return !error;
  };

  return { loading, message, success, setMessage, submit };
}
