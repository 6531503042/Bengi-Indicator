# อธิบาย LINE Webhook POST Request

## การทำงานของ LINE Webhook

### 1. Flow การทำงาน

```
User พิมพ์ข้อความใน LINE
    ↓
LINE Platform ส่ง HTTP POST มาที่ Railway URL
    ↓
Express Server รับ POST ที่ /webhook endpoint
    ↓
LINE Middleware ตรวจสอบ signature
    ↓
Handler ประมวลผลข้อความ
    ↓
ตอบกลับด้วย pushMessage หรือ replyMessage
```

### 2. Express Endpoint ที่ใช้

**ไฟล์**: `src/services/webhookService.ts`

```typescript
// LINE webhook middleware (ตรวจสอบ signature)
this.app.use(
  '/webhook',
  middleware({
    channelSecret,
    channelAccessToken,
  })
);

// Webhook endpoint (รับ POST จาก LINE)
this.app.post('/webhook', async (req: Request, res: Response) => {
  const events: WebhookEvent[] = req.body.events;
  
  // ประมวลผล events
  for (const event of events) {
    if (event.type === 'message' && event.message.type === 'text') {
      await this.handleTextMessage(event);
    }
  }
  
  res.status(200).send('OK'); // ตอบกลับ LINE ว่าได้รับแล้ว
});
```

### 3. การตั้งค่าใน Railway

#### ขั้นที่ 1: Deploy บน Railway

1. Push code ไป GitHub
2. Railway → New Project → Deploy from GitHub
3. รอ build & deploy เสร็จ

#### ขั้นที่ 2: ดู URL ของ Railway

1. ไปที่ Railway Dashboard → Service ของคุณ
2. ดูที่แท็บ **Settings** → **Domains**
3. จะเห็น URL ประมาณ: `https://your-app-name.up.railway.app`
4. ถ้าไม่มี ให้กด **Generate Domain**

#### ขั้นที่ 3: ตั้งค่า LINE Webhook URL

1. ไปที่ https://developers.line.biz/console/
2. เลือก Messaging API Channel ของคุณ
3. ไปที่แท็บ **Messaging API**
4. หา **Webhook URL** section
5. ใส่ URL: `https://your-app-name.up.railway.app/webhook`
   - แทนที่ `your-app-name` ด้วย domain จริงจาก Railway
   - `/webhook` คือ path ที่เราเขียนใน Express
6. คลิก **Verify** (ต้องขึ้น success)
7. คลิก **Update**
8. เปิดใช้งาน **Use webhook**: Enabled

### 4. Environment Variables ที่ต้องตั้ง

ใน Railway Dashboard → Service → Variables:

```
LINE_CHANNEL_ACCESS_TOKEN=your_token_here
LINE_CHANNEL_SECRET=your_secret_here
LINE_USER_ID=your_user_id_here
TWELVE_DATA_API_KEY=your_api_key_here
PORT=3000 (Railway จะตั้งให้อัตโนมัติ)
```

### 5. วิธีทดสอบ

#### ทดสอบ 1: Health Check

เปิด browser ไปที่:
```
https://your-app-name.up.railway.app/health
```

ควรเห็น:
```json
{"status":"ok"}
```

#### ทดสอบ 2: LINE Webhook

1. เพิ่ม LINE Bot เป็นเพื่อน
2. ส่งข้อความ: `สัญญาณ` หรือ `help`
3. Bot ควรตอบกลับทันที

### 6. Debugging

#### ดู Logs ใน Railway

1. ไปที่ Railway Dashboard → Service
2. คลิกแท็บ **Logs**
3. ดู logs ว่า:
   - `🌐 Webhook server started on port XXXX`
   - `✅ ส่งสัญญาณสำหรับ...`

#### ถ้า Bot ไม่ตอบกลับ

1. ตรวจสอบว่า LINE Webhook URL ถูกต้อง
2. ตรวจสอบว่า **Use webhook** เปิดอยู่
3. ดู Logs ใน Railway ว่ามี error หรือไม่
4. ทดสอบ Health Check endpoint

### 7. สรุป

- **LINE จะ POST มาที่**: `https://your-railway-domain/webhook`
- **Express รับที่**: `app.post('/webhook', ...)`
- **Middleware**: ตรวจสอบ signature อัตโนมัติ
- **Handler**: ประมวลผลข้อความและตอบกลับ

**สำคัญ**: 
- Railway จะให้ PORT อัตโนมัติ (ดูใน environment variables)
- Express ต้อง listen ที่ `process.env.PORT`
- URL ใน LINE Webhook ต้องตรงกับ Railway domain + `/webhook`

