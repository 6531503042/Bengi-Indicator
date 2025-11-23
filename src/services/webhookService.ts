import express, { Request, Response } from 'express';
import { middleware, WebhookEvent, TextMessage, Message } from '@line/bot-sdk';
import { DataService } from './dataService';
import { SignalService } from './signalService';
import { LineServiceThai } from './lineServiceThai';
import { config } from '../config';

export class WebhookService {
  private app: express.Application;
  private dataService: DataService;
  private signalService: SignalService;
  private lineService: LineServiceThai;

  constructor(
    channelSecret: string,
    channelAccessToken: string,
    dataService: DataService,
    signalService: SignalService,
    lineService: LineServiceThai
  ) {
    this.app = express();
    this.dataService = dataService;
    this.signalService = signalService;
    this.lineService = lineService;

    // Health check endpoint (before middleware)
    this.app.get('/health', (req: Request, res: Response) => {
      res.status(200).json({ status: 'ok' });
    });

    // LINE webhook endpoint - must use raw body for signature verification
    this.app.post(
      '/webhook',
      express.raw({ type: 'application/json' }),
      middleware({
        channelSecret,
        channelAccessToken,
      } as any),
      async (req: Request, res: Response) => {
        const events: WebhookEvent[] = (req as any).body.events;

        try {
          for (const event of events) {
            if (event.type === 'message' && event.message.type === 'text') {
              await this.handleTextMessage(event);
            }
          }
          res.status(200).send('OK');
        } catch (error) {
          console.error('Webhook error:', error);
          res.status(500).send('Error');
        }
      }
    );
  }

  /**
   * Handle text messages from users
   */
  private async handleTextMessage(event: WebhookEvent): Promise<void> {
    if (event.type !== 'message' || event.message.type !== 'text') {
      return;
    }

    const text = event.message.text.trim();
    const textLower = text.toLowerCase();
    const userId = event.source.userId || config.lineUserId;

    console.log(`📩 Received message: "${text}" from user: ${userId.substring(0, 10)}...`);

    // Timeframe-specific commands (check exact matches first)
    const tf15mKeywords = ['ขอแนวทาง tf-15m', 'tf-15m', 'tf-15', '15m', '15 นาที', '15นาที'];
    const tf30mKeywords = ['ขอแนวทาง tf-30m', 'tf-30m', 'tf-30', '30m', '30 นาที', '30นาที'];
    const tf1hrKeywords = ['ขอแนวทาง tf-1hr', 'tf-1hr', 'tf-1h', 'tf-1', '1hr', '1h', '1 ชั่วโมง', '1ชั่วโมง'];
    const tf4hrKeywords = ['ขอแนวทาง tf-4hr', 'tf-4hr', 'tf-4h', 'tf-4', '4hr', '4h', '4 ชั่วโมง', '4ชั่วโมง'];

    // General signal keywords (exclude timeframe-specific)
    const signalKeywords = [
      'signal',
      'สัญญาณ',
      'สัญญาณใหม่',
      'signal ใหม่',
      'ดูสัญญาณ',
      'check signal',
      'update',
      'อัพเดท',
      'อัปเดท',
      'ราคา',
      'price',
      'btc',
      'bitcoin',
    ];

    const helpKeywords = ['help', 'ช่วย', 'คำสั่ง', 'command', 'menu', 'เมนู'];

    const backtestKeywords = ['backtest', 'ทดสอบ', 'test', 'ทดลอง'];

    // Check for timeframe-specific requests (exact match first, then includes)
    const isTf15m = tf15mKeywords.some((keyword) => 
      textLower === keyword.toLowerCase() || textLower.includes(keyword.toLowerCase())
    );
    const isTf30m = tf30mKeywords.some((keyword) => 
      textLower === keyword.toLowerCase() || textLower.includes(keyword.toLowerCase())
    );
    const isTf1hr = tf1hrKeywords.some((keyword) => 
      textLower === keyword.toLowerCase() || textLower.includes(keyword.toLowerCase())
    );
    const isTf4hr = tf4hrKeywords.some((keyword) => 
      textLower === keyword.toLowerCase() || textLower.includes(keyword.toLowerCase())
    );
    const isHelp = helpKeywords.some((keyword) => 
      textLower === keyword.toLowerCase() || textLower.includes(keyword.toLowerCase())
    );
    const isBacktest = backtestKeywords.some((keyword) => 
      textLower === keyword.toLowerCase() || textLower.includes(keyword.toLowerCase())
    );
    const isSignal = signalKeywords.some((keyword) => 
      textLower === keyword.toLowerCase() || textLower.includes(keyword.toLowerCase())
    ) && !isTf15m && !isTf30m && !isTf1hr && !isTf4hr; // Exclude if already matched timeframe

    console.log(`🔍 Matched: tf15m=${isTf15m}, tf30m=${isTf30m}, tf1hr=${isTf1hr}, tf4hr=${isTf4hr}, help=${isHelp}, signal=${isSignal}`);

    if (isTf15m) {
      console.log(`📊 Processing 15m request`);
      await this.sendTimeframeSignal(userId, '15min', '15m');
    } else if (isTf30m) {
      console.log(`📊 Processing 30m request`);
      await this.sendTimeframeSignal(userId, '30min', '30m');
    } else if (isTf1hr) {
      console.log(`📊 Processing 1H request`);
      await this.sendTimeframeSignal(userId, '1h', '1H');
    } else if (isTf4hr) {
      console.log(`📊 Processing 4H request`);
      await this.sendTimeframeSignal(userId, '4h', '4H');
    } else if (isSignal) {
      console.log(`📊 Processing general signal request (default: 1H)`);
      await this.sendSignalResponse(userId);
    } else if (isHelp) {
      console.log(`📊 Processing help request`);
      await this.sendHelpMessage(userId);
    } else if (isBacktest) {
      console.log(`📊 Processing backtest request`);
      await this.sendBacktestMessage(userId);
    } else {
      console.log(`📊 Unknown command, sending help`);
      // Default: send help message with quick reply
      await this.sendHelpMessage(userId);
    }
  }

  /**
   * Send signal for specific timeframe
   */
  private async sendTimeframeSignal(userId: string, interval: string, label: string): Promise<void> {
    try {
      // Send loading message
      await this.lineService.sendTextMessage(
        `⏳ กำลังวิเคราะห์สัญญาณ BTC/USD (${label})...\nกรุณารอสักครู่...`,
        userId
      );

      // Generate signal for specific timeframe
      const candles = await this.dataService.fetchCandles(interval);
      const signal = this.signalService.generateSignal(candles, label);

      // Send signal
      await this.lineService.sendSignal(signal, userId);
    } catch (error) {
      console.error(`Error sending ${label} signal:`, error);
      await this.lineService.sendTextMessage(
        `❌ เกิดข้อผิดพลาดในการดึงสัญญาณ ${label}\nกรุณาลองใหม่อีกครั้ง`,
        userId
      );
    }
  }

  /**
   * Send signal response (default: 1H)
   */
  private async sendSignalResponse(userId: string): Promise<void> {
    try {
      // Send loading message
      await this.lineService.sendTextMessage(
        `⏳ กำลังวิเคราะห์สัญญาณ BTC/USD (1H)...\nกรุณารอสักครู่...`,
        userId
      );

      // Generate signals (only 1H for scheduled)
      const signals = await this.signalService.generateSignalsForTimeframes(
        (interval: string) => this.dataService.fetchCandles(interval),
        config.timeframes
      );

      // Send signals
      await this.lineService.sendSignals(signals, userId);
    } catch (error) {
      console.error('Error sending signal response:', error);
      await this.lineService.sendTextMessage(
        `❌ เกิดข้อผิดพลาดในการดึงสัญญาณ\nกรุณาลองใหม่อีกครั้ง`,
        userId
      );
    }
  }

  /**
   * Send help message
   */
  private async sendHelpMessage(userId: string): Promise<void> {
    try {
      console.log(`📤 Sending help message to user: ${userId.substring(0, 10)}...`);
      const helpText = `📱 คำสั่งที่ใช้ได้\n` +
        `═══════════════════\n\n` +
        `📊 ขอสัญญาณตาม Timeframe:\n` +
        `• ขอแนวทาง tf-15m (15 นาที)\n` +
        `• ขอแนวทาง tf-30m (30 นาที)\n` +
        `• ขอแนวทาง tf-1hr (1 ชั่วโมง)\n` +
        `• ขอแนวทาง tf-4hr (4 ชั่วโมง)\n\n` +
        `📊 ขอสัญญาณทั่วไป:\n` +
        `• สัญญาณ (จะได้ 1H)\n` +
        `• signal\n` +
        `• ราคา\n` +
        `• btc\n\n` +
        `💡 ใช้ปุ่มด้านล่างเพื่อเลือก Timeframe\n` +
        `หรือพิมพ์คำสั่งตามต้องการ\n\n` +
        `🤖 Bengi Indicator Premium`;

      await this.lineService.sendTextMessageWithQuickReply(helpText, userId);
      console.log(`✅ Help message sent successfully`);
    } catch (error) {
      console.error(`❌ Error sending help message:`, error);
      // Try sending without quick reply as fallback
      try {
        const simpleHelp = `📱 คำสั่ง: help, สัญญาณ, ขอแนวทาง tf-15m/tf-30m/tf-1hr/tf-4hr`;
        await this.lineService.sendTextMessage(simpleHelp, userId);
      } catch (fallbackError) {
        console.error(`❌ Fallback help message also failed:`, fallbackError);
      }
    }
  }

  /**
   * Send backtest message
   */
  private async sendBacktestMessage(userId: string): Promise<void> {
    await this.lineService.sendTextMessage(
      `⏳ กำลังรัน Backtest...\nกรุณารอสักครู่...`,
      userId
    );
    // Backtest will be implemented separately
    await this.lineService.sendTextMessage(
      `💡 ฟีเจอร์ Backtest กำลังพัฒนา\nใช้คำสั่ง "สัญญาณ" เพื่อดูสัญญาณล่าสุดได้เลยครับ`,
      userId
    );
  }

  /**
   * Start webhook server
   */
  start(port: number): void {
    this.app.listen(port, '0.0.0.0', () => {
      console.log(`🌐 Webhook server started on port ${port}`);
      console.log(`📡 Webhook URL: http://0.0.0.0:${port}/webhook`);
      console.log(`📡 Health check: http://0.0.0.0:${port}/health`);
    });
  }

  /**
   * Get Express app (for testing or custom setup)
   */
  getApp(): express.Application {
    return this.app;
  }
}

