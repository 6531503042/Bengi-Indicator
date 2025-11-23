import { Client, Message } from '@line/bot-sdk';
import { Signal } from '../types';

export class LineServiceThai {
  private client: Client;
  private userId: string;

  constructor(channelAccessToken: string, userId: string) {
    this.client = new Client({
      channelAccessToken,
    });
    this.userId = userId;
  }

  /**
   * แปลงข้อความสัญญาณเป็นภาษาไทย
   */
  private formatSignalMessageThai(signal: Signal): string {
    if (signal.status === 'NO_SIGNAL') {
      return `⏱ กรอบเวลา: ${signal.timeframeLabel}\n` +
        `สถานะ: ${signal.status}\n` +
        `เหตุผล: ${signal.reason || 'ไม่ทราบ'}`;
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
    message += `║  📊 สัญญาณ BTC/USD พรีเมียม  ║\n`;
    message += `╚═══════════════════════════╝\n\n`;

    // Header Info
    message += `⏰ กรอบเวลา: ${timeframeLabel}\n`;
    message += `🕐 เวลา: ${formattedTime}\n`;
    message += `💰 ราคาปัจจุบัน: $${price.toFixed(2)}\n\n`;

    // Trend Analysis
    message += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `📈 การวิเคราะห์เทรนด์\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    
    const trendThai = trend === 'UPTREND' ? 'เทรนด์ขาขึ้น' : trend === 'DOWNTREND' ? 'เทรนด์ขาลง' : 'เทรนด์ข้าง';
    message += `เทรนด์: ${this.getTrendEmoji(trend)} ${trendThai}\n`;
    
    if (sma50 && sma200) {
      const trendStrength = Math.abs((sma50 - sma200) / sma200 * 100);
      message += `SMA50: $${sma50.toFixed(2)}\n`;
      message += `SMA200: $${sma200.toFixed(2)}\n`;
      message += `ความแรงเทรนด์: ${trendStrength.toFixed(2)}%\n`;
    }
    message += `\n`;

    // Action Signal
    message += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    if (action === 'BUY') {
      message += `🟢 สัญญาณ: ซื้อ (BUY)\n`;
    } else if (action === 'SELL') {
      message += `🔴 สัญญาณ: ขาย (SELL)\n`;
    } else {
      message += `⏸ สัญญาณ: รอ (WAIT)\n`;
    }
    message += `━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    // Risk Management (only for BUY/SELL)
    if (action !== 'WAIT' && sl && tp) {
      message += `🎯 ระดับเข้า-ออก\n`;
      message += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      message += `📍 จุดเข้า: $${price.toFixed(2)}\n`;
      message += `🛑 Stop Loss: $${sl.toFixed(2)} (${((Math.abs(price - sl) / price) * 100).toFixed(2)}%)\n`;
      message += `🎯 Take Profit: $${tp.toFixed(2)} (${((Math.abs(tp - price) / price) * 100).toFixed(2)}%)\n`;
      
      const risk = Math.abs(price - sl);
      const reward = Math.abs(tp - price);
      const riskReward = (reward / risk).toFixed(2);
      message += `📊 อัตราเสี่ยง/ผลตอบแทน: 1:${riskReward}\n`;
      message += `\n`;

      // Confidence & Risk Level
      if (confidence !== undefined) {
        message += `🎲 ระดับความมั่นใจและความเสี่ยง\n`;
        message += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        message += `คะแนนความมั่นใจ: ${confidence}/100 ${this.getConfidenceEmoji(confidence)}\n`;
        if (riskLevel) {
          const riskThai = riskLevel === 'LOW' ? 'ต่ำ' : riskLevel === 'MEDIUM' ? 'ปานกลาง' : 'สูง';
          message += `ระดับความเสี่ยง: ${this.getRiskEmoji(riskLevel)} ${riskThai}\n`;
        }
        message += `\n`;
      }
    }

    // Technical Indicators
    message += `📊 ตัวชี้วัดทางเทคนิค\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    
    if (rsi !== null && rsi !== undefined) {
      let rsiStatus = '';
      if (rsi > 70) rsiStatus = '🔴 ซื้อมากเกินไป (Overbought)';
      else if (rsi < 30) rsiStatus = '🟢 ขายมากเกินไป (Oversold)';
      else rsiStatus = '✅ ปกติ (Neutral)';
      message += `RSI(14): ${rsi.toFixed(2)} ${rsiStatus}\n`;
    }

    if (macd !== null && macd !== undefined) {
      message += `MACD: ${macd.toFixed(2)}\n`;
      if (macdSignal !== null && macdSignal !== undefined) {
        message += `MACD Signal: ${macdSignal.toFixed(2)}\n`;
      }
      if (macdHistogram !== null && macdHistogram !== undefined) {
        const macdStatus = macdHistogram > 0 ? '🟢 แรงซื้อ' : '🔴 แรงขาย';
        message += `MACD Histogram: ${macdHistogram.toFixed(2)} ${macdStatus}\n`;
      }
    }

    if (volume && volumeMA) {
      const volumeRatio = volume / volumeMA;
      const volumeStatus = volumeRatio > 1.2 ? '📈 สูง' : volumeRatio < 0.8 ? '📉 ต่ำ' : '➡️ ปกติ';
      message += `ปริมาณการซื้อขาย: ${volumeRatio > 1 ? '+' : ''}${((volumeRatio - 1) * 100).toFixed(1)}% ${volumeStatus}\n`;
    }

    if (supportLevel) {
      message += `แนวรับ: $${supportLevel.toFixed(2)}\n`;
    }
    if (resistanceLevel) {
      message += `แนวต้าน: $${resistanceLevel.toFixed(2)}\n`;
    }
    message += `\n`;

    // Pattern Analysis
    message += `📝 การวิเคราะห์แพทเทิร์น\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `${this.translatePatternText(patternText)}\n`;
    message += `\n`;

    // Entry Reason (if available)
    if (entryReason && action !== 'WAIT') {
      message += `✅ เหตุผลในการเข้า\n`;
      message += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      message += `${this.translateEntryReason(entryReason)}\n`;
      message += `\n`;
    }

    // Exit Strategy (if available)
    if (exitStrategy && action !== 'WAIT') {
      message += `${this.translateExitStrategy(exitStrategy)}\n`;
    }

    // Chart Link
    message += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `📈 ดูกราฟ:\n`;
    message += `https://www.tradingview.com/chart/?symbol=BTCUSD&interval=${timeframeLabel.toLowerCase()}\n`;
    message += `\n`;
    message += `💡 ตัวชี้วัดพรีเมียมโดย Bengi\n`;

    return message;
  }

  /**
   * แปลงข้อความแพทเทิร์นเป็นภาษาไทย
   */
  private translatePatternText(text: string): string {
    return text
      .replace(/Uptrend detected/g, 'ตรวจพบเทรนด์ขาขึ้น')
      .replace(/Downtrend detected/g, 'ตรวจพบเทรนด์ขาลง')
      .replace(/SMA50 > SMA200/g, 'SMA50 มากกว่า SMA200')
      .replace(/SMA50 < SMA200/g, 'SMA50 น้อยกว่า SMA200')
      .replace(/Price near support/g, 'ราคาใกล้แนวรับ')
      .replace(/Price near resistance/g, 'ราคาใกล้แนวต้าน')
      .replace(/Buy the dip/g, 'ซื้อเมื่อราคาตก')
      .replace(/Sell the rally/g, 'ขายเมื่อราคาขึ้น')
      .replace(/Wait for pullback/g, 'รอราคาดึงกลับ')
      .replace(/Wait for bounce/g, 'รอราคากระเด้ง')
      .replace(/Sideways market/g, 'ตลาดข้าง')
      .replace(/Wait for confirmation/g, 'รอการยืนยัน');
  }

  /**
   * แปลงเหตุผลการเข้าเป็นภาษาไทย
   */
  private translateEntryReason(text: string): string {
    return text
      .replace(/✅ Uptrend confirmed/g, '✅ ยืนยันเทรนด์ขาขึ้น')
      .replace(/✅ Downtrend confirmed/g, '✅ ยืนยันเทรนด์ขาลง')
      .replace(/✅ RSI at/g, '✅ RSI อยู่ที่')
      .replace(/not overbought/g, 'ไม่ซื้อมากเกินไป')
      .replace(/not oversold/g, 'ไม่ขายมากเกินไป')
      .replace(/✅ MACD bullish momentum/g, '✅ MACD แสดงแรงซื้อ')
      .replace(/✅ MACD bearish momentum/g, '✅ MACD แสดงแรงขาย')
      .replace(/✅ High volume/g, '✅ ปริมาณการซื้อขายสูง')
      .replace(/above average/g, 'สูงกว่าค่าเฉลี่ย')
      .replace(/✅ Price below SMA50/g, '✅ ราคาต่ำกว่า SMA50')
      .replace(/✅ Price above SMA50/g, '✅ ราคาสูงกว่า SMA50')
      .replace(/support level/g, 'แนวรับ')
      .replace(/resistance level/g, 'แนวต้าน')
      .replace(/Waiting for better entry conditions/g, 'รอเงื่อนไขการเข้าที่ดีกว่า');
  }

  /**
   * แปลงกลยุทธ์การออกเป็นภาษาไทย
   */
  private translateExitStrategy(text: string): string {
    return text
      .replace(/Risk:/g, 'ความเสี่ยง:')
      .replace(/Reward:/g, 'ผลตอบแทน:')
      .replace(/Risk\/Reward:/g, 'อัตราเสี่ยง/ผลตอบแทน:')
      .replace(/Exit Strategy:/g, '💡 กลยุทธ์การออก:')
      .replace(/Take Profit:/g, '• Take Profit:')
      .replace(/Stop Loss:/g, '• Stop Loss:')
      .replace(/Trailing Stop:/g, '• Trailing Stop:')
      .replace(/sell 50% at TP1, 50% at TP2/g, 'ขาย 50% ที่ TP1, 50% ที่ TP2')
      .replace(/cover 50% at TP1, 50% at TP2/g, 'ปิด 50% ที่ TP1, 50% ที่ TP2')
      .replace(/strict, no exceptions/g, 'เข้มงวด ไม่มีข้อยกเว้น')
      .replace(/Consider trailing stop after/g, 'พิจารณา trailing stop หลังจาก');
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
   * ส่งสัญญาณไปยัง LINE user
   */
  async sendSignal(signal: Signal, targetUserId?: string): Promise<void> {
    try {
      const userId = targetUserId || this.userId;
      const messageText = this.formatSignalMessageThai(signal);
      const message: Message = {
        type: 'text',
        text: messageText,
      };

      await this.client.pushMessage(userId, message);
      console.log(`✅ ส่งสัญญาณสำหรับ ${signal.timeframeLabel} ไปยัง LINE`);
    } catch (error) {
      console.error(`❌ ไม่สามารถส่งข้อความ LINE สำหรับ ${signal.timeframeLabel}:`, error);
      throw error;
    }
  }

  /**
   * ส่งข้อความข้อความดิบไปยัง LINE user
   */
  async sendTextMessage(text: string, targetUserId?: string): Promise<void> {
    try {
      const userId = targetUserId || this.userId;
      const message: Message = {
        type: 'text',
        text,
      };

      await this.client.pushMessage(userId, message);
      console.log(`✅ ส่งข้อความไปยัง LINE`);
    } catch (error) {
      console.error(`❌ ไม่สามารถส่งข้อความ LINE:`, error);
      throw error;
    }
  }

  /**
   * ส่งสัญญาณหลายๆ ตัว
   */
  async sendSignals(signals: Signal[], targetUserId?: string): Promise<void> {
    for (const signal of signals) {
      await this.sendSignal(signal, targetUserId);
      // Small delay between messages to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
  }

  /**
   * ส่งข้อความสรุป
   */
  async sendSummary(signals: Signal[], targetUserId?: string): Promise<void> {
    const userId = targetUserId || this.userId;
    const activeSignals = signals.filter((s) => s.action !== 'WAIT' && s.status !== 'NO_SIGNAL');

    if (activeSignals.length === 0) {
      const summary = `╔═══════════════════════════╗\n` +
        `║  📊 สรุป BTC/USD พรีเมียม  ║\n` +
        `╚═══════════════════════════╝\n\n` +
        `⏸ ไม่มีสัญญาณที่ใช้งานได้ในขณะนี้\n` +
        `กรอบเวลาทั้งหมดแสดงสถานะรอ (WAIT)\n` +
        `\n` +
        `ตรวจสอบข้อความแต่ละกรอบเวลาเพื่อดูการวิเคราะห์รายละเอียด`;

      await this.sendTextMessage(summary, userId);
      return;
    }

    let summary = `╔═══════════════════════════╗\n`;
    summary += `║  📊 สรุป BTC/USD พรีเมียม  ║\n`;
    summary += `╚═══════════════════════════╝\n\n`;
    summary += `🎯 สัญญาณที่ใช้งานได้: ${activeSignals.length}\n\n`;

    for (const signal of activeSignals) {
      const actionThai = signal.action === 'BUY' ? 'ซื้อ' : 'ขาย';
      summary += `${signal.action === 'BUY' ? '🟢' : '🔴'} ${actionThai} บน ${signal.timeframeLabel}\n`;
      summary += `   ราคา: $${signal.price.toFixed(2)}\n`;
      if (signal.confidence !== undefined) {
        summary += `   ความมั่นใจ: ${signal.confidence}/100\n`;
      }
      summary += `\n`;
    }

    summary += `ตรวจสอบข้อความแต่ละกรอบเวลาเพื่อดูการวิเคราะห์รายละเอียด`;

    await this.sendTextMessage(summary, userId);
  }

  /**
   * Get LINE client (for webhook service)
   */
  getClient(): Client {
    return this.client;
  }
}

