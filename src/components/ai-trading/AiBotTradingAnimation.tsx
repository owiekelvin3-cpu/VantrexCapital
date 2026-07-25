import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import {
  createChart,
  ColorType,
  CandlestickSeries,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import { useTradingMarket } from "@/hooks/useTradingMarket";
import { formatPrice, TRADING_PAIRS, type Candle } from "@/lib/market-api";
import { cn } from "@/lib/utils";

function toMarketSymbol(asset: string) {
  const base = asset.replace(/[^A-Za-z]/g, "").toUpperCase() || "BTC";
  const match = TRADING_PAIRS.find((p) => p.base === base || p.symbol === `${base}USDT`);
  return match?.symbol ?? "BTCUSDT";
}

function toPairLabel(symbol: string) {
  return TRADING_PAIRS.find((p) => p.symbol === symbol)?.label ?? symbol.replace("USDT", "/USDT");
}

type TapeRow = {
  id: string;
  side: "buy" | "sell";
  price: number;
  size: string;
};

function MiniLiveChart({ candles }: { candles: Candle[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const fittedRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#0b0f12" },
        textColor: "#94a3b8",
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.05)" },
        horzLines: { color: "rgba(255,255,255,0.05)" },
      },
      crosshair: { mode: 0 },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.12, bottom: 0.08 },
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
      },
      width: containerRef.current.clientWidth || 320,
      height: 188,
      autoSize: false,
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#10b981",
      downColor: "#ef4444",
      borderUpColor: "#10b981",
      borderDownColor: "#ef4444",
      wickUpColor: "#10b981",
      wickDownColor: "#ef4444",
    });

    chartRef.current = chart;
    seriesRef.current = series;
    fittedRef.current = false;

    const ro = new ResizeObserver((entries) => {
      const w = Math.floor(entries[0]?.contentRect.width ?? 0);
      if (w > 0 && chartRef.current) {
        chartRef.current.applyOptions({ width: w, height: 188 });
      }
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    const series = seriesRef.current;
    const chart = chartRef.current;
    if (!series || !chart || candles.length === 0) return;

    series.setData(
      candles.map((c) => ({
        time: c.time as UTCTimestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }))
    );

    if (!fittedRef.current) {
      chart.timeScale().fitContent();
      fittedRef.current = true;
    } else {
      chart.timeScale().scrollToRealTime();
    }
  }, [candles]);

  return <div ref={containerRef} className="h-[188px] w-full" />;
}

export function AiBotTradingAnimation({
  cryptoAsset,
  botName,
  onMarkPrice,
}: {
  cryptoAsset: string;
  botName: string;
  onMarkPrice?: (price: number) => void;
}) {
  const { t } = useTranslation();
  const symbol = useMemo(() => toMarketSymbol(cryptoAsset), [cryptoAsset]);
  const pairLabel = toPairLabel(symbol);
  const { ticker, candles, loading } = useTradingMarket(symbol, "1m");
  const [tape, setTape] = useState<TapeRow[]>([]);
  const [phase, setPhase] = useState(0);
  const [fallbackCandles, setFallbackCandles] = useState<Candle[]>([]);
  const priceRef = useRef(0);
  const onMarkPriceRef = useRef(onMarkPrice);
  onMarkPriceRef.current = onMarkPrice;

  const seedPrice = useMemo(() => {
    switch (symbol) {
      case "ETHUSDT": return 3200;
      case "SOLUSDT": return 145;
      case "BNBUSDT": return 580;
      case "XRPUSDT": return 0.62;
      case "DOGEUSDT": return 0.16;
      default: return 68000;
    }
  }, [symbol]);

  useEffect(() => {
    if (ticker?.lastPrice) {
      priceRef.current = ticker.lastPrice;
      return;
    }
    priceRef.current = seedPrice;
  }, [ticker?.lastPrice, seedPrice]);

  // Synthetic candles if live market data is unavailable
  useEffect(() => {
    if (candles.length > 0) {
      setFallbackCandles([]);
      return;
    }
    const now = Math.floor(Date.now() / 1000);
    let px = seedPrice;
    const generated: Candle[] = [];
    for (let i = 60; i >= 0; i--) {
      const open = px;
      const drift = open * (Math.random() * 0.004 - 0.0018);
      const close = Math.max(0.0001, open + drift);
      const high = Math.max(open, close) * (1 + Math.random() * 0.0015);
      const low = Math.min(open, close) * (1 - Math.random() * 0.0015);
      generated.push({
        time: now - i * 60,
        open,
        high,
        low,
        close,
        volume: 10 + Math.random() * 40,
      });
      px = close;
    }
    setFallbackCandles(generated);
    priceRef.current = px;

    const id = window.setInterval(() => {
      setFallbackCandles((prev) => {
        if (prev.length === 0) return prev;
        const last = prev[prev.length - 1];
        const nowSec = Math.floor(Date.now() / 1000);
        const drift = last.close * (Math.random() * 0.003 - 0.0012);
        const close = Math.max(0.0001, last.close + drift);
        const candle: Candle = {
          time: nowSec,
          open: last.close,
          high: Math.max(last.close, close),
          low: Math.min(last.close, close),
          close,
          volume: 8 + Math.random() * 30,
        };
        priceRef.current = close;
        if (last.time === nowSec) return [...prev.slice(0, -1), candle];
        return [...prev.slice(-60), candle];
      });
    }, 1800);

    return () => window.clearInterval(id);
  }, [candles.length, seedPrice, symbol]);

  const chartCandles = candles.length > 0 ? candles : fallbackCandles;
  const displayPrice =
    ticker?.lastPrice ??
    chartCandles[chartCandles.length - 1]?.close ??
    seedPrice;

  useEffect(() => {
    if (!displayPrice || displayPrice <= 0) return;
    priceRef.current = displayPrice;
    onMarkPriceRef.current?.(displayPrice);
  }, [displayPrice]);

  useEffect(() => {
    const phases = window.setInterval(() => setPhase((p) => (p + 1) % 4), 2800);
    return () => window.clearInterval(phases);
  }, []);

  useEffect(() => {
    const pushTick = () => {
      const base = priceRef.current;
      if (!base || !Number.isFinite(base)) return;
      const jitter = base * (0.00015 + Math.random() * 0.00055);
      const side: "buy" | "sell" = Math.random() > 0.48 ? "buy" : "sell";
      const price = side === "buy" ? base + jitter : base - jitter;
      const size = (0.002 + Math.random() * 0.08).toFixed(4);
      setTape((prev) =>
        [
          {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            side,
            price,
            size,
          },
          ...prev,
        ].slice(0, 6)
      );
    };

    pushTick();
    const id = window.setInterval(pushTick, 1700);
    return () => window.clearInterval(id);
  }, [symbol]);

  const changePct = ticker?.priceChangePercent ?? ((displayPrice - seedPrice) / seedPrice) * 100;
  const up = changePct >= 0;
  const statusKeys = [
    "aiTrading.liveStatusScanning",
    "aiTrading.liveStatusRouting",
    "aiTrading.liveStatusExecuting",
    "aiTrading.liveStatusMonitoring",
  ] as const;

  return (
    <div className="mt-5 overflow-hidden rounded-2xl border border-border/80 bg-[#07090b] shadow-inner">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-3.5 py-2.5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-mono text-sm font-semibold text-white">{pairLabel}</p>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald" />
              </span>
              {t("common.live")}
            </span>
          </div>
          <p className="mt-0.5 truncate text-[11px] text-white/45">
            {botName} · {t("aiTrading.liveDeskSubtitle")}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-mono text-sm font-semibold tabular-nums text-white">
            ${formatPrice(displayPrice, symbol)}
          </p>
          <p className={cn("text-[11px] font-semibold tabular-nums", up ? "text-emerald" : "text-red-400")}>
            {up ? "+" : ""}
            {changePct.toFixed(2)}%
          </p>
        </div>
      </div>

      <div className="relative">
        {loading && chartCandles.length === 0 ? (
          <div className="flex h-[188px] items-center justify-center bg-[#0b0f12]">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald/30 border-t-emerald" />
          </div>
        ) : (
          <MiniLiveChart candles={chartCandles} />
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#07090b] to-transparent" />
      </div>

      <div className="border-t border-white/10 px-3.5 py-2.5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
            {t("aiTrading.liveTape")}
          </p>
          <AnimatePresence mode="wait">
            <motion.p
              key={phase}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="truncate text-[11px] font-medium text-emerald"
            >
              {t(statusKeys[phase])}
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="space-y-1">
          <AnimatePresence initial={false}>
            {tape.map((row) => (
              <motion.div
                key={row.id}
                initial={{
                  opacity: 0,
                  x: row.side === "buy" ? -12 : 12,
                  backgroundColor: row.side === "buy" ? "rgba(16,185,129,0.22)" : "rgba(239,68,68,0.22)",
                }}
                animate={{ opacity: 1, x: 0, backgroundColor: "rgba(255,255,255,0)" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.35 }}
                className="flex items-center justify-between rounded-lg px-2 py-1.5 font-mono text-[11px]"
              >
                <span className={cn("w-10 font-bold uppercase", row.side === "buy" ? "text-emerald" : "text-red-400")}>
                  {row.side === "buy" ? t("trading.buy") : t("trading.sell")}
                </span>
                <span className="tabular-nums text-white/85">${formatPrice(row.price, symbol)}</span>
                <span className="tabular-nums text-white/45">{row.size}</span>
              </motion.div>
            ))}
          </AnimatePresence>
          {tape.length === 0 && (
            <p className="px-2 py-3 text-center text-[11px] text-white/35">{t("aiTrading.liveTapeWaiting")}</p>
          )}
        </div>
      </div>
    </div>
  );
}
