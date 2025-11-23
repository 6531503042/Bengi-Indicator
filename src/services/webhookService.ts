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

    // Parse JSON body
    this.app.use(express.json());

    // LINE webhook middleware
    this.app.use(
      '/webhook',
      middleware({
        channelSecret,
        channelAccessToken,
      } as any)
    );

    // Webhook endpoint
    this.app.post('/webhook', async (req: Request, res: Response) => {
      const events: WebhookEvent[] = req.body.events;

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
    });

    // Health check
    this.app.get('/health', (req: Request, res: Response) => {
      res.status(200).json({ status: 'ok' });
    });
  }

  /**
   * Handle text messages from users
   */
  private async handleTextMessage(event: WebhookEvent): Promise<void> {
    if (event.type !== 'message' || event.message.type !== 'text') {
      return;
    }

    const text = event.message.text.toLowerCase().trim();
    const userId = event.source.userId || config.lineUserId;

    // Command keywords (Thai and English)
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

    // Check if message matches any keyword
    const isSignalRequest = signalKeywords.some((keyword) => text.includes(keyword));
    const isHelpRequest = helpKeywords.some((keyword) => text.includes(keyword));
    const isBacktestRequest = backtestKeywords.some((keyword) => text.includes(keyword));

    if (isSignalRequest) {
      await this.sendSignalResponse(userId);
    } else if (isHelpRequest) {
      await this.sendHelpMessage(userId);
    } else if (isBacktestRequest) {
      await this.sendBacktestMessage(userId);
    } else {
      // Default: send help message
      await this.sendHelpMessage(userId);
    }
  }

  /**
   * Send signal response
   */
  private async sendSignalResponse(userId: string): Promise<void> {
    try {
      // Send loading message
      await this.lineService.sendTextMessage(
        `⏳ กำลังวิเคราะห์สัญญาณ BTC/USD...\nกรุณารอสักครู่...`,
        userId
      );

      // Generate signals
      const signals = await this.signalService.generateSignalsForTimeframes(
        (interval: string) => this.dataService.fetchCandles(interval),
        config.timeframes
      );

      // Send signals
      await this.lineService.sendSignals(signals, userId);

      // Send summary
      await this.lineService.sendSummary(signals, userId);
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
    const helpText = `📱 คำสั่งที่ใช้ได้\n` +
      `═══════════════════\n\n` +
      `📊 ขอสัญญาณ:\n` +
      `• สัญญาณ\n` +
      `• signal\n` +
      `• สัญญาณใหม่\n` +
      `• ราคา\n` +
      `• btc\n\n` +
      `📈 ทดสอบระบบ:\n` +
      `• backtest\n` +
      `• ทดสอบ\n\n` +
      `❓ ความช่วยเหลือ:\n` +
      `• help\n` +
      `• ช่วย\n` +
      `• คำสั่ง\n\n` +
      `💡 ตัวอย่าง:\n` +
      `พิมพ์ "สัญญาณ" เพื่อดูสัญญาณล่าสุด\n` +
      `พิมพ์ "backtest" เพื่อดูผลการทดสอบ\n\n` +
      `🤖 Bengi Indicator Premium`;

    await this.lineService.sendTextMessage(helpText, userId);
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
    this.app.listen(port, () => {
      console.log(`🌐 Webhook server started on port ${port}`);
      console.log(`📡 Webhook URL: /webhook`);
    });
  }
}

