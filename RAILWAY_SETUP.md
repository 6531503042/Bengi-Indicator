# Railway Setup Guide - แก้ปัญหา Environment Variables

## ⚠️ ปัญหาที่เจอ

Logs แสดงว่า:
```
❌ TWELVE_DATA_API_KEY: NOT SET
❌ LINE_CHANNEL_ACCESS_TOKEN: NOT SET
❌ LINE_USER_ID: NOT SET
```

## ✅ วิธีแก้ไข (Step by Step)

### ขั้นตอนที่ 1: ไปที่ Railway Dashboard

1. เปิด https://railway.app/
2. Login เข้าบัญชี
3. เลือก Project: `courteous-spontaneity`

### ขั้นตอนที่ 2: ไปที่ Service (ไม่ใช่ Project)

**สำคัญมาก**: ต้องคลิกที่ **Service** (`web`) ไม่ใช่ Project!

1. ในหน้า Project คุณจะเห็น Service ชื่อ `web`
2. **คลิกที่ Service `web`** (ไม่ใช่คลิกที่ชื่อ Project)

### ขั้นตอนที่ 3: ไปที่ Variables Tab

1. หลังจากคลิกที่ Service `web` แล้ว
2. ดูที่เมนูด้านบน: **Variables**, Metrics, Settings, etc.
3. **คลิกที่ "Variables"** (ไม่ใช่ "Shared Variables")

### ขั้นตอนที่ 4: เพิ่ม Environment Variables

คลิก **+ New Variable** แล้วเพิ่มทีละตัว:

#### Variable 1:
```
Name: TWELVE_DATA_API_KEY
Value: a1ca3d33951b458f935941eb8a2f27cc
```

#### Variable 2:
```
Name: LINE_CHANNEL_ACCESS_TOKEN
Value: HjJHNy/CG0cW7pO6OYikuEPVpjvGOpSJSaDKJeTyvQv1kQ6ABCM0u4nGGGBWuwZeS2lA5sQiqbupMBBC8H2jlCt7KcSd/F21Bj3IEFzn62Ci00TdcECB/CU+k8pBvhvNWJg+wvarzkQFsYvdmc1hjgdB04t89/1O/w1cDnyilFU=
```

#### Variable 3:
```
Name: LINE_USER_ID
Value: U83e77c3cdd46fbe7ebc52385d959298e
```

#### Variable 4 (Optional):
```
Name: CRON_SCHEDULE
Value: */5 * * * *
```

#### Variable 5 (Optional):
```
Name: SEND_SUMMARY
Value: false
```

#### Variable 6 (Optional):
```
Name: ENABLE_LOGGING
Value: true
```

### ขั้นตอนที่ 5: ตรวจสอบ

1. หลังจากเพิ่ม variables แล้ว Railway จะ restart อัตโนมัติ
2. ไปที่ **Logs** tab
3. ดู logs ควรเห็น:

```
🔍 Debugging Environment Variables...
Total env vars: [จำนวน]
Looking for: TWELVE_DATA_API_KEY, LINE_CHANNEL_ACCESS_TOKEN, LINE_USER_ID

📋 Environment Variables Check:
  ✅ TWELVE_DATA_API_KEY: a1ca3d33951b458f93...
  ✅ LINE_CHANNEL_ACCESS_TOKEN: HjJHNy/CG0cW7pO6OYik...
  ✅ LINE_USER_ID: U83e77c3cd...

✅ All required environment variables are set!

⏰ Scheduler started with schedule: */5 * * * *
📊 Monitoring timeframes: 15m, 1H, 4H
🚀 Running initial job...
```

## 🔍 ตรวจสอบว่า Variables ถูกตั้งค่าหรือยัง

### วิธีที่ 1: ดูใน Railway Dashboard

1. ไปที่ Service → Variables tab
2. ควรเห็น variables ทั้ง 3 ตัว:
   - `TWELVE_DATA_API_KEY`
   - `LINE_CHANNEL_ACCESS_TOKEN`
   - `LINE_USER_ID`

### วิธีที่ 2: ดู Logs

หลังจาก push โค้ดใหม่แล้ว ดู logs จะเห็น:
- ถ้ามี: `✅ TWELVE_DATA_API_KEY: ...`
- ถ้าไม่มี: `❌ TWELVE_DATA_API_KEY: NOT SET`

## ❌ สิ่งที่ผิดพลาดบ่อย

### 1. ตั้งค่าใน Shared Variables แทน Service Variables

**ผิด**: Project → Shared Variables  
**ถูก**: Service → Variables

### 2. ตั้งค่าใน Project level แทน Service level

**ผิด**: คลิกที่ Project แล้วตั้งค่า  
**ถูก**: คลิกที่ Service (`web`) แล้วตั้งค่า

### 3. ใส่ quotes รอบค่า

**ผิด**: `TWELVE_DATA_API_KEY="a1ca3d33951b458f935941eb8a2f27cc"`  
**ถูก**: `TWELVE_DATA_API_KEY=a1ca3d33951b458f935941eb8a2f27cc`

(แต่โค้ดรองรับ quotes แล้ว ถ้าใส่ก็ไม่เป็นไร)

## 📸 ภาพรวมโครงสร้าง

```
Railway Dashboard
└── Project: courteous-spontaneity
    └── Service: web  ← คลิกที่นี่!
        └── Variables Tab  ← ตั้งค่าตรงนี้!
            ├── TWELVE_DATA_API_KEY
            ├── LINE_CHANNEL_ACCESS_TOKEN
            └── LINE_USER_ID
```

## 🚀 หลังจากตั้งค่าเสร็จ

1. Railway จะ restart อัตโนมัติ
2. ดู Logs ควรเห็นว่า variables ถูกอ่านได้แล้ว
3. คุณจะได้รับข้อความจาก LINE Bot ทุก 5 นาที

## 💡 ถ้ายังไม่ทำงาน

1. ลบ variables ทั้งหมดออก
2. เพิ่มใหม่ทีละตัว (ไม่มี quotes)
3. Restart deployment:
   - ไปที่ Deployments tab
   - คลิก ... → Redeploy
4. ดู Logs อีกครั้ง

---

**สำคัญ**: ต้องตั้งค่าใน **Service → Variables** ไม่ใช่ **Project → Shared Variables**!

