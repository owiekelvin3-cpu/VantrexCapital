import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { HelpCircle, Sparkles, Wallet } from "@/lib/icons";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { isKycApproved, formatTransactionError } from "@/lib/kyc";
import { KycRequiredGate } from "@/components/dashboard/KycRequiredGate";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { AI_BOTS, RECOMMENDED_BOT_ID } from "@/constants/ai-bots";
import { computeLiveProfit } from "@/lib/ai-trading";
import { ensureValidSession } from "@/lib/auth-session";
import { hasSeenWalkthrough } from "@/lib/ai-trading-onboarding";
import { formatCurrency, cn } from "@/lib/utils";
import { convertFromUsd } from "@/lib/currency";
import { fetchTicker24h, TRADING_PAIRS } from "@/lib/market-api";
import AITradingWalkthrough from "@/components/dashboard/AITradingWalkthrough";
import { StartBotFlow } from "@/components/ai-trading/StartBotFlow";
import { RunningBotView } from "@/components/ai-trading/RunningBotView";
import { PastBotsView } from "@/components/ai-trading/PastBotsView";
import type { AISubscription, AITradingView, StartStep } from "@/components/ai-trading/types";

function toMarketSymbol(asset: string) {
  const base = asset.replace(/[^A-Za-z]/g, "").toUpperCase() || "BTC";
  const match = TRADING_PAIRS.find((p) => p.base === base || p.symbol === `${base}USDT`);
  return match?.symbol ?? "BTCUSDT";
}

function seedEntryPrice(asset: string) {
  switch (asset.toUpperCase()) {
    case "ETH": return 3200;
    case "SOL": return 145;
    case "BNB": return 580;
    case "XRP": return 0.62;
    case "DOGE": return 0.16;
    default: return 68000;
  }
}

export default function AITradingPage() {
  const { t } = useTranslation();
  const { user, profile } = useAuth();

  const [balance, setBalance] = useState(0);
  const [subs, setSubs] = useState<AISubscription[]>([]);
  const [selectedBot, setSelectedBot] = useState(RECOMMENDED_BOT_ID);
  const [durationHours, setDurationHours] = useState(24);
  const [cryptoAsset, setCryptoAsset] = useState("BTC");
  const [amount, setAmount] = useState("");
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [startStep, setStartStep] = useState<StartStep>(1);
  const [view, setView] = useState<AITradingView>("start");
  const [viewReady, setViewReady] = useState(false);
  const [tick, setTick] = useState(0);
  const [showWalkthrough, setShowWalkthrough] = useState(false);

  const bot = AI_BOTS.find((b) => b.id === selectedBot)!;
  const amountNum = parseFloat(amount) || 0;

  const syncBots = useCallback(async () => {
    if (!user) return;
    await ensureValidSession();
    await supabase.rpc("sync_user_ai_bots");
  }, [user]);

  const loadData = useCallback(async () => {
    if (!user) return;
    await syncBots();
    const [balRes, subRes] = await Promise.all([
      supabase.from("balances").select("amount").eq("user_id", user.id).single(),
      supabase
        .from("ai_trading_subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);
    if (balRes.error && balRes.error.code !== "PGRST116") setMessage(balRes.error.message);
    setBalance(balRes.data?.amount ?? 0);
    const loaded = (subRes.data as AISubscription[]) ?? [];
    setSubs(loaded);
    const firstActive = loaded.find((s) => s.status === "active");
    setSelectedSubId((prev) => {
      if (prev && loaded.some((s) => s.id === prev && s.status === "active")) return prev;
      return firstActive?.id ?? null;
    });
    if (!viewReady) {
      setView(firstActive ? "running" : "start");
      setViewReady(true);
    }
  }, [user, syncBots, viewReady]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!user) return;
    if (!hasSeenWalkthrough(user.id)) setShowWalkthrough(true);
  }, [user]);

  useEffect(() => {
    const timer = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!user) return;
    const syncTimer = setInterval(() => {
      void loadData();
    }, 10000);
    return () => clearInterval(syncTimer);
  }, [user, loadData]);

  const activeSubs = subs.filter((s) => s.status === "active");
  const completedSubs = subs.filter((s) => s.status === "completed");
  const selectedSub = activeSubs.find((s) => s.id === selectedSubId) ?? activeSubs[0] ?? null;
  const totalEarnings = activeSubs.reduce((sum, s) => sum + computeLiveProfit(s), 0);
  const minPower = convertFromUsd(bot.minPower);
  const needsFunds = balance < minPower;
  const isSuccessMsg =
    message.includes("+") || message.includes("!") || message.toLowerCase().includes("success");

  const goStart = () => {
    setView("start");
    setStartStep(1);
    setMessage("");
  };

  const handlePurchase = async () => {
    if (!user) return;
    if (!isKycApproved(profile)) {
      setMessage(t("kyc.required"));
      return;
    }
    if (!amountNum || amountNum < minPower) {
      setMessage(t("aiTrading.minPower", { amount: formatCurrency(minPower) }));
      return;
    }
    if (amountNum > balance) {
      setMessage(t("aiTrading.insufficientBalance"));
      return;
    }
    setLoading(true);
    setMessage("");

    let entryPrice = seedEntryPrice(cryptoAsset);
    try {
      const ticker = await fetchTicker24h(toMarketSymbol(cryptoAsset));
      if (ticker?.lastPrice > 0) entryPrice = ticker.lastPrice;
    } catch {
      // Keep seed entry if market feed is unreachable.
    }

    const { data, error } = await supabase
      .from("ai_trading_subscriptions")
      .insert({
        user_id: user.id,
        bot_id: bot.id,
        bot_name: bot.name,
        allocation: amountNum,
        duration_hours: durationHours,
        crypto_asset: cryptoAsset,
        market: "crypto",
        status: "active",
        entry_price: entryPrice,
        last_mark_price: entryPrice,
        profit_earned: 0,
        admin_pnl: 0,
      })
      .select()
      .single();

    if (error) {
      setMessage(
        formatTransactionError(
          error,
          error.message.includes("Insufficient")
            ? t("aiTrading.insufficientBalance")
            : error.message,
          t("kyc.required")
        )
      );
    } else {
      setMessage(t("aiTrading.purchased"));
      setAmount("");
      if (data) setSelectedSubId(data.id);
      await loadData();
      setView("running");
      setStartStep(1);
    }
    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {user && (
        <AITradingWalkthrough
          userId={user.id}
          open={showWalkthrough}
          onClose={() => setShowWalkthrough(false)}
          onComplete={() => {
            setView("start");
            setStartStep(1);
          }}
        />
      )}

      <PageHeader
        eyebrow={t("aiTrading.badgeBeginner")}
        title={t("aiTrading.titleSimple")}
        subtitle={t("aiTrading.subtitleSimple")}
        actions={
          <Button variant="ghost" size="sm" onClick={() => setShowWalkthrough(true)}>
            <HelpCircle className="h-3.5 w-3.5" />
            {t("aiTrading.walkthrough.replay")}
          </Button>
        }
      />

      <KycRequiredGate>
        <div className="space-y-5">
        <div className="overflow-hidden rounded-3xl border border-border bg-card/60 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted">
                {t("aiTrading.yourBalance")}
              </p>
              <p className="font-display text-2xl font-semibold text-foreground">
                {formatCurrency(balance)}
              </p>
            </div>
            {needsFunds ? (
              <Button asChild size="sm" className="w-full sm:w-auto">
                <Link to="/dashboard/deposits">
                  <Wallet className="h-4 w-4" />
                  {t("aiTrading.addFundsFirst")}
                </Link>
              </Button>
            ) : activeSubs.length > 0 ? (
              <div className="sm:text-right">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted">
                  {t("aiTrading.earningsSoFar")}
                </p>
                <p className={cn(
                  "font-display text-xl font-semibold",
                  totalEarnings >= 0 ? "text-emerald" : "text-red-500"
                )} key={tick}>
                  {totalEarnings >= 0 ? "+" : ""}
                  {formatCurrency(totalEarnings)}
                </p>
              </div>
            ) : (
              <Button size="sm" onClick={goStart} className="w-full sm:w-auto">
                <Sparkles className="h-3.5 w-3.5" />
                {t("aiTrading.nav.start")}
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 rounded-xl border border-border bg-secondary/30 p-1">
          <Button
            variant={view === "start" ? "secondary" : "ghost"}
            size="sm"
            onClick={goStart}
          >
            {t("aiTrading.nav.start")}
          </Button>
          <Button
            variant={view === "running" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => {
              setView("running");
              setMessage("");
            }}
            disabled={activeSubs.length === 0}
          >
            {t("aiTrading.nav.running")}
            {activeSubs.length > 0 && (
              <span className="ml-1 rounded-md bg-emerald/15 px-1.5 text-[10px] font-bold text-emerald">
                {activeSubs.length}
              </span>
            )}
          </Button>
          <Button
            variant={view === "past" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => {
              setView("past");
              setMessage("");
            }}
          >
            {t("aiTrading.nav.past")}
          </Button>
        </div>

        {message && (
          <p
            className={cn(
              "rounded-xl border px-4 py-3 text-sm",
              isSuccessMsg
                ? "border-emerald/30 bg-emerald/10 text-emerald"
                : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300"
            )}
          >
            {message}
          </p>
        )}

        {view === "start" && (
          <StartBotFlow
            step={startStep}
            onStepChange={setStartStep}
            selectedBot={selectedBot}
            onSelectBot={setSelectedBot}
            durationHours={durationHours}
            onDurationChange={setDurationHours}
            cryptoAsset={cryptoAsset}
            onCryptoChange={setCryptoAsset}
            amount={amount}
            onAmountChange={setAmount}
            balance={balance}
            loading={loading}
            onStart={() => void handlePurchase()}
          />
        )}

        {view === "running" && (
          <RunningBotView
            activeSubs={activeSubs}
            selectedSub={selectedSub}
            onSelectSub={setSelectedSubId}
            tick={tick}
            onStartAnother={goStart}
          />
        )}

        {view === "past" && <PastBotsView completedSubs={completedSubs} />}
        </div>
      </KycRequiredGate>
    </div>
  );
}
