import { Candle, Signal, TimeframeConfig } from '../types';
import {
  calculateSMA,
  determineTrend,
  calculateBuySLTP,
  calculateSellSLTP,
} from '../utils/indicators';

export class SignalService {
  /**
   * Generate trading signal from candles
   */
  generateSignal(candles: Candle[], timeframeLabel: string): Signal {
    const lastCandle = candles[0];
    const sma50 = calculateSMA(candles, 50);
    const sma200 = calculateSMA(candles, 200);

    // Not enough data
    if (!sma50 || !sma200) {
      return {
        timeframeLabel,
        time: lastCandle.datetime,
        price: lastCandle.close,
        trend: 'SIDEWAY',
        action: 'WAIT',
        sl: null,
        tp: null,
        patternText: 'Not enough data for analysis',
        sma50,
        sma200,
        status: 'NO_SIGNAL',
        reason: 'Need at least 200 candles for SMA200',
      };
    }

    const trend = determineTrend(sma50, sma200);
    const currentPrice = lastCandle.close;

    // Calculate price deviation from SMA50
    const priceDeviation = ((currentPrice - sma50) / sma50) * 100;

    let action: 'BUY' | 'SELL' | 'WAIT' = 'WAIT';
    let sl: number | null = null;
    let tp: number | null = null;
    let patternText = '';

    // BUY Signal Logic: Uptrend + Price near/below SMA50 (buy the dip)
    if (trend === 'UPTREND' && priceDeviation <= 0.5) {
      action = 'BUY';
      const { sl: buySL, tp: buyTP } = calculateBuySLTP(currentPrice, 1, 2);
      sl = buySL;
      tp = buyTP;
      patternText = `Uptrend detected (SMA50 > SMA200). Price near support (SMA50). Buy the dip opportunity.`;
    }
    // SELL Signal Logic: Downtrend + Price near/above SMA50 (sell the rally)
    else if (trend === 'DOWNTREND' && priceDeviation >= -0.5) {
      action = 'SELL';
      const { sl: sellSL, tp: sellTP } = calculateSellSLTP(currentPrice, 1, 2);
      sl = sellSL;
      tp = sellTP;
      patternText = `Downtrend detected (SMA50 < SMA200). Price near resistance (SMA50). Sell the rally opportunity.`;
    }
    // WAIT Signal
    else {
      if (trend === 'UPTREND') {
        patternText = `Uptrend but price too high above SMA50. Wait for pullback.`;
      } else if (trend === 'DOWNTREND') {
        patternText = `Downtrend but price too low below SMA50. Wait for bounce.`;
      } else {
        patternText = `Sideways market. No clear trend. Wait for confirmation.`;
      }
    }

    return {
      timeframeLabel,
      time: lastCandle.datetime,
      price: currentPrice,
      trend,
      action,
      sl,
      tp,
      patternText,
      sma50,
      sma200,
    };
  }

  /**
   * Generate signals for multiple timeframes
   */
  async generateSignalsForTimeframes(
    fetchCandles: (interval: string) => Promise<Candle[]>,
    timeframes: TimeframeConfig[]
  ): Promise<Signal[]> {
    const signals: Signal[] = [];

    for (const tf of timeframes) {
      try {
        const candles = await fetchCandles(tf.interval);
        const signal = this.generateSignal(candles, tf.label);
        signals.push(signal);
      } catch (error) {
        console.error(`Error generating signal for ${tf.label}:`, error);
        // Push error signal
        signals.push({
          timeframeLabel: tf.label,
          time: new Date().toISOString(),
          price: 0,
          trend: 'SIDEWAY',
          action: 'WAIT',
          sl: null,
          tp: null,
          patternText: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          sma50: null,
          sma200: null,
          status: 'NO_SIGNAL',
          reason: 'Failed to fetch data',
        });
      }
    }

    return signals;
  }
}

