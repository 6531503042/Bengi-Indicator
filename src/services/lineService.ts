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
   * Format signal to LINE message text
   */
  private formatSignalMessage(signal: Signal): string {
    if (signal.status === 'NO_SIGNAL') {
      return `⏱ Timeframe: ${signal.timeframeLabel}\n` +
        `Status: ${signal.status}\n` +
        `Reason: ${signal.reason || 'Unknown'}`;
    }

    const { timeframeLabel, time, price, trend, action, sl, tp, patternText, sma50, sma200 } = signal;

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

    let message = `📊 BTC/USD Signal\n`;
    message += `━━━━━━━━━━━━━━━━\n`;
    message += `⏰ Timeframe: ${timeframeLabel}\n`;
    message += `🕐 Time: ${formattedTime}\n`;
    message += `💰 Price: $${price.toFixed(2)}\n`;
    message += `📈 Trend: ${this.getTrendEmoji(trend)} ${trend}\n`;
    message += `\n`;

    if (action === 'BUY') {
      message += `🟢 ACTION: ${action}\n`;
    } else if (action === 'SELL') {
      message += `🔴 ACTION: ${action}\n`;
    } else {
      message += `⏸ ACTION: ${action}\n`;
    }

    if (sl && tp) {
      message += `\n`;
      message += `🛑 Stop Loss: $${sl.toFixed(2)}\n`;
      message += `🎯 Take Profit: $${tp.toFixed(2)}\n`;
      message += `\n`;
      const riskReward = ((tp - price) / (price - sl)).toFixed(2);
      message += `📊 Risk/Reward: 1:${riskReward}\n`;
    }

    message += `\n`;
    message += `📝 Pattern Analysis:\n`;
    message += `${patternText}\n`;

    if (sma50 && sma200) {
      message += `\n`;
      message += `📊 Indicators:\n`;
      message += `SMA50: $${sma50.toFixed(2)}\n`;
      message += `SMA200: $${sma200.toFixed(2)}\n`;
    }

    message += `\n`;
    message += `📈 Chart: https://www.tradingview.com/chart/?symbol=BTCUSD&interval=${timeframeLabel.toLowerCase()}\n`;

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
   * Send multiple signals
   */
  async sendSignals(signals: Signal[]): Promise<void> {
    for (const signal of signals) {
      await this.sendSignal(signal);
      // Small delay between messages to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  /**
   * Send summary message with all signals
   */
  async sendSummary(signals: Signal[]): Promise<void> {
    const activeSignals = signals.filter((s) => s.action !== 'WAIT' && s.status !== 'NO_SIGNAL');

    if (activeSignals.length === 0) {
      const summary = `📊 BTC/USD Summary\n` +
        `━━━━━━━━━━━━━━━━\n` +
        `No active signals at this time.\n` +
        `All timeframes showing WAIT status.\n` +
        `\n` +
        `Check individual timeframe messages for details.`;

      await this.client.pushMessage(this.userId, {
        type: 'text',
        text: summary,
      });
      return;
    }

    let summary = `📊 BTC/USD Summary\n`;
    summary += `━━━━━━━━━━━━━━━━\n`;
    summary += `Active Signals: ${activeSignals.length}\n`;
    summary += `\n`;

    for (const signal of activeSignals) {
      summary += `${signal.action} on ${signal.timeframeLabel} - $${signal.price.toFixed(2)}\n`;
    }

    summary += `\n`;
    summary += `Check individual messages for detailed analysis.`;

    await this.client.pushMessage(this.userId, {
      type: 'text',
      text: summary,
    });
  }
}

