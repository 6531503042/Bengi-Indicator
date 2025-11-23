import dotenv from 'dotenv';
dotenv.config();

import { DataService } from '../services/dataService';
import { SignalService } from '../services/signalService';
import { BacktestService } from '../services/backtestService';
import { LineService } from '../services/lineService';
import { config, validateConfig } from '../config';

async function runBacktest() {
  try {
    validateConfig();
  } catch (error) {
    console.error('❌ Configuration error:', error);
    process.exit(1);
  }

  const dataService = new DataService(config.twelveDataApiKey);
  const signalService = new SignalService();
  const backtestService = new BacktestService(signalService, dataService);
  const lineService = new LineService(config.lineChannelAccessToken, config.lineUserId);

  console.log('🚀 Starting Backtest...\n');

  // Run backtest for each timeframe
  for (const tf of config.timeframes) {
    console.log(`📊 Running backtest for ${tf.label}...`);
    
    try {
      const result = await backtestService.runBacktest(tf.interval, tf.label, 30);
      const formattedResult = backtestService.formatBacktestResult(result, tf.label);
      
      console.log('\n' + formattedResult + '\n');
      
      // Send to LINE
      await lineService.sendTextMessage(formattedResult);
      
      console.log(`✅ Backtest result sent to LINE for ${tf.label}\n`);
    } catch (error) {
      console.error(`❌ Error running backtest for ${tf.label}:`, error);
    }
  }

  console.log('✅ Backtest completed!');
}

runBacktest();

