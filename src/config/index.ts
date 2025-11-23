import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Twelve Data API
  twelveDataApiKey: process.env.TWELVE_DATA_API_KEY || '',
  
  // LINE Bot
  lineChannelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
  lineUserId: process.env.LINE_USER_ID || '',
  
  // Scheduler
  cronSchedule: process.env.CRON_SCHEDULE || '*/5 * * * *', // Every 5 minutes by default
  
  // Timeframes to analyze
  timeframes: [
    { interval: '15min', label: '15m' },
    { interval: '1h', label: '1H' },
    { interval: '4h', label: '4H' },
  ] as Array<{ interval: string; label: string }>,
  
  // App settings
  sendSummary: process.env.SEND_SUMMARY === 'true',
  enableLogging: process.env.ENABLE_LOGGING !== 'false',
};

// Validate required environment variables
export function validateConfig(): void {
  const required = [
    'TWELVE_DATA_API_KEY',
    'LINE_CHANNEL_ACCESS_TOKEN',
    'LINE_USER_ID',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      `Please check your .env file or Railway environment variables.`
    );
  }
}

