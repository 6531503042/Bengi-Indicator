# Bengi Indicator

Premium BTC/USD Forex Indicator with LINE Bot notifications. This application monitors BTC/USD price movements across multiple timeframes, analyzes trends using technical indicators (SMA50/SMA200), and sends trading signals via LINE Bot.

## Features

- 📊 **Multi-Timeframe Analysis**: Monitors 15m, 1H, and 4H timeframes
- 📈 **Technical Indicators**: Uses SMA50 and SMA200 for trend analysis
- 🎯 **Trading Signals**: Generates BUY/SELL signals with SL/TP levels
- 📱 **LINE Bot Integration**: Sends real-time notifications to LINE
- ⏰ **Automated Scheduling**: Configurable cron-based monitoring
- 🚀 **Railway Ready**: Optimized for Railway free-tier deployment

## Architecture

```
src/
├── config/          # Configuration and environment variables
├── services/        # Business logic services
│   ├── dataService.ts    # Twelve Data API integration
│   ├── signalService.ts  # Signal generation logic
│   └── lineService.ts    # LINE Bot messaging
├── types/           # TypeScript type definitions
├── utils/           # Utility functions (indicators)
└── index.ts         # Main application entry point
```

## Prerequisites

Before you begin, you'll need:

1. **Twelve Data API Key** (Free tier available)
   - Sign up at: https://twelvedata.com/
   - Get your API key from the dashboard

2. **LINE Bot Setup**
   - Create a LINE Official Account at: https://developers.line.biz/
   - Enable Messaging API
   - Get your Channel Access Token (long-lived)
   - Get your User ID (use LINE's webhook or tools to find it)

3. **Railway Account** (for deployment)
   - Sign up at: https://railway.app/
   - Free tier includes $5 credit + 500 hours/month

## Installation

### Local Development

1. Clone the repository:
```bash
git clone <your-repo-url>
cd Bengi-Indicator
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment variables:
```bash
cp env.example .env
```

4. Edit `.env` and fill in your credentials:
```env
TWELVE_DATA_API_KEY=your_api_key_here
LINE_CHANNEL_ACCESS_TOKEN=your_token_here
LINE_USER_ID=your_user_id_here
CRON_SCHEDULE=*/5 * * * *
```

5. Build the project:
```bash
npm run build
```

6. Run the application:
```bash
npm start
```

Or run in development mode:
```bash
npm run dev
```

## Deployment to Railway

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```

### Step 2: Deploy on Railway

1. Go to [Railway Dashboard](https://railway.app/)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Railway will automatically detect the Node.js project

### Step 3: Configure Environment Variables

In Railway project settings, add these environment variables:

- `TWELVE_DATA_API_KEY` - Your Twelve Data API key
- `LINE_CHANNEL_ACCESS_TOKEN` - Your LINE Bot access token
- `LINE_USER_ID` - Your LINE user ID
- `CRON_SCHEDULE` - (Optional) Default: `*/5 * * * *` (every 5 minutes)
- `SEND_SUMMARY` - (Optional) `true` or `false`
- `ENABLE_LOGGING` - (Optional) `true` or `false`

### Step 4: Deploy

Railway will automatically:
- Install dependencies (`npm install`)
- Build the project (`npm run build`)
- Start the application (`npm start`)

Check the logs to verify it's running correctly.

## How It Works

### Signal Generation Logic

1. **Data Fetching**: Retrieves BTC/USD candles from Twelve Data API
2. **Trend Analysis**: Calculates SMA50 and SMA200 to determine trend
   - **UPTREND**: SMA50 > SMA200
   - **DOWNTREND**: SMA50 < SMA200
   - **SIDEWAY**: No clear trend

3. **Signal Generation**:
   - **BUY Signal**: Uptrend + Price near/below SMA50 (buy the dip)
   - **SELL Signal**: Downtrend + Price near/above SMA50 (sell the rally)
   - **WAIT**: No clear entry opportunity

4. **Risk Management**:
   - **BUY**: SL = Entry - 1%, TP = Entry + 2% (1:2 Risk/Reward)
   - **SELL**: SL = Entry + 1%, TP = Entry - 2% (1:2 Risk/Reward)

### LINE Bot Messages

Each signal includes:
- ⏰ Timeframe (15m, 1H, 4H)
- 🕐 Timestamp
- 💰 Current price
- 📈 Trend direction
- 🟢/🔴 Action (BUY/SELL/WAIT)
- 🛑 Stop Loss level
- 🎯 Take Profit level
- 📊 Risk/Reward ratio
- 📝 Pattern analysis
- 📈 TradingView chart link

## Configuration

### Cron Schedule

Edit `CRON_SCHEDULE` in your environment variables:

- `*/5 * * * *` - Every 5 minutes (default)
- `*/15 * * * *` - Every 15 minutes
- `0 */1 * * *` - Every hour
- `0 9,17 * * *` - At 9 AM and 5 PM daily

### Timeframes

Edit `src/config/index.ts` to add/remove timeframes:

```typescript
timeframes: [
  { interval: '15min', label: '15m' },
  { interval: '1h', label: '1H' },
  { interval: '4h', label: '4H' },
  { interval: '1day', label: '1D' }, // Add daily timeframe
],
```

### Risk/Reward Ratios

Edit `src/services/signalService.ts` to adjust SL/TP calculations:

```typescript
// Current: 1% risk, 2% reward
const { sl, tp } = calculateBuySLTP(currentPrice, 1, 2);

// Change to: 2% risk, 4% reward
const { sl, tp } = calculateBuySLTP(currentPrice, 2, 4);
```

## Getting Your LINE User ID

1. **Method 1: Using LINE Bot Webhook**
   - Set up a webhook endpoint
   - Send a message to your bot
   - Check webhook logs for `source.userId`

2. **Method 2: Using LINE Official Account Manager**
   - Go to LINE Official Account Manager
   - Check user list (if you have admin access)

3. **Method 3: Using LINE API**
   - Use LINE's Get Profile API after user interacts with bot

## Troubleshooting

### Railway Deployment Issues

- **Build fails**: Check Node.js version (requires >= 18.0.0)
- **App crashes**: Check Railway logs for error messages
- **No messages received**: Verify LINE_USER_ID is correct

### API Issues

- **Twelve Data errors**: Check API key validity and rate limits
- **No data returned**: Verify symbol format (BTC/USD) and interval

### LINE Bot Issues

- **Messages not sent**: Verify Channel Access Token
- **User ID not found**: Make sure user has interacted with bot first

## Development

### Project Structure

```
Bengi-Indicator/
├── src/
│   ├── config/          # Configuration
│   ├── services/        # Business logic
│   ├── types/           # TypeScript types
│   ├── utils/           # Utilities
│   └── index.ts         # Entry point
├── dist/                # Compiled JavaScript (generated)
├── package.json
├── tsconfig.json
├── railway.json         # Railway config
└── README.md
```

### Adding New Indicators

1. Add calculation function in `src/utils/indicators.ts`
2. Update signal logic in `src/services/signalService.ts`
3. Add indicator values to `Signal` type in `src/types/index.ts`

### Testing

```bash
# Run in development mode with watch
npm run dev

# Build and check for errors
npm run build
```

## Important Notes

⚠️ **Disclaimer**: This is an educational/development tool. The signals generated are based on simple technical analysis and should NOT be used as the sole basis for trading decisions. Always:

- Backtest strategies before using real money
- Use proper risk management
- Consider multiple factors before trading
- Never risk more than you can afford to lose

## License

MIT License - Feel free to modify and use for your own projects.

## Support

For issues or questions:
1. Check Railway logs for errors
2. Verify all environment variables are set correctly
3. Test API keys independently
4. Check LINE Bot webhook status

---

Made with ❤️ for developers who want to build trading indicators
