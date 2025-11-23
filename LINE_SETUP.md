# LINE Bot Setup Guide

## Credentials ที่คุณมีแล้ว ✅

จากภาพที่คุณส่งมา:

- **Channel ID**: `2008553184`
- **Channel Secret**: `6e9ad0fba3f14ecb7e4966df1d134458`
- **Twelve Data API Key**: `a1ca3d33951b458f935941eb8a2f27cc` ✅

## สิ่งที่ยังต้องหา 🔍

### 1. LINE Channel Access Token (จำเป็น)

**วิธีหา:**

1. ไปที่ LINE Developers Console: https://developers.line.biz/console/
2. เลือก **Provider** ของคุณ
3. เลือก **Messaging API Channel** ที่มี Channel ID: `2008553184`
4. ไปที่แท็บ **Messaging API**
5. เลื่อนลงไปหา **Channel access token**
6. คลิก **Issue** เพื่อสร้าง token (ถ้ายังไม่มี)
7. คลิก **Copy** เพื่อคัดลอก token

**ตัวอย่าง token:**
```
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

⚠️ **สำคัญ**: Token จะมี 2 แบบ
- **Short-lived token**: หมดอายุใน 30 วัน
- **Long-lived token**: ใช้ได้นาน (แนะนำ)

### 2. LINE User ID (จำเป็น)

**วิธีหา User ID ของคุณ:**

#### วิธีที่ 1: ใช้ LINE Official Account Manager (ง่ายที่สุด)

1. ไปที่ https://manager.line.biz/
2. Login ด้วยบัญชี LINE ของคุณ
3. เลือก Official Account ที่เชื่อมกับ Channel ID `2008553184`
4. ไปที่ **Users** → **Friends**
5. ค้นหาตัวเอง (หรือให้เพื่อนส่งข้อความมาหา bot ก่อน)
6. คลิกที่ชื่อ → จะเห็น **User ID**

#### วิธีที่ 2: สร้าง Webhook Endpoint (สำหรับ Developer)

1. สร้างไฟล์ `test-webhook.js`:

```javascript
const express = require('express');
const app = express();

app.use(express.json());

app.post('/webhook', (req, res) => {
  const events = req.body.events;
  events.forEach(event => {
    if (event.type === 'message') {
      console.log('User ID:', event.source.userId);
      console.log('Message:', event.message.text);
    }
  });
  res.sendStatus(200);
});

app.listen(3000, () => {
  console.log('Webhook server running on port 3000');
});
```

2. Deploy ไปที่ Railway หรือใช้ ngrok:
```bash
ngrok http 3000
```

3. ตั้งค่า Webhook URL ใน LINE Developers Console:
   - ไปที่ **Messaging API** tab
   - ใส่ Webhook URL: `https://your-ngrok-url.ngrok.io/webhook`
   - คลิก **Verify** (ต้องได้ success)
   - คลิก **Update**

4. ส่งข้อความไปหา LINE Bot ของคุณ

5. ดู logs จะเห็น User ID

#### วิธีที่ 3: ใช้ LINE API Tester

1. ไปที่ LINE Developers Console
2. ไปที่ **Messaging API** tab
3. ใช้ **Try it out** section
4. ส่งข้อความทดสอบ → จะเห็น User ID ใน response

## ตั้งค่า Environment Variables

หลังจากได้ **Channel Access Token** และ **User ID** แล้ว:

### สำหรับ Local Development

สร้างไฟล์ `.env`:

```env
# Twelve Data API Key
TWELVE_DATA_API_KEY=a1ca3d33951b458f935941eb8a2f27cc

# LINE Bot Configuration
LINE_CHANNEL_ACCESS_TOKEN=your_channel_access_token_here
LINE_USER_ID=your_user_id_here

# Scheduler
CRON_SCHEDULE=*/5 * * * *

# Optional
SEND_SUMMARY=false
ENABLE_LOGGING=true
```

### สำหรับ Railway Deployment

ใน Railway Dashboard → **Variables** tab:

1. เพิ่ม `TWELVE_DATA_API_KEY` = `a1ca3d33951b458f935941eb8a2f27cc`
2. เพิ่ม `LINE_CHANNEL_ACCESS_TOKEN` = (token ที่คุณได้)
3. เพิ่ม `LINE_USER_ID` = (user id ที่คุณได้)
4. เพิ่ม `CRON_SCHEDULE` = `*/5 * * * *` (optional)

## ทดสอบ LINE Bot

### ทดสอบ Local

1. ตั้งค่า `.env` ให้ครบ
2. Run:
```bash
npm run build
npm start
```

3. ตรวจสอบ logs ว่าส่งข้อความสำเร็จ

### ทดสอบบน Railway

1. Deploy ไป Railway
2. ดู logs ใน Railway dashboard
3. ควรเห็น:
```
✅ Sent signal for 15m to LINE
✅ Sent signal for 1H to LINE
✅ Sent signal for 4H to LINE
```

4. ตรวจสอบ LINE ของคุณว่ามีข้อความมาหรือไม่

## Troubleshooting

### ❌ "Invalid channel access token"

- ตรวจสอบว่า token ถูกต้อง
- ตรวจสอบว่า token ยังไม่หมดอายุ
- ลองสร้าง token ใหม่

### ❌ "User not found" หรือ "Invalid user ID"

- ตรวจสอบว่า User ID ถูกต้อง
- ตรวจสอบว่าผู้ใช้ได้ add friend กับ LINE Bot แล้ว
- ตรวจสอบว่า Messaging API เปิดใช้งานแล้ว

### ❌ ไม่ได้รับข้อความ

- ตรวจสอบว่า LINE Bot เปิดใช้งานแล้ว
- ตรวจสอบว่า User ID ถูกต้อง
- ตรวจสอบ logs ใน Railway
- ลองส่งข้อความไปหา bot ก่อน (เพื่อให้ bot รู้จักคุณ)

## Quick Test Script

สร้างไฟล์ `test-line.js` เพื่อทดสอบ:

```javascript
require('dotenv').config();
const { Client } = require('@line/bot-sdk');

const client = new Client({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
});

async function test() {
  try {
    await client.pushMessage(process.env.LINE_USER_ID, {
      type: 'text',
      text: '🧪 Test message from Bengi Indicator Bot!',
    });
    console.log('✅ Message sent successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

test();
```

Run:
```bash
node test-line.js
```

---

**พร้อมแล้ว!** เมื่อได้ Channel Access Token และ User ID แล้ว แค่ใส่ใน `.env` หรือ Railway variables แล้ว deploy ได้เลย 🚀

