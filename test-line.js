/**
 * Quick test script for LINE Bot
 * Run: node test-line.js
 */

require('dotenv').config();
const { Client } = require('@line/bot-sdk');

// Check environment variables
if (!process.env.LINE_CHANNEL_ACCESS_TOKEN) {
  console.error('❌ LINE_CHANNEL_ACCESS_TOKEN is not set in .env file');
  process.exit(1);
}

if (!process.env.LINE_USER_ID) {
  console.error('❌ LINE_USER_ID is not set in .env file');
  process.exit(1);
}

const client = new Client({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
});

async function testLineBot() {
  console.log('🧪 Testing LINE Bot connection...');
  console.log(`📱 User ID: ${process.env.LINE_USER_ID.substring(0, 10)}...`);
  console.log(`🔑 Token: ${process.env.LINE_CHANNEL_ACCESS_TOKEN.substring(0, 20)}...\n`);

  try {
    const message = {
      type: 'text',
      text: '🧪 Test message from Bengi Indicator Bot!\n\nIf you receive this message, your LINE Bot is configured correctly! ✅',
    };

    await client.pushMessage(process.env.LINE_USER_ID, message);
    console.log('✅ Message sent successfully!');
    console.log('📱 Check your LINE app for the test message.');
  } catch (error) {
    console.error('❌ Error sending message:');
    
    if (error.statusCode === 401) {
      console.error('   → Invalid Channel Access Token');
      console.error('   → Please check your LINE_CHANNEL_ACCESS_TOKEN in .env');
    } else if (error.statusCode === 400) {
      console.error('   → Invalid User ID or User not found');
      console.error('   → Please check your LINE_USER_ID in .env');
      console.error('   → Make sure you have added the LINE Bot as a friend');
    } else {
      console.error(`   → ${error.message}`);
    }
    
    process.exit(1);
  }
}

testLineBot();

