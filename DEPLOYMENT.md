# Deployment Guide

## Quick Start for Railway

### 1. Prepare Your Repository

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit"

# Push to GitHub
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 2. Railway Setup

1. Go to [Railway.app](https://railway.app/)
2. Sign up/Login with GitHub
3. Click **"New Project"**
4. Select **"Deploy from GitHub repo"**
5. Choose your `Bengi-Indicator` repository
6. Railway will auto-detect Node.js and start building

### 3. Configure Environment Variables

In Railway project dashboard:

1. Go to **Variables** tab
2. Add these environment variables:

```
TWELVE_DATA_API_KEY=your_api_key_here
LINE_CHANNEL_ACCESS_TOKEN=your_token_here
LINE_USER_ID=your_user_id_here
CRON_SCHEDULE=*/5 * * * *
SEND_SUMMARY=false
ENABLE_LOGGING=true
```

### 4. Verify Deployment

1. Check **Deployments** tab - should show "Active"
2. Check **Logs** tab - should see:
   ```
   ⏰ Scheduler started with schedule: */5 * * * *
   📊 Monitoring timeframes: 15m, 1H, 4H
   🚀 Running initial job...
   ```

### 5. Test LINE Bot

Wait for the first scheduled run (or trigger manually by redeploying). You should receive LINE messages with BTC/USD signals.

## Getting API Keys

### Twelve Data API Key

1. Go to https://twelvedata.com/
2. Sign up for free account
3. Navigate to **API Keys** section
4. Copy your API key
5. Free tier includes 800 API calls/day (enough for this app)

### LINE Bot Credentials

1. Go to https://developers.line.biz/
2. Create a new **Provider** (if you don't have one)
3. Create a new **Messaging API Channel**
4. In **Channel settings**:
   - Copy **Channel Access Token** (long-lived)
   - Enable **Messaging API**
5. To get **User ID**:
   - Option A: Use LINE's webhook tester
   - Option B: Send a message to your bot and check webhook logs
   - Option C: Use LINE Official Account Manager

## Railway Free Tier Limits

- **$5 credit** (one-time for new accounts)
- **500 hours/month** of compute time
- **512 MB RAM** per service
- **1 GB storage**

For this indicator bot:
- Runs continuously (~730 hours/month)
- Uses minimal resources (~50-100 MB RAM)
- **Note**: Free tier may not cover 24/7 operation. Consider:
  - Using longer intervals (e.g., `*/15 * * * *` = every 15 min)
  - Running only during trading hours
  - Upgrading to paid plan for 24/7 operation

## Monitoring

### Check Logs

In Railway dashboard → **Logs** tab, you should see:

```
🚀 Starting indicator job at 2024-01-01T00:00:00.000Z
📊 Generated Signals:
  15m: BUY @ $45000.00
  1H: WAIT @ $45000.00
  4H: SELL @ $45000.00
✅ Sent signal for 15m to LINE
✅ Sent signal for 1H to LINE
✅ Sent signal for 4H to LINE
✅ Job completed in 2.34s
```

### Common Issues

**Issue**: Build fails
- **Solution**: Check Node.js version (needs >= 18). Railway auto-detects from `.nvmrc`

**Issue**: App crashes on startup
- **Solution**: Check environment variables are set correctly

**Issue**: No LINE messages received
- **Solution**: 
  - Verify `LINE_USER_ID` is correct
  - Check LINE Bot is enabled
  - Verify Channel Access Token is valid

**Issue**: API errors
- **Solution**: 
  - Check Twelve Data API key
  - Verify API rate limits (free tier: 800 calls/day)
  - Check internet connectivity

## Cost Optimization

To stay within free tier:

1. **Increase interval**: Change `CRON_SCHEDULE` to `*/15 * * * *` or `*/30 * * * *`
2. **Reduce timeframes**: Edit `src/config/index.ts` to monitor fewer timeframes
3. **Schedule downtime**: Use cron to pause during off-hours
4. **Monitor usage**: Check Railway dashboard for resource usage

## Upgrading

If you need 24/7 operation:

1. Railway **Hobby Plan** ($5/month): Unlimited hours
2. Or use alternative platforms:
   - **Render** (free tier with limitations)
   - **Fly.io** (generous free tier)
   - **Heroku** (paid only)

## Troubleshooting

### Railway Logs Show Errors

1. Check environment variables are set
2. Verify API keys are valid
3. Check Node.js version compatibility
4. Review error messages in logs

### LINE Bot Not Responding

1. Verify Channel Access Token hasn't expired
2. Check User ID is correct
3. Ensure Messaging API is enabled
4. Test with LINE's API tester

### No Signals Generated

1. Check Twelve Data API is returning data
2. Verify symbol format (BTC/USD)
3. Check if enough candles are available (needs 200+)
4. Review signal logic thresholds

---

Need help? Check the main README.md or Railway documentation.

