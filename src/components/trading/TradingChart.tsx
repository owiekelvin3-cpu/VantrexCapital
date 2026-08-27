import { useEffect, useRef } from "react";
import {
  createChart,
  ColorType,
  CandlestickSeries,
  HistogramSeries,
  type IChartApi,
  type ISeriesApi,
  type IPriceLine,
  type UTCTimestamp,
} from "lightweight-charts";
import type { Candle } from "@/lib/market-api";
import { useTheme } from "@/hooks/useTheme";

interface TradingChartProps {
  candles: Candle[];
  symbol: string;
  lastPrice?: number;
  loading?: boolean;
}

function chartTheme(isLight: boolean) {
  return {
    background: isLight ? "#ffffff" : "#0a0a0c",
    text: isLight ? "#64748b" : "#9ca3af",
    grid: isLight ? "rgba(15,23,42,0.06)" : "rgba(255,255,255,0.04)",
    border: isLight ? "rgba(15,23,42,0.1)" : "rgba(255,255,255,0.06)",
  };
}

function getHeight(width: number) {
  if (width < 640) return 360;
  if (width < 1024) return 460;
  return 520;
}

export function TradingChart({ candles, symbol, lastPrice, loading }: TradingChartProps) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const priceLineRef = useRef<IPriceLine | null>(null);
  const lastLenRef = useRef(0);
  const lastTimeRef = useRef<number | null>(null);
  const fittedRef = useRef(false);
  const symbolRef = useRef(symbol);

  useEffect(() => {
    if (!containerRef.current) return;

    const colors = chartTheme(isLight);
    const width = containerRef.current.clientWidth || 600;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: colors.background },
        textColor: colors.text,
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: colors.grid },
        horzLines: { color: colors.grid },
      },
      crosshair: { mode: 1 },
      rightPriceScale: { borderColor: colors.border },
      timeScale: {
        borderColor: colors.border,
        timeVisible: true,
        secondsVisible: false,
      },
      width,
      height: getHeight(width),
      autoSize: false,
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#10b981",
      downColor: "#ef4444",
      borderUpColor: "#10b981",
      borderDownColor: "#ef4444",
      wickUpColor: "#10b981",
      wickDownColor: "#ef4444",
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: "#26a69a",
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
    });

    chart.priceScale("volume").applyOptions({
      scaleMargins: { top: 0.82, bottom: 0 },
    });
    chart.priceScale("right").applyOptions({
      scaleMargins: { top: 0.08, bottom: 0.22 },
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;
    fittedRef.current = false;
    lastLenRef.current = 0;
    lastTimeRef.current = null;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry || !chartRef.current) return;
      const w = Math.floor(entry.contentRect.width);
      if (w > 0) {
        chartRef.current.applyOptions({ width: w, height: getHeight(w) });
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      priceLineRef.current = null;
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, [isLight]);

  useEffect(() => {
    if (symbolRef.current !== symbol) {
      symbolRef.current = symbol;
      fittedRef.current = false;
      lastLenRef.current = 0;
      lastTimeRef.current = null;
    }
  }, [symbol]);

  useEffect(() => {
    const candleSeries = candleSeriesRef.current;
    const volumeSeries = volumeSeriesRef.current;
    if (!candleSeries || !volumeSeries || candles.length === 0) return;

    const toCandle = (c: Candle) => ({
      time: c.time as UTCTimestamp,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    });

    const toVolume = (c: Candle) => ({
      time: c.time as UTCTimestamp,
      value: c.volume,
      color: c.close >= c.open ? "rgba(16,185,129,0.35)" : "rgba(239,68,68,0.35)",
    });

    const last = candles[candles.length - 1];
    const canIncremental =
      lastLenRef.current > 0 &&
      lastTimeRef.current !== null &&
      last.time >= lastTimeRef.current &&
      candles.length >= lastLenRef.current - 1 &&
      candles.length <= lastLenRef.current + 1;

    if (canIncremental && lastLenRef.current > 0) {
      candleSeries.update(toCandle(last));
      volumeSeries.update(toVolume(last));
    } else {
      candleSeries.setData(candles.map(toCandle));
      volumeSeries.setData(candles.map(toVolume));
      if (!fittedRef.current) {
        chartRef.current?.timeScale().fitContent();
        fittedRef.current = true;
      }
    }

    lastLenRef.current = candles.length;
    lastTimeRef.current = last.time;
  }, [candles, symbol, isLight]);

  useEffect(() => {
    const series = candleSeriesRef.current;
    if (!series || !lastPrice || !Number.isFinite(lastPrice)) return;

    if (priceLineRef.current) {
      series.removePriceLine(priceLineRef.current);
      priceLineRef.current = null;
    }

    priceLineRef.current = series.createPriceLine({
      price: lastPrice,
      color: "#10b981",
      lineWidth: 1,
      lineStyle: 2,
      axisLabelVisible: true,
      title: "",
    });
  }, [lastPrice, symbol, isLight, candles.length]);

  return (
    <div className="relative min-h-[360px] overflow-hidden border-t border-border bg-card sm:min-h-[460px] lg:min-h-[520px]">
      {loading && candles.length === 0 && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-card/90 text-sm text-muted">
          <span className="inline-flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald/30 border-t-emerald" />
            Loading chart…
          </span>
        </div>
      )}
      {!loading && candles.length === 0 && (
        <div className="absolute inset-0 z-10 flex items-center justify-center text-sm text-muted">
          No chart data available
        </div>
      )}
      <div ref={containerRef} className="h-[360px] w-full sm:h-[460px] lg:h-[520px]" />
    </div>
  );
}
