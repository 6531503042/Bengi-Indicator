import { Candle, Signal } from '../types';
import { SignalService } from './signalService';
import { DataService } from './dataService';

export interface BacktestResult {
  totalSignals: number;
  buySignals: number;
  sellSignals: number;
  waitSignals: number;
  winRate: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  totalProfit: number;
  averageProfit: number;
  maxDrawdown: number;
  sharpeRatio: number;
  signals: Array<{
    date: string;
    action: 'BUY' | 'SELL' | 'WAIT';
    entryPrice: number;
    exitPrice?: number;
    sl?: number;
    tp?: number;
    profit?: number;
    profitPercent?: number;
    result?: 'WIN' | 'LOSS' | 'OPEN';
  }>;
}

export class BacktestService {
  private signalService: SignalService;
  private dataService: DataService;

  constructor(signalService: SignalService, dataService: DataService) {
    this.signalService = signalService;
    this.dataService = dataService;
  }

  /**
   * Simulate trade execution
   */
  private simulateTrade(
    signal: Signal,
    candles: Candle[],
    startIndex: number
  ): { exitPrice: number; result: 'WIN' | 'LOSS'; profit: number; profitPercent: number } | null {
    if (!signal.sl || !signal.tp || signal.action === 'WAIT') {
      return null;
    }

    const entryPrice = signal.price;
    const sl = signal.sl;
    const tp = signal.tp;

    // Look ahead to find exit
    for (let i = startIndex + 1; i < Math.min(startIndex + 50, candles.length); i++) {
      const candle = candles[i];

      // Check if stop loss hit
      if (signal.action === 'BUY' && candle.low <= sl) {
        return {
          exitPrice: sl,
          result: 'LOSS',
          profit: sl - entryPrice,
          profitPercent: ((sl - entryPrice) / entryPrice) * 100,
        };
      }

      if (signal.action === 'SELL' && candle.high >= sl) {
        return {
          exitPrice: sl,
          result: 'LOSS',
          profit: entryPrice - sl,
          profitPercent: ((entryPrice - sl) / entryPrice) * 100,
        };
      }

      // Check if take profit hit
      if (signal.action === 'BUY' && candle.high >= tp) {
        return {
          exitPrice: tp,
          result: 'WIN',
          profit: tp - entryPrice,
          profitPercent: ((tp - entryPrice) / entryPrice) * 100,
        };
      }

      if (signal.action === 'SELL' && candle.low <= tp) {
        return {
          exitPrice: tp,
          result: 'WIN',
          profit: entryPrice - tp,
          profitPercent: ((entryPrice - tp) / entryPrice) * 100,
        };
      }
    }

    // If no exit found, use last candle price
    const lastCandle = candles[Math.min(startIndex + 20, candles.length - 1)];
    const exitPrice = lastCandle.close;
    
    if (signal.action === 'BUY') {
      const profit = exitPrice - entryPrice;
      return {
        exitPrice,
        result: profit > 0 ? 'WIN' : 'LOSS',
        profit,
        profitPercent: (profit / entryPrice) * 100,
      };
    } else {
      const profit = entryPrice - exitPrice;
      return {
        exitPrice,
        result: profit > 0 ? 'WIN' : 'LOSS',
        profit,
        profitPercent: (profit / entryPrice) * 100,
      };
    }
  }

  /**
   * Run backtest on historical data
   */
  async runBacktest(
    interval: string,
    timeframeLabel: string,
    lookbackDays: number = 30
  ): Promise<BacktestResult> {
    // Fetch more candles for backtest
    const outputsize = Math.min(lookbackDays * 24, 500); // Limit to 500 candles
    const candles = await this.dataService.fetchCandles(interval, outputsize);

    const signals: BacktestResult['signals'] = [];
    let totalProfit = 0;
    let maxDrawdown = 0;
    let peak = 0;
    let winningTrades = 0;
    let losingTrades = 0;

    // Generate signals for each period (every 10 candles)
    for (let i = 200; i < candles.length - 10; i += 10) {
      const slice = candles.slice(i);
      const signal = this.signalService.generateSignal(slice, timeframeLabel);

      if (signal.action !== 'WAIT' && signal.sl && signal.tp) {
        const tradeResult = this.simulateTrade(signal, candles, i);

        if (tradeResult) {
          totalProfit += tradeResult.profit;
          peak = Math.max(peak, totalProfit);
          maxDrawdown = Math.max(maxDrawdown, peak - totalProfit);

          if (tradeResult.result === 'WIN') {
            winningTrades++;
          } else {
            losingTrades++;
          }

          signals.push({
            date: signal.time,
            action: signal.action,
            entryPrice: signal.price,
            exitPrice: tradeResult.exitPrice,
            sl: signal.sl,
            tp: signal.tp,
            profit: tradeResult.profit,
            profitPercent: tradeResult.profitPercent,
            result: tradeResult.result,
          });
        } else {
          signals.push({
            date: signal.time,
            action: signal.action,
            entryPrice: signal.price,
            sl: signal.sl,
            tp: signal.tp,
            result: 'OPEN',
          });
        }
      } else {
        signals.push({
          date: signal.time,
          action: signal.action,
          entryPrice: signal.price,
        });
      }
    }

    const buySignals = signals.filter(s => s.action === 'BUY').length;
    const sellSignals = signals.filter(s => s.action === 'SELL').length;
    const waitSignals = signals.filter(s => s.action === 'WAIT').length;
    const totalTrades = winningTrades + losingTrades;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    const averageProfit = signals.filter(s => s.profit !== undefined).length > 0
      ? signals.filter(s => s.profit !== undefined).reduce((sum, s) => sum + (s.profit || 0), 0) / signals.filter(s => s.profit !== undefined).length
      : 0;

    // Calculate Sharpe Ratio (simplified)
    const profits = signals.filter(s => s.profit !== undefined).map(s => s.profit || 0);
    const avgReturn = profits.length > 0 ? profits.reduce((a, b) => a + b, 0) / profits.length : 0;
    const variance = profits.length > 0
      ? profits.reduce((sum, p) => sum + Math.pow(p - avgReturn, 2), 0) / profits.length
      : 0;
    const stdDev = Math.sqrt(variance);
    const sharpeRatio = stdDev !== 0 ? avgReturn / stdDev : 0;

    return {
      totalSignals: signals.length,
      buySignals,
      sellSignals,
      waitSignals,
      winRate,
      totalTrades,
      winningTrades,
      losingTrades,
      totalProfit,
      averageProfit,
      maxDrawdown,
      sharpeRatio,
      signals,
    };
  }

  /**
   * Format backtest result for display
   */
  formatBacktestResult(result: BacktestResult, timeframeLabel: string): string {
    let message = `╔═══════════════════════════╗\n`;
    message += `║  📊 BACKTEST RESULTS PREMIUM ║\n`;
    message += `╚═══════════════════════════╝\n\n`;
    message += `⏰ Timeframe: ${timeframeLabel}\n`;
    message += `📅 Period: Last 30 days\n\n`;

    message += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `📈 PERFORMANCE METRICS\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `Total Signals: ${result.totalSignals}\n`;
    message += `  🟢 BUY: ${result.buySignals}\n`;
    message += `  🔴 SELL: ${result.sellSignals}\n`;
    message += `  ⏸ WAIT: ${result.waitSignals}\n`;
    message += `\n`;

    message += `Total Trades: ${result.totalTrades}\n`;
    message += `  ✅ Wins: ${result.winningTrades}\n`;
    message += `  ❌ Losses: ${result.losingTrades}\n`;
    message += `  📊 Win Rate: ${result.winRate.toFixed(2)}%\n`;
    message += `\n`;

    message += `💰 PROFIT ANALYSIS\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `Total Profit: $${result.totalProfit.toFixed(2)}\n`;
    message += `Average Profit/Trade: $${result.averageProfit.toFixed(2)}\n`;
    message += `Max Drawdown: $${result.maxDrawdown.toFixed(2)}\n`;
    message += `Sharpe Ratio: ${result.sharpeRatio.toFixed(2)}\n`;
    message += `\n`;

    // Show last 5 trades
    const recentTrades = result.signals
      .filter(s => s.result && s.result !== 'OPEN')
      .slice(-5)
      .reverse();

    if (recentTrades.length > 0) {
      message += `📋 RECENT TRADES (Last 5)\n`;
      message += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      recentTrades.forEach((trade, index) => {
        const date = new Date(trade.date).toLocaleDateString('th-TH');
        const emoji = trade.result === 'WIN' ? '✅' : '❌';
        message += `${emoji} ${date}: ${trade.action} @ $${trade.entryPrice.toFixed(2)}\n`;
        if (trade.exitPrice && trade.profit !== undefined) {
          message += `   Exit: $${trade.exitPrice.toFixed(2)} (${trade.profitPercent?.toFixed(2)}%)\n`;
        }
      });
      message += `\n`;
    }

    message += `💡 Note: Backtest results are for reference only.\n`;
    message += `Past performance does not guarantee future results.`;

    return message;
  }
}

