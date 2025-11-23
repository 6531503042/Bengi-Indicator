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

