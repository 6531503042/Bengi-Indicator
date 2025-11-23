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
  lineChannelSecret: getEnv('LINE_CHANNEL_SECRET'),
  lineUserId: getEnv('LINE_USER_ID'),
  webhookPort: parseInt(process.env.PORT || process.env.WEBHOOK_PORT || '3000', 10),
  
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

  // Debug: Show all process.env keys (for debugging)
  console.log('\n🔍 Debugging Environment Variables...');
  console.log(`Total env vars: ${Object.keys(process.env).length}`);
  console.log(`Looking for: ${required.join(', ')}`);
  
  // Show all env vars that start with our keys (for debugging)
  const envKeys = Object.keys(process.env).filter(key => 
    required.some(req => key.includes(req) || req.includes(key))
  );
  if (envKeys.length > 0) {
    console.log(`Found related env vars: ${envKeys.join(', ')}`);
  }
  
  // Show first 20 env var names (for debugging Railway setup)
  const allEnvKeys = Object.keys(process.env).slice(0, 20);
  console.log(`\n📋 Sample env vars (first 20): ${allEnvKeys.join(', ')}`);
  console.log('');

  // Debug: Log all environment variables (hide sensitive values)
  console.log('📋 Environment Variables Check:');
  required.forEach((key) => {
    const rawValue = process.env[key];
    const value = getEnv(key);
    
    if (rawValue !== undefined) {
      console.log(`  📌 ${key}:`);
      console.log(`     Raw value exists: ${rawValue ? 'YES' : 'NO'}`);
      console.log(`     Raw length: ${rawValue ? rawValue.length : 0}`);
      if (rawValue) {
        const preview = rawValue.length > 30 ? `${rawValue.substring(0, 30)}...` : rawValue;
        console.log(`     Raw preview: "${preview}"`);
      }
    } else {
      console.log(`  ❌ ${key}: NOT FOUND in process.env`);
    }
    
    if (value && value !== '') {
      const displayValue = value.length > 20 ? `${value.substring(0, 20)}...` : value;
      console.log(`  ✅ ${key}: ${displayValue}`);
      if (rawValue && (rawValue.startsWith('"') || rawValue.startsWith("'"))) {
        console.log(`     ⚠️  Quotes detected and removed automatically`);
      }
    } else {
      console.log(`  ❌ ${key}: EMPTY or NOT SET`);
    }
    console.log('');
  });

  const missing = required.filter((key) => {
    const value = getEnv(key);
    return !value || value === '';
  });

  if (missing.length > 0) {
    console.error('\n❌ Missing Environment Variables:');
    missing.forEach((key) => {
      console.error(`   - ${key}`);
    });
    console.error('\n💡 Railway Setup Instructions:');
    console.error('   1. Go to Railway Dashboard');
    console.error('   2. Click on your SERVICE (not project)');
    console.error('   3. Go to "Variables" tab (NOT "Shared Variables")');
    console.error('   4. Add these variables:');
    console.error('      TWELVE_DATA_API_KEY=a1ca3d33951b458f935941eb8a2f27cc');
    console.error('      LINE_CHANNEL_ACCESS_TOKEN=HjJHNy/CG0cW7pO6OYikuEPVpjvGOpSJSaDKJeTyvQv1kQ6ABCM0u4nGGGBWuwZeS2lA5sQiqbupMBBC8H2jlCt7KcSd/F21Bj3IEFzn62Ci00TdcECB/CU+k8pBvhvNWJg+wvarzkQFsYvdmc1hjgdB04t89/1O/w1cDnyilFU=');
    console.error('      LINE_USER_ID=U83e77c3cdd46fbe7ebc52385d959298e');
    console.error('   5. NO QUOTES needed (but quotes are OK, code handles them)');
    console.error('   6. Railway will auto-restart after adding variables\n');
    
    // Don't exit immediately, wait a bit to see logs
    setTimeout(() => {
      throw new Error(
        `Missing required environment variables: ${missing.join(', ')}\n` +
        `Please check Railway Dashboard → Service → Variables tab.`
      );
    }, 1000);
  } else {
    console.log('✅ All required environment variables are set!\n');
  }
}

