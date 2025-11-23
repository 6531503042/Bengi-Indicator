import { Candle, Signal, TimeframeConfig } from '../types';
import {
  calculateSMA,
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateVolumeMA,
  findSupportResistance,
  determineTrend,
  calculateBuySLTP,
  calculateSellSLTP,
} from '../utils/indicators';

export class SignalService {
  /**
   * Calculate confidence score (0-100) based on multiple indicators
   */
  private calculateConfidence(
    trend: 'UPTREND' | 'DOWNTREND' | 'SIDEWAY',
    rsi: number | null,
    macd: number | null,
    macdHistogram: number | null,
    volumeRatio: number | null,
    priceDeviation: number
  ): number {
    let confidence = 50; // Base confidence

    // Trend strength (0-30 points)
    if (trend === 'UPTREND' || trend === 'DOWNTREND') {
      confidence += 20;
    }

    // RSI confirmation (0-20 points)
    if (rsi !== null) {
      if (trend === 'UPTREND' && rsi > 30 && rsi < 70) {
        confidence += 15;
      } else if (trend === 'DOWNTREND' && rsi > 30 && rsi < 70) {
        confidence += 15;
      } else if (rsi < 30 || rsi > 70) {
        confidence -= 10; // Overbought/Oversold
      }
    }

    // MACD confirmation (0-20 points)
    if (macd !== null && macdHistogram !== null) {
      if (trend === 'UPTREND' && macdHistogram > 0) {
        confidence += 15;
      } else if (trend === 'DOWNTREND' && macdHistogram < 0) {
        confidence += 15;
      }
    }

    // Volume confirmation (0-15 points)
    if (volumeRatio !== null && volumeRatio > 1.2) {
      confidence += 10; // Above average volume
    }

    // Price position (0-15 points)
    if (Math.abs(priceDeviation) < 1) {
      confidence += 10; // Near SMA50
    }

    return Math.min(100, Math.max(0, confidence));
  }

  /**
   * Determine risk level based on confidence and market conditions
   */
  private determineRiskLevel(confidence: number, rsi: number | null): 'LOW' | 'MEDIUM' | 'HIGH' {
    if (confidence >= 75) {
      return 'LOW';
    } else if (confidence >= 50) {
      return 'MEDIUM';
    } else {
      return 'HIGH';
    }
  }

  /**
   * Generate detailed entry reason
   */
  private generateEntryReason(
    trend: 'UPTREND' | 'DOWNTREND' | 'SIDEWAY',
    action: 'BUY' | 'SELL' | 'WAIT',
    rsi: number | null,
    macdHistogram: number | null,
    volumeRatio: number | null,
    priceDeviation: number
  ): string {
    const reasons: string[] = [];

    if (action === 'BUY') {
      reasons.push('✅ Uptrend confirmed (SMA50 > SMA200)');
      if (rsi !== null && rsi < 50) {
        reasons.push(`✅ RSI at ${rsi.toFixed(1)} (not overbought)`);
      }
      if (macdHistogram !== null && macdHistogram > 0) {
        reasons.push('✅ MACD bullish momentum');
      }
      if (volumeRatio !== null && volumeRatio > 1.2) {
        reasons.push(`✅ High volume (${(volumeRatio * 100).toFixed(0)}% above average)`);
      }
      if (priceDeviation < 0) {
        reasons.push('✅ Price below SMA50 (support level)');
      }
    } else if (action === 'SELL') {
      reasons.push('✅ Downtrend confirmed (SMA50 < SMA200)');
      if (rsi !== null && rsi > 50) {
        reasons.push(`✅ RSI at ${rsi.toFixed(1)} (not oversold)`);
      }
      if (macdHistogram !== null && macdHistogram < 0) {
        reasons.push('✅ MACD bearish momentum');
      }
      if (volumeRatio !== null && volumeRatio > 1.2) {
        reasons.push(`✅ High volume (${(volumeRatio * 100).toFixed(0)}% above average)`);
      }
      if (priceDeviation > 0) {
        reasons.push('✅ Price above SMA50 (resistance level)');
      }
    }

    return reasons.join('\n') || 'Waiting for better entry conditions';
  }

  /**
   * Generate exit strategy
   */
  private generateExitStrategy(action: 'BUY' | 'SELL', sl: number, tp: number, price: number): string {
    const risk = Math.abs(price - sl);
    const reward = Math.abs(tp - price);
    const riskReward = (reward / risk).toFixed(2);

    if (action === 'BUY') {
      return `📊 Risk: $${risk.toFixed(2)} (${((risk/price)*100).toFixed(2)}%)\n` +
        `📊 Reward: $${reward.toFixed(2)} (${((reward/price)*100).toFixed(2)}%)\n` +
        `📊 Risk/Reward: 1:${riskReward}\n` +
        `\n💡 Exit Strategy:\n` +
        `• Take Profit: $${tp.toFixed(2)} (sell 50% at TP1, 50% at TP2)\n` +
        `• Stop Loss: $${sl.toFixed(2)} (strict, no exceptions)\n` +
        `• Trailing Stop: Consider trailing stop after +1% gain`;
    } else {
      return `📊 Risk: $${risk.toFixed(2)} (${((risk/price)*100).toFixed(2)}%)\n` +
        `📊 Reward: $${reward.toFixed(2)} (${((reward/price)*100).toFixed(2)}%)\n` +
        `📊 Risk/Reward: 1:${riskReward}\n` +
        `\n💡 Exit Strategy:\n` +
        `• Take Profit: $${tp.toFixed(2)} (cover 50% at TP1, 50% at TP2)\n` +
        `• Stop Loss: $${sl.toFixed(2)} (strict, no exceptions)\n` +
        `• Trailing Stop: Consider trailing stop after -1% gain`;
    }
  }

  /**
   * Generate trading signal from candles with advanced analysis
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

    // Calculate advanced indicators
    const rsi = calculateRSI(candles, 14);
    const { macd, signal: macdSignal, histogram: macdHistogram } = calculateMACD(candles);
    const volumeMA = calculateVolumeMA(candles, 20);
    const volumeRatio = lastCandle.volume && volumeMA 
      ? lastCandle.volume / volumeMA 
      : null;
    const { support: supportLevel, resistance: resistanceLevel } = findSupportResistance(candles, 20);

    const trend = determineTrend(sma50, sma200);
    const currentPrice = lastCandle.close;
    const priceDeviation = ((currentPrice - sma50) / sma50) * 100;

    let action: 'BUY' | 'SELL' | 'WAIT' = 'WAIT';
    let sl: number | null = null;
    let tp: number | null = null;
    let patternText = '';
    let confidence = 0;

    // Enhanced BUY Signal Logic
    if (trend === 'UPTREND') {
      const buyConditions = [];
      let buyScore = 0;

      // Price near/below SMA50
      if (priceDeviation <= 1) {
        buyConditions.push('Price near support (SMA50)');
        buyScore += 2;
      }

      // RSI not overbought
      if (rsi !== null && rsi < 70 && rsi > 30) {
        buyConditions.push(`RSI at ${rsi.toFixed(1)} (healthy)`);
        buyScore += 2;
      }

      // MACD bullish
      if (macdHistogram !== null && macdHistogram > 0) {
        buyConditions.push('MACD showing bullish momentum');
        buyScore += 2;
      }

      // Volume confirmation
      if (volumeRatio !== null && volumeRatio > 1.1) {
        buyConditions.push(`Volume ${(volumeRatio * 100).toFixed(0)}% above average`);
        buyScore += 1;
      }

      if (buyScore >= 3 && priceDeviation <= 1.5) {
        action = 'BUY';
        const { sl: buySL, tp: buyTP } = calculateBuySLTP(currentPrice, 1, 2.5);
        sl = buySL;
        tp = buyTP;
        patternText = `🟢 STRONG BUY SIGNAL\n\n` +
          `Trend: Confirmed UPTREND (SMA50 > SMA200 by ${((sma50 - sma200) / sma200 * 100).toFixed(2)}%)\n` +
          `Entry: $${currentPrice.toFixed(2)}\n` +
          `Support Level: $${supportLevel?.toFixed(2) || 'N/A'}\n` +
          `Resistance Level: $${resistanceLevel?.toFixed(2) || 'N/A'}\n\n` +
          `✅ Confirmation Signals:\n${buyConditions.join('\n')}`;
      } else {
        patternText = `Uptrend detected but waiting for better entry:\n` +
          `• Price deviation: ${priceDeviation.toFixed(2)}%\n` +
          `• Current score: ${buyScore}/7\n` +
          `• Need: Price pullback to SMA50 or stronger confirmation`;
      }
    }
    // Enhanced SELL Signal Logic
    else if (trend === 'DOWNTREND') {
      const sellConditions = [];
      let sellScore = 0;

      // Price near/above SMA50
      if (priceDeviation >= -1) {
        sellConditions.push('Price near resistance (SMA50)');
        sellScore += 2;
      }

      // RSI not oversold
      if (rsi !== null && rsi > 30 && rsi < 70) {
        sellConditions.push(`RSI at ${rsi.toFixed(1)} (healthy)`);
        sellScore += 2;
      }

      // MACD bearish
      if (macdHistogram !== null && macdHistogram < 0) {
        sellConditions.push('MACD showing bearish momentum');
        sellScore += 2;
      }

      // Volume confirmation
      if (volumeRatio !== null && volumeRatio > 1.1) {
        sellConditions.push(`Volume ${(volumeRatio * 100).toFixed(0)}% above average`);
        sellScore += 1;
      }

      if (sellScore >= 3 && priceDeviation >= -1.5) {
        action = 'SELL';
        const { sl: sellSL, tp: sellTP } = calculateSellSLTP(currentPrice, 1, 2.5);
        sl = sellSL;
        tp = sellTP;
        patternText = `🔴 STRONG SELL SIGNAL\n\n` +
          `Trend: Confirmed DOWNTREND (SMA50 < SMA200 by ${((sma200 - sma50) / sma200 * 100).toFixed(2)}%)\n` +
          `Entry: $${currentPrice.toFixed(2)}\n` +
          `Support Level: $${supportLevel?.toFixed(2) || 'N/A'}\n` +
          `Resistance Level: $${resistanceLevel?.toFixed(2) || 'N/A'}\n\n` +
          `✅ Confirmation Signals:\n${sellConditions.join('\n')}`;
      } else {
        patternText = `Downtrend detected but waiting for better entry:\n` +
          `• Price deviation: ${priceDeviation.toFixed(2)}%\n` +
          `• Current score: ${sellScore}/7\n` +
          `• Need: Price bounce to SMA50 or stronger confirmation`;
      }
    }
    // WAIT Signal
    else {
      patternText = `Sideways market detected:\n` +
        `• SMA50: $${sma50.toFixed(2)}\n` +
        `• SMA200: $${sma200.toFixed(2)}\n` +
        `• Difference: ${((sma50 - sma200) / sma200 * 100).toFixed(2)}%\n` +
        `• Wait for clear trend confirmation`;
    }

    // Calculate confidence
    if (action !== 'WAIT') {
      confidence = this.calculateConfidence(trend, rsi, macd, macdHistogram, volumeRatio, priceDeviation);
    }

    const riskLevel = action !== 'WAIT' 
      ? this.determineRiskLevel(confidence, rsi || null)
      : undefined;

    const entryReason = action !== 'WAIT'
      ? this.generateEntryReason(trend, action, rsi, macdHistogram, volumeRatio, priceDeviation)
      : undefined;

    const exitStrategy = action !== 'WAIT' && sl && tp
      ? this.generateExitStrategy(action, sl, tp, currentPrice)
      : undefined;

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
      rsi,
      macd,
      macdSignal,
      macdHistogram,
      volume: lastCandle.volume || null,
      volumeMA,
      supportLevel,
      resistanceLevel,
      confidence,
      riskLevel,
      entryReason,
      exitStrategy,
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
