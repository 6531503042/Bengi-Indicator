import cron from 'node-cron';
import { config, validateConfig } from './config';
import { DataService } from './services/dataService';
import { SignalService } from './services/signalService';
import { LineService } from './services/lineService';

// Validate configuration immediately (no delay needed)
try {
  validateConfig();
} catch (error) {
  console.error('\n❌ Configuration error:', error instanceof Error ? error.message : error);
  console.error('\n⏳ Waiting 10 seconds before exit to see logs...\n');
  setTimeout(() => {
    process.exit(1);
  }, 10000);
  // Don't return, let it wait
}

// Only initialize if config is valid
if (config.twelveDataApiKey && config.lineChannelAccessToken && config.lineUserId) {
  initializeApp();
} else {
  console.error('\n⚠️  Cannot start app - missing required environment variables');
  console.error('Please set variables in Railway Dashboard → Service → Variables tab\n');
}

function initializeApp() {

  // Initialize services
  const dataService = new DataService(config.twelveDataApiKey);
  const signalService = new SignalService();
  const lineService = new LineService(config.lineChannelAccessToken, config.lineUserId);

  /**
   * Main job function: Fetch data, generate signals, and send to LINE
   */
  async function runIndicatorJob(): Promise<void> {
  const startTime = new Date();
  console.log(`\n🚀 Starting indicator job at ${startTime.toISOString()}`);

  try {
    // Generate signals for all timeframes
    const signals = await signalService.generateSignalsForTimeframes(
      (interval: string) => dataService.fetchCandles(interval),
      config.timeframes
    );

    // Log signals
    if (config.enableLogging) {
      console.log('\n📊 Generated Signals:');
      signals.forEach((signal) => {
        console.log(`  ${signal.timeframeLabel}: ${signal.action} @ $${signal.price.toFixed(2)}`);
      });
    }

    // Send signals to LINE
    await lineService.sendSignals(signals);

    // Send summary if enabled
    if (config.sendSummary) {
      await lineService.sendSummary(signals);
    }

    const endTime = new Date();
    const duration = (endTime.getTime() - startTime.getTime()) / 1000;
    console.log(`✅ Job completed in ${duration.toFixed(2)}s\n`);
  } catch (error) {
    console.error('❌ Job error:', error);
    
    // Send error notification to LINE
    try {
      await lineService.sendSignal({
        timeframeLabel: 'ERROR',
        time: new Date().toISOString(),
        price: 0,
        trend: 'SIDEWAY',
        action: 'WAIT',
        sl: null,
        tp: null,
        patternText: `Error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`,
        sma50: null,
        sma200: null,
        status: 'NO_SIGNAL',
        reason: 'Job execution failed',
      });
    } catch (lineError) {
      console.error('❌ Failed to send error notification to LINE:', lineError);
    }
  }
}

  /**
   * Start the scheduler
   */
  function startScheduler(): void {
  console.log(`⏰ Scheduler started with schedule: ${config.cronSchedule}`);
  console.log(`📊 Monitoring timeframes: ${config.timeframes.map((tf) => tf.label).join(', ')}`);
  console.log(`📱 LINE User ID: ${config.lineUserId.substring(0, 10)}...`);
  console.log(`\n🔄 Waiting for scheduled runs...\n`);

  // Schedule the job
  cron.schedule(config.cronSchedule, () => {
    runIndicatorJob();
  });

  // Run immediately on startup
  console.log('🚀 Running initial job...');
  runIndicatorJob();
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n⚠️  SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n⚠️  SIGINT received, shutting down gracefully...');
  process.exit(0);
});

  // Start the application
  startScheduler();
}

