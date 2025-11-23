import dotenv from 'dotenv';

dotenv.config();

/**
 * Helper function to get environment variable and trim quotes if present
 */
function getEnv(key: string, defaultValue: string = ''): string {
  const value = process.env[key] || defaultValue;
  // Remove surrounding quotes if present
  if (value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1);
  }
  if (value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1);
  }
  return value;
}

export const config = {
  // Twelve Data API
  twelveDataApiKey: getEnv('TWELVE_DATA_API_KEY'),
  
  // LINE Bot
  lineChannelAccessToken: getEnv('LINE_CHANNEL_ACCESS_TOKEN'),
  lineUserId: getEnv('LINE_USER_ID'),
  
  // Scheduler
  cronSchedule: getEnv('CRON_SCHEDULE', '*/5 * * * *'), // Every 5 minutes by default
  
  // Timeframes to analyze
  timeframes: [
    { interval: '15min', label: '15m' },
    { interval: '1h', label: '1H' },
    { interval: '4h', label: '4H' },
  ] as Array<{ interval: string; label: string }>,
  
  // App settings
  sendSummary: getEnv('SEND_SUMMARY') === 'true',
  enableLogging: getEnv('ENABLE_LOGGING', 'true') !== 'false',
};

// Validate required environment variables
export function validateConfig(): void {
  const required = [
    'TWELVE_DATA_API_KEY',
    'LINE_CHANNEL_ACCESS_TOKEN',
    'LINE_USER_ID',
  ];

  // Debug: Log all environment variables (hide sensitive values)
  console.log('\n🔍 Environment Variables Check:');
  required.forEach((key) => {
    const rawValue = process.env[key];
    const value = getEnv(key);
    if (value && value !== '') {
      const displayValue = value.length > 20 ? `${value.substring(0, 20)}...` : value;
      console.log(`  ✅ ${key}: ${displayValue}`);
      if (rawValue && (rawValue.startsWith('"') || rawValue.startsWith("'"))) {
        console.log(`     ⚠️  Note: Quotes detected and removed automatically`);
      }
    } else {
      console.log(`  ❌ ${key}: NOT SET`);
    }
  });
  console.log('');

  const missing = required.filter((key) => {
    const value = getEnv(key);
    return !value || value === '';
  });

  if (missing.length > 0) {
    console.error('\n❌ Missing Environment Variables:');
    missing.forEach((key) => {
      console.error(`   - ${key}`);
    });
    console.error('\n💡 Please check:');
    console.error('   1. Railway Dashboard → Service → Variables tab');
    console.error('   2. Make sure variables are set WITHOUT quotes');
    console.error('   3. Restart deployment after adding variables\n');
    
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      `Please check your .env file or Railway environment variables.`
    );
  }
}

