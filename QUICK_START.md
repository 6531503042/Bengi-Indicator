# Quick Start Guide 🚀

## สรุป Credentials ที่คุณมี

✅ **Twelve Data API Key**: `a1ca3d33951b458f935941eb8a2f27cc`  
✅ **LINE Channel ID**: `2008553184`  
✅ **LINE Channel Secret**: `6e9ad0fba3f14ecb7e4966df1d134458`

## ขั้นตอนที่เหลือ (2 ขั้นตอน)

### ขั้นตอนที่ 1: หา LINE Channel Access Token

1. ไปที่: https://developers.line.biz/console/
2. Login และเลือก **Provider** ของคุณ
3. เลือก **Messaging API Channel** (Channel ID: 2008553184)
4. ไปที่แท็บ **Messaging API**
5. หา **Channel access token** section
6. คลิก **Issue** (ถ้ายังไม่มี) หรือ **Reissue** (ถ้ามีแล้ว)
7. คลิก **Copy** เพื่อคัดลอก token

### ขั้นตอนที่ 2: หา LINE User ID

**วิธีง่ายที่สุด:**

1. ไปที่: https://manager.line.biz/
2. Login ด้วยบัญชี LINE ของคุณ
3. เลือก Official Account ที่เชื่อมกับ bot นี้
4. ไปที่ **Users** → **Friends**
5. ส่งข้อความไปหา LINE Bot ก่อน (เพื่อให้ bot รู้จักคุณ)
6. คลิกที่ชื่อของคุณ → จะเห็น **User ID**

หรือใช้วิธีอื่นตาม `LINE_SETUP.md`

## ตั้งค่า Local Development

1. **สร้างไฟล์ `.env`:**
```bash
cp env.example .env
```

2. **แก้ไข `.env` และใส่ข้อมูล:**
```env
TWELVE_DATA_API_KEY=a1ca3d33951b458f935941eb8a2f27cc
LINE_CHANNEL_ACCESS_TOKEN=ใส่_token_ที่ได้จากขั้นตอนที่_1
LINE_USER_ID=ใส่_user_id_ที่ได้จากขั้นตอนที่_2
CRON_SCHEDULE=*/5 * * * *
```

3. **ทดสอบ LINE Bot:**
```bash
npm run test:line
```

ถ้าเห็นข้อความ "✅ Message sent successfully!" แสดงว่าตั้งค่าถูกต้องแล้ว!

4. **Build และ Run:**
```bash
npm run build
npm start
```

## Deploy ไป Railway

### 1. Push ไป GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 2. Deploy บน Railway

1. ไปที่: https://railway.app/
2. **New Project** → **Deploy from GitHub repo**
3. เลือก repository ของคุณ
4. Railway จะ build อัตโนมัติ

### 3. ตั้งค่า Environment Variables ใน Railway

ใน Railway Dashboard → **Variables** tab → เพิ่ม:

```
TWELVE_DATA_API_KEY=a1ca3d33951b458f935941eb8a2f27cc
LINE_CHANNEL_ACCESS_TOKEN=ใส่_token_ที่ได้
LINE_USER_ID=ใส่_user_id_ที่ได้
CRON_SCHEDULE=*/5 * * * *
SEND_SUMMARY=false
ENABLE_LOGGING=true
```

### 4. ตรวจสอบ

1. ดู **Logs** tab ใน Railway
2. ควรเห็น:
   ```
   ⏰ Scheduler started with schedule: */5 * * * *
   📊 Monitoring timeframes: 15m, 1H, 4H
   🚀 Running initial job...
   ✅ Sent signal for 15m to LINE
   ```

3. ตรวจสอบ LINE ของคุณว่ามีข้อความมาหรือไม่

## Checklist

- [ ] ได้ LINE Channel Access Token แล้ว
- [ ] ได้ LINE User ID แล้ว
- [ ] สร้างไฟล์ `.env` และใส่ข้อมูลครบ
- [ ] ทดสอบด้วย `npm run test:line` สำเร็จ
- [ ] Build สำเร็จ (`npm run build`)
- [ ] Push ไป GitHub แล้ว
- [ ] Deploy บน Railway แล้ว
- [ ] ตั้งค่า Environment Variables ใน Railway ครบ
- [ ] ได้รับข้อความจาก LINE Bot แล้ว

## ต้องการความช่วยเหลือ?

- อ่าน `LINE_SETUP.md` สำหรับคำแนะนำละเอียด
- อ่าน `DEPLOYMENT.md` สำหรับการ deploy
- อ่าน `README.md` สำหรับข้อมูลทั่วไป

---

**พร้อมแล้ว!** เมื่อได้ Channel Access Token และ User ID แล้ว แค่ใส่ใน `.env` หรือ Railway แล้วใช้งานได้เลย 🎉

