import { Client, Message } from '@line/bot-sdk';
import { Signal } from '../types';

export class LineService {
  private client: Client;
  private userId: string;

  constructor(channelAccessToken: string, userId: string) {
    this.client = new Client({
      channelAccessToken,
    });
    this.userId = userId;
  }

  /**
   * Format signal to LINE message text with premium details
   */
  private formatSignalMessage(signal: Signal): string {
    if (signal.status === 'NO_SIGNAL') {
      return `⏱ Timeframe: ${signal.timeframeLabel}\n` +
        `Status: ${signal.status}\n` +
        `Reason: ${signal.reason || 'Unknown'}`;
    }

    const {
      timeframeLabel,
      time,
      price,
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
      volume,
      volumeMA,
      supportLevel,
      resistanceLevel,
      confidence,
      riskLevel,
      entryReason,
      exitStrategy,
    } = signal;

    // Format datetime
    const date = new Date(time);
    const formattedTime = date.toLocaleString('th-TH', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    let message = `╔═══════════════════════════╗\n`;
    message += `║  📊 BTC/USD SIGNAL PREMIUM  ║\n`;
    message += `╚═══════════════════════════╝\n\n`;

    // Header Info
    message += `⏰ Timeframe: ${timeframeLabel}\n`;
    message += `🕐 Time: ${formattedTime}\n`;
    message += `💰 Current Price: $${price.toFixed(2)}\n\n`;

    // Trend Analysis
    message += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `📈 TREND ANALYSIS\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `Trend: ${this.getTrendEmoji(trend)} ${trend}\n`;
    if (sma50 && sma200) {
      const trendStrength = Math.abs((sma50 - sma200) / sma200 * 100);
      message += `SMA50: $${sma50.toFixed(2)}\n`;
      message += `SMA200: $${sma200.toFixed(2)}\n`;
      message += `Trend Strength: ${trendStrength.toFixed(2)}%\n`;
    }
    message += `\n`;

    // Action Signal
    message += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    if (action === 'BUY') {
      message += `🟢 ACTION: ${action} SIGNAL\n`;
    } else if (action === 'SELL') {
      message += `🔴 ACTION: ${action} SIGNAL\n`;
    } else {
      message += `⏸ ACTION: ${action}\n`;
    }
    message += `━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    // Risk Management (only for BUY/SELL)
    if (action !== 'WAIT' && sl && tp) {
      message += `🎯 ENTRY & EXIT LEVELS\n`;
      message += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      message += `📍 Entry: $${price.toFixed(2)}\n`;
      message += `🛑 Stop Loss: $${sl.toFixed(2)} (${((Math.abs(price - sl) / price) * 100).toFixed(2)}%)\n`;
      message += `🎯 Take Profit: $${tp.toFixed(2)} (${((Math.abs(tp - price) / price) * 100).toFixed(2)}%)\n`;
      
      const risk = Math.abs(price - sl);
      const reward = Math.abs(tp - price);
      const riskReward = (reward / risk).toFixed(2);
      message += `📊 Risk/Reward Ratio: 1:${riskReward}\n`;
      message += `\n`;

      // Confidence & Risk Level
      if (confidence !== undefined) {
        message += `🎲 CONFIDENCE & RISK\n`;
        message += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        message += `Confidence Score: ${confidence}/100 ${this.getConfidenceEmoji(confidence)}\n`;
        if (riskLevel) {
          message += `Risk Level: ${this.getRiskEmoji(riskLevel)} ${riskLevel}\n`;
        }
        message += `\n`;
      }
    }

    // Technical Indicators
    message += `📊 TECHNICAL INDICATORS\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    
    if (rsi !== null && rsi !== undefined) {
      let rsiStatus = '';
      if (rsi > 70) rsiStatus = '🔴 Overbought';
      else if (rsi < 30) rsiStatus = '🟢 Oversold';
      else rsiStatus = '✅ Neutral';
      message += `RSI(14): ${rsi.toFixed(2)} ${rsiStatus}\n`;
    }

    if (macd !== null && macd !== undefined) {
      message += `MACD: ${macd.toFixed(2)}\n`;
      if (macdSignal !== null && macdSignal !== undefined) {
        message += `MACD Signal: ${macdSignal.toFixed(2)}\n`;
      }
      if (macdHistogram !== null && macdHistogram !== undefined) {
        const macdStatus = macdHistogram > 0 ? '🟢 Bullish' : '🔴 Bearish';
        message += `MACD Histogram: ${macdHistogram.toFixed(2)} ${macdStatus}\n`;
      }
    }

    if (volume && volumeMA) {
      const volumeRatio = volume / volumeMA;
      const volumeStatus = volumeRatio > 1.2 ? '📈 High' : volumeRatio < 0.8 ? '📉 Low' : '➡️ Normal';
      message += `Volume: ${volumeRatio > 1 ? '+' : ''}${((volumeRatio - 1) * 100).toFixed(1)}% ${volumeStatus}\n`;
    }

    if (supportLevel) {
      message += `Support: $${supportLevel.toFixed(2)}\n`;
    }
    if (resistanceLevel) {
      message += `Resistance: $${resistanceLevel.toFixed(2)}\n`;
    }
    message += `\n`;

    // Pattern Analysis
    message += `📝 PATTERN ANALYSIS\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `${patternText}\n`;
    message += `\n`;

    // Entry Reason (if available)
    if (entryReason && action !== 'WAIT') {
      message += `✅ ENTRY REASONS\n`;
      message += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      message += `${entryReason}\n`;
      message += `\n`;
    }

    // Exit Strategy (if available)
    if (exitStrategy && action !== 'WAIT') {
      message += `${exitStrategy}\n`;
    }

    // Chart Link
    message += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `📈 View Chart:\n`;
    message += `https://www.tradingview.com/chart/?symbol=BTCUSD&interval=${timeframeLabel.toLowerCase()}\n`;
    message += `\n`;
    message += `💡 Premium Indicator by Bengi\n`;

    return message;
  }

  /**
   * Get emoji for trend
   */
  private getTrendEmoji(trend: string): string {
    switch (trend) {
      case 'UPTREND':
        return '🟢';
      case 'DOWNTREND':
        return '🔴';
      default:
        return '🟡';
    }
  }

  /**
   * Get emoji for confidence score
   */
  private getConfidenceEmoji(confidence: number): string {
    if (confidence >= 75) return '🔥';
    if (confidence >= 50) return '✅';
    return '⚠️';
  }

  /**
   * Get emoji for risk level
   */
  private getRiskEmoji(riskLevel: string): string {
    switch (riskLevel) {
      case 'LOW':
        return '🟢';
      case 'MEDIUM':
        return '🟡';
      case 'HIGH':
        return '🔴';
      default:
        return '⚪';
    }
  }

  /**
   * Send signal to LINE user
   */
  async sendSignal(signal: Signal): Promise<void> {
    try {
      const messageText = this.formatSignalMessage(signal);
      const message: Message = {
        type: 'text',
        text: messageText,
      };

      await this.client.pushMessage(this.userId, message);
      console.log(`✅ Sent signal for ${signal.timeframeLabel} to LINE`);
    } catch (error) {
      console.error(`❌ Failed to send LINE message for ${signal.timeframeLabel}:`, error);
      throw error;
    }
  }

  /**
   * Send raw text message to LINE user
   */
  async sendTextMessage(text: string, targetUserId?: string): Promise<void> {
    try {
      const userId = targetUserId || this.userId;
      const message: Message = {
        type: 'text',
        text,
      };

      await this.client.pushMessage(userId, message);
      console.log(`✅ Sent text message to LINE`);
    } catch (error) {
      console.error(`❌ Failed to send LINE message:`, error);
      throw error;
    }
  }

  /**
   * Get LINE client (for webhook service)
   */
  getClient(): Client {
    return this.client;
  }

  /**
   * Send multiple signals
   */
  async sendSignals(signals: Signal[]): Promise<void> {
    for (const signal of signals) {
      await this.sendSignal(signal);
      // Small delay between messages to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
  }

  /**
   * Send summary message with all signals
   */
  async sendSummary(signals: Signal[]): Promise<void> {
    const activeSignals = signals.filter((s) => s.action !== 'WAIT' && s.status !== 'NO_SIGNAL');

    if (activeSignals.length === 0) {
      const summary = `╔═══════════════════════════╗\n` +
        `║  📊 BTC/USD SUMMARY PREMIUM  ║\n` +
        `╚═══════════════════════════╝\n\n` +
        `⏸ No active signals at this time.\n` +
        `All timeframes showing WAIT status.\n` +
        `\n` +
        `Check individual timeframe messages for detailed analysis.`;

      await this.client.pushMessage(this.userId, {
        type: 'text',
        text: summary,
      });
      return;
    }

    let summary = `╔═══════════════════════════╗\n`;
    summary += `║  📊 BTC/USD SUMMARY PREMIUM  ║\n`;
    summary += `╚═══════════════════════════╝\n\n`;
    summary += `🎯 Active Signals: ${activeSignals.length}\n\n`;

    for (const signal of activeSignals) {
      summary += `${signal.action === 'BUY' ? '🟢' : '🔴'} ${signal.action} on ${signal.timeframeLabel}\n`;
      summary += `   Price: $${signal.price.toFixed(2)}\n`;
      if (signal.confidence !== undefined) {
        summary += `   Confidence: ${signal.confidence}/100\n`;
      }
      summary += `\n`;
    }

    summary += `Check individual messages for detailed analysis.`;

    await this.client.pushMessage(this.userId, {
      type: 'text',
      text: summary,
    });
  }
}
