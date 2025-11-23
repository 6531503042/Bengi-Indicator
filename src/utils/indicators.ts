import { Candle } from '../types';

/**
 * Calculate Simple Moving Average (SMA)
 */
export function calculateSMA(candles: Candle[], period: number): number | null {
  if (candles.length < period) {
    return null;
  }

  const slice = candles.slice(0, period); // Latest candles first
  const sum = slice.reduce((acc, candle) => acc + candle.close, 0);
  return sum / period;
}

/**
 * Calculate Exponential Moving Average (EMA)
 */
export function calculateEMA(candles: Candle[], period: number): number | null {
  if (candles.length < period) {
    return null;
  }

  const multiplier = 2 / (period + 1);
  let ema = candles[period - 1].close;

  for (let i = period - 2; i >= 0; i--) {
    ema = (candles[i].close - ema) * multiplier + ema;
  }

  return ema;
}

/**
 * Calculate Relative Strength Index (RSI)
 */
export function calculateRSI(candles: Candle[], period: number = 14): number | null {
  if (candles.length < period + 1) {
    return null;
  }

  const changes: number[] = [];
  for (let i = 0; i < period; i++) {
    changes.push(candles[i].close - candles[i + 1].close);
  }

  const gains = changes.filter(c => c > 0);
  const losses = changes.filter(c => c < 0).map(c => Math.abs(c));

  const avgGain = gains.length > 0 ? gains.reduce((a, b) => a + b, 0) / period : 0;
  const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / period : 0;

  if (avgLoss === 0) return 100;

  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));

  return rsi;
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 */
export function calculateMACD(candles: Candle[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9): {
  macd: number | null;
  signal: number | null;
  histogram: number | null;
} {
  if (candles.length < slowPeriod + signalPeriod) {
    return { macd: null, signal: null, histogram: null };
  }

  const fastEMA = calculateEMA(candles, fastPeriod);
  const slowEMA = calculateEMA(candles, slowPeriod);

  if (!fastEMA || !slowEMA) {
    return { macd: null, signal: null, histogram: null };
  }

  const macd = fastEMA - slowEMA;

  // Calculate signal line (EMA of MACD)
  // Simplified: use last signalPeriod MACD values
  const macdValues: number[] = [];
  for (let i = 0; i < signalPeriod; i++) {
    const fast = calculateEMA(candles.slice(i), fastPeriod);
    const slow = calculateEMA(candles.slice(i), slowPeriod);
    if (fast && slow) {
      macdValues.push(fast - slow);
    }
  }

  const signal = macdValues.length > 0 
    ? macdValues.reduce((a, b) => a + b, 0) / macdValues.length 
    : null;

  const histogram = signal !== null ? macd - signal : null;

  return { macd, signal, histogram };
}

/**
 * Calculate Volume Moving Average
 */
export function calculateVolumeMA(candles: Candle[], period: number = 20): number | null {
  if (candles.length < period || !candles[0].volume) {
    return null;
  }

  const slice = candles.slice(0, period);
  const sum = slice.reduce((acc, candle) => acc + (candle.volume || 0), 0);
  return sum / period;
}

/**
 * Find Support and Resistance levels
 */
export function findSupportResistance(candles: Candle[], lookback: number = 20): {
  support: number | null;
  resistance: number | null;
} {
  if (candles.length < lookback) {
    return { support: null, resistance: null };
  }

  const slice = candles.slice(0, lookback);
  const lows = slice.map(c => c.low);
  const highs = slice.map(c => c.high);

  const support = Math.min(...lows);
  const resistance = Math.max(...highs);

  return { support, resistance };
}

/**
 * Determine trend based on SMA50 and SMA200
 */
export function determineTrend(sma50: number | null, sma200: number | null): 'UPTREND' | 'DOWNTREND' | 'SIDEWAY' {
  if (!sma50 || !sma200) {
    return 'SIDEWAY';
  }

  const diff = ((sma50 - sma200) / sma200) * 100;

  if (diff > 0.1) {
    return 'UPTREND';
  } else if (diff < -0.1) {
    return 'DOWNTREND';
  }

  return 'SIDEWAY';
}

/**
 * Calculate Stop Loss and Take Profit for BUY signal
 */
export function calculateBuySLTP(entryPrice: number, riskPercent: number = 1, rewardPercent: number = 2) {
  return {
    sl: entryPrice * (1 - riskPercent / 100),
    tp: entryPrice * (1 + rewardPercent / 100),
  };
}

/**
 * Calculate Stop Loss and Take Profit for SELL signal
 */
export function calculateSellSLTP(entryPrice: number, riskPercent: number = 1, rewardPercent: number = 2) {
  return {
    sl: entryPrice * (1 + riskPercent / 100),
    tp: entryPrice * (1 - rewardPercent / 100),
  };
}

