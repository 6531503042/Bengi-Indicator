# การตั้งค่า LINE Webhook สำหรับตอบกลับอัตโนมัติ

## ฟีเจอร์ใหม่ ✨

ตอนนี้ LINE Bot สามารถตอบกลับข้อความอัตโนมัติได้แล้ว! 

### คำสั่งที่ใช้ได้:

- **ขอสัญญาณ**: `สัญญาณ`, `signal`, `สัญญาณใหม่`, `ราคา`, `btc`
- **ความช่วยเหลือ**: `help`, `ช่วย`, `คำสั่ง`, `เมนู`
- **ทดสอบ**: `backtest`, `ทดสอบ`

## การตั้งค่า

### 1. เพิ่ม Environment Variable ใน Railway

เพิ่ม `LINE_CHANNEL_SECRET` ใน Railway Dashboard → Service → Variables:

```
LINE_CHANNEL_SECRET=6e9ad0fba3f14ecb7e4966df1d134458
```

### 2. ตั้งค่า Webhook URL ใน LINE Developers Console

1. ไปที่ https://developers.line.biz/console/
2. เลือก Messaging API Channel ของคุณ
3. ไปที่แท็บ **Messaging API**
4. หา **Webhook URL** section
5. ใส่ URL: `https://your-railway-app.up.railway.app/webhook`
6. คลิก **Verify** (ต้องได้ success)
7. คลิก **Update**

### 3. เปิดใช้งาน Webhook

ใน LINE Developers Console → Messaging API tab:
- เปิด **Use webhook** (Enable)

### 4. Deploy บน Railway

Railway จะใช้ PORT environment variable อัตโนมัติ (หรือใช้ 3000 เป็นค่า default)

## การทดสอบ

1. เพิ่ม LINE Bot เป็นเพื่อน
2. ส่งข้อความ: `สัญญาณ`
3. Bot จะตอบกลับด้วยสัญญาณล่าสุดทันที!

## หมายเหตุ

- Webhook จะทำงานบน port ที่ Railway กำหนด (ดูใน Railway Dashboard)
- ถ้าไม่ตั้ง `LINE_CHANNEL_SECRET` webhook จะไม่ทำงาน แต่ scheduled signals ยังทำงานปกติ
- ข้อความทั้งหมดเป็นภาษาไทย

