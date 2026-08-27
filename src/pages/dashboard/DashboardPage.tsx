import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { formatAuthError, withValidSession } from "@/lib/auth-session";
import { Button } from "@/components/ui/button";
import { DEFAULT_CURRENCY } from "@/constants/currencies";
import {
  DeckoDashboardOverview,
  type DeckoTradePoint,
} from "@/components/dashboard/decko/DeckoDashboardOverview";
import { RecentTransactionsCard } from "@/components/dashboard/TransactionList";
import { TransactionReceiptPanel } from "@/components/dashboard/TransactionReceiptPanel";
import {
  fetchUserTransactions,
  OVERVIEW_TRANSACTION_LIMIT,
  type UserTransaction,
} from "@/lib/transactions";
import type { Deposit, Trade } from "@/types/database";

function isSettled(status: string) {
  return status === "completed" || status === "approved";
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const [balance, setBalance] = useState(0);
  const [allDeposits, setAllDeposits] = useState<Deposit[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [transactions, setTransactions] = useState<UserTransaction[]>([]);
  const [selectedTx, setSelectedTx] = useState<UserTransaction | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const accountCurrency = profile?.preferred_currency ?? DEFAULT_CURRENCY;

  const load = useCallback(
    async (opts?: { soft?: boolean }) => {
      if (!user) return;
      const soft = opts?.soft === true;
      if (soft) setRefreshing(true);
      else setLoading(true);
      setError("");
      try {
        const [balRes, allDepRes, tradesRes, txList] = await withValidSession(() =>
          Promise.all([
            supabase.from("balances").select("amount").eq("user_id", user.id).single(),
            supabase
              .from("deposits")
              .select("*")
              .eq("user_id", user.id)
              .order("created_at", { ascending: true }),
            supabase
              .from("trades")
              .select("*")
              .eq("user_id", user.id)
              .order("created_at", { ascending: false })
              .limit(200),
            fetchUserTransactions(user.id),
          ])
        );

        if (balRes.error && balRes.error.code !== "PGRST116") {
          setError(formatAuthError(balRes.error, t("auth.sessionExpired")));
        } else if (allDepRes.error) {
          setError(formatAuthError(allDepRes.error, t("dashboard.loadError")));
        }

        setBalance(Number(balRes.data?.amount ?? 0));
        setAllDeposits(allDepRes.data ?? []);
        setTrades(tradesRes.data ?? []);
        setTransactions(txList);
      } catch (err) {
        setError(formatAuthError(err, t("dashboard.loadError")));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user, t]
  );

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!user) return;
    const onVisible = () => {
      if (document.visibilityState === "visible") void load({ soft: true });
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [user, load]);

  const totalDeposits = useMemo(
    () => allDeposits.filter((d) => isSettled(d.status)).reduce((s, d) => s + Number(d.amount), 0),
    [allDeposits]
  );

  const totalWithdrawals = useMemo(
    () =>
      transactions
        .filter((tx) => tx.kind === "withdrawal" && isSettled(String(tx.status)))
        .reduce((s, tx) => s + Number(tx.amount), 0),
    [transactions]
  );

  const openOrders = useMemo(
    () => trades.filter((tr) => tr.status === "pending").length,
    [trades]
  );

  const recentTrades: DeckoTradePoint[] = useMemo(
    () =>
      trades.map((tr) => ({
        created_at: tr.created_at,
        amount: Number(tr.amount ?? 0),
        price: Number(tr.price ?? 0),
        type: (tr.type === "sell" ? "sell" : "buy") as "buy" | "sell",
      })),
    [trades]
  );

  const profitTotal = useMemo(() => {
    const realized = balance - totalDeposits + totalWithdrawals;
    return Number.isFinite(realized) ? realized : 0;
  }, [balance, totalDeposits, totalWithdrawals]);

  const signalPct = Number(
    (profile as { signal_pct?: number | null } | null)?.signal_pct ?? 50
  );

  const recentTransactions = transactions.slice(0, OVERVIEW_TRANSACTION_LIMIT);

  return (
    <div className="space-y-4 sm:space-y-5">
      {error && (
        <div className="flex flex-col gap-2 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-red-400">{error}</p>
          <Button
            size="sm"
            variant="outline"
            disabled={refreshing}
            onClick={() => {
              void load({ soft: true });
            }}
          >
            {t("errors.tryAgain")}
          </Button>
        </div>
      )}

      {loading ? (
        <div className="decko-card h-48 animate-pulse bg-bg-secondary" />
      ) : (
        <DeckoDashboardOverview
          displayName={profile?.full_name || t("common.investor")}
          userEmail={profile?.email}
          avatarUrl={profile?.avatar_url ?? undefined}
          summary={{
            totalValue: balance,
            currency: accountCurrency,
            totalDeposits,
            totalWithdrawals,
          }}
          profitTotal={profitTotal}
          openOrders={openOrders}
          tradesCount={trades.length}
          recentTrades={recentTrades}
          signalPct={signalPct}
        />
      )}

      <div className="mx-auto w-full max-w-[1320px]">
        <RecentTransactionsCard
          items={loading ? [] : recentTransactions}
          total={transactions.length}
          limit={OVERVIEW_TRANSACTION_LIMIT}
          onItemClick={setSelectedTx}
          selectedId={selectedTx?.id}
        />
      </div>

      <TransactionReceiptPanel transaction={selectedTx} onClose={() => setSelectedTx(null)} />
    </div>
  );
}
