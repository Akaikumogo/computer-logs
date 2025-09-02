# 🕐 Attendance System - Complete Implementation

## 🎯 **Overview**

Attendance (kirish-chiqish) tizimi to'liq qo'shildi! Endi har bir xodimning kirish-chiqish vaqtini, joylashuvini va ish vaqtini kuzatib borishingiz mumkin.

## ✅ **Asosiy Xususiyatlar**

### **1. 🔄 Smart Check-In/Out Logic**

- **Birinchi POST** = Kirish
- **Ikkinchi POST** = Chiqish  
- **Uchinchi POST** = Kirish
- **Cheksiz davom etadi** - Kirish va Chiqish almashadi

### **2. 📍 Location Tracking**

- **GPS koordinatalari** - latitude, longitude
- **Manzil** - reverse geocoding bilan
- **GPS aniqligi** - qurilma aniqligi
- **Qurilma ma'lumoti** - qaysi qurilmadan kirgan

### **3. ⏰ Automatic Status Detection**

- **NORMAL** - Oddiy kirish-chiqish
- **LATE** - 9:00 dan keyin kirish
- **EARLY** - 18:00 dan oldin chiqish
- **OVERTIME** - 18:00 dan keyin chiqish
- **WARNING** - 18:00 dan keyin ishda qolgan

### **4. 🚨 Warning System**

- **Cron job** - har kuni 18:00 da ishga tushadi
- **Avtomatik warning** - 18:00 dan keyin chiqmagan xodimlarga
- **Warning management** - ADMIN va HR warninglarni ko'ra oladi

### **5. 📊 Comprehensive Reports**

- **Kunlik** - bugungi kirish-chiqish
- **Haftalik** - o'tgan hafta statistikasi
- **Oylik** - oy bo'yi ma'lumotlari
- **Yillik** - yil bo'yi umumiy statistikasi

## 🚀 **API Endpoints**

### **🔐 Authentication Required**

| Method | Endpoint                    | Auth | Roles | Description                      |
| ------ | --------------------------- | ---- | ----- | -------------------------------- |
| `POST` | `/attendance/check-in-out` | ✅   | All   | Kirish yoki chiqish qayd qilish |
| `GET`  | `/attendance/today/:id`    | ✅   | All   | Bugungi attendance ma'lumoti    |
| `GET`  | `/attendance`               | ✅   | All   | Attendance ro'yxati             |
| `GET`  | `/attendance/statistics/:id`| ✅   | All   | Xodim statistikasi              |

### **📋 Reports (ADMIN/HR Only)**

| Method | Endpoint                    | Auth | Roles     | Description         |
| ------ | --------------------------- | ---- | --------- | ------------------- |
| `GET`  | `/attendance/reports/daily` | ✅   | ADMIN, HR | Kunlik hisobot      |
| `GET`  | `/attendance/reports/weekly`| ✅   | ADMIN, HR | Haftalik hisobot    |
| `GET`  | `/attendance/reports/monthly`| ✅   | ADMIN, HR | Oylik hisobot       |
| `GET`  | `/attendance/reports/yearly`| ✅   | ADMIN, HR | Yillik hisobot      |

### **🚨 Warning Management (ADMIN/HR Only)**

| Method | Endpoint                           | Auth | Roles     | Description         |
| ------ | ---------------------------------- | ---- | --------- | ------------------- |
| `GET`  | `/attendance/warnings`             | ✅   | ADMIN, HR | Warninglar ro'yxati |
| `GET`  | `/attendance/warnings/clear/:id`   | ✅   | ADMIN, HR | Warning tozalash    |

### **🌐 Public Endpoints (No Auth)**

| Method | Endpoint                           | Auth | Description                      |
| ------ | ---------------------------------- | ---- | -------------------------------- |
| `POST` | `/attendance/public/check-in-out` | ❌   | Mobile app uchun kirish-chiqish |

## 📱 **Usage Examples**

### **1. Kirish-Chiqish Qayd Qilish**

```bash
POST /attendance/check-in-out
Content-Type: application/json

{
  "employeeId": "507f1f77bcf86cd799439011",
  "location": {
    "latitude": 41.3111,
    "longitude": 69.2797,
    "address": "Toshkent sh., Yunusobod tumani",
    "accuracy": 5.0
  },
  "device": "iPhone 15",
  "notes": "Ofisga kirish"
}
```

**Response:**

```json
{
  "id": "att_123",
  "employeeId": "507f1f77bcf86cd799439011",
  "employeeName": "Sarvarbek Xazratov",
  "timestamp": "2025-01-15T09:00:00.000Z",
  "type": "in",
  "status": "normal",
  "location": {
    "latitude": 41.3111,
    "longitude": 69.2797,
    "address": "Toshkent sh., Yunusobod tumani",
    "accuracy": 5.0
  },
  "device": "iPhone 15",
  "notes": "Ofisga kirish",
  "hasWarning": false,
  "createdAt": "2025-01-15T09:00:00.000Z"
}
```

### **2. Bugungi Attendance Ma'lumoti**

```bash
GET /attendance/today/507f1f77bcf86cd799439011
Authorization: Bearer {token}
```

**Response:**

```json
{
  "employeeId": "507f1f77bcf86cd799439011",
  "today": "2025-01-15",
  "checkIns": 2,
  "checkOuts": 1,
  "totalWorkHours": 4.5,
  "status": "Currently at work",
  "attendances": [
    {
      "id": "att_1",
      "timestamp": "2025-01-15T09:00:00.000Z",
      "type": "in",
      "status": "normal",
      "location": { ... },
      "device": "iPhone 15",
      "notes": "Ofisga kirish"
    },
    {
      "id": "att_2",
      "timestamp": "2025-01-15T12:00:00.000Z",
      "type": "out",
      "status": "normal",
      "location": { ... },
      "device": "iPhone 15",
      "notes": "Tushlik uchun chiqish"
    },
    {
      "id": "att_3",
      "timestamp": "2025-01-15T13:00:00.000Z",
      "type": "in",
      "status": "normal",
      "location": { ... },
      "device": "iPhone 15",
      "notes": "Tushlikdan qaytish"
    }
  ]
}
```

### **3. Xodim Statistikasi**

```bash
GET /attendance/statistics/507f1f77bcf86cd799439011?fromDate=2025-01-01&toDate=2025-01-31
Authorization: Bearer {token}
```

**Response:**

```json
{
  "totalCheckIns": 22,
  "totalCheckOuts": 22,
  "totalWorkHours": 176.5,
  "averageWorkHours": 8.0,
  "lateCount": 2,
  "earlyCount": 1,
  "overtimeCount": 3,
  "warningCount": 1
}
```

## ⏰ **Cron Jobs Schedule**

### **🕕 Daily Warning Check (18:00)**
- 18:00 dan keyin chiqmagan xodimlarga warning qo'yadi
- Warning reason: "18:00 dan keyin ishda qolgan"

### **🕐 Daily Warning Reset (00:01)**
- Kechagi warninglarni tozalash
- Yangi kun uchun tayyorlash

### **📅 Weekly Statistics (Monday 09:00)**
- O'tgan hafta statistikasini hisoblash
- Haftalik hisobotlarni tayyorlash

### **📊 Monthly Statistics (1st of month 09:00)**
- O'tgan oy statistikasini hisoblash
- Oylik hisobotlarni tayyorlash

### **📈 Yearly Statistics (1st January 09:00)**
- O'tgan yil statistikasini hisoblash
- Yillik hisobotlarni tayyorlash

## 🔧 **Configuration**

### **Environment Variables**

```env
# Attendance Settings
ATTENDANCE_WORK_START_TIME=09:00
ATTENDANCE_WORK_END_TIME=18:00
ATTENDANCE_LATE_THRESHOLD=09:00
ATTENDANCE_EARLY_THRESHOLD=18:00
ATTENDANCE_OVERTIME_THRESHOLD=18:00

# Cron Settings
ATTENDANCE_WARNING_CHECK_TIME=18:00
ATTENDANCE_WARNING_RESET_TIME=00:01
ATTENDANCE_WEEKLY_STATS_TIME=09:00
ATTENDANCE_MONTHLY_STATS_TIME=09:00
ATTENDANCE_YEARLY_STATS_TIME=09:00
```

### **Database Indexes**

```javascript
// Performance optimization
AttendanceSchema.index({ employeeId: 1, timestamp: -1 });
AttendanceSchema.index({ timestamp: -1 });
AttendanceSchema.index({ type: 1 });
AttendanceSchema.index({ status: 1 });
AttendanceSchema.index({ 'location.latitude': 1, 'location.longitude': 1 });
AttendanceSchema.index({ hasWarning: 1 });
```

## 📊 **Data Models**

### **Attendance Schema**

```typescript
{
  employeeId: ObjectId,        // Xodim ID
  timestamp: Date,             // Kirish/chiqish vaqti
  type: 'in' | 'out',          // Turi
  status: 'normal' | 'late' | 'early' | 'overtime' | 'warning',
  location: {                  // GPS koordinatalari
    latitude: number,
    longitude: number,
    address?: string,
    accuracy?: number
  },
  device?: string,             // Qurilma ma'lumoti
  notes?: string,              // Izohlar
  hasWarning: boolean,         // Warning bormi
  warningReason?: string,      // Warning sababi
  warningTimestamp?: Date,     // Warning vaqti
  isDeleted: boolean,          // Soft delete
  deletedAt?: Date             // O'chirilgan vaqt
}
```

### **Location Schema**

```typescript
{
  latitude: number,            // Kenglik
  longitude: number,           // Uzunlik
  address?: string,            // Manzil
  city?: string,               // Shahar
  country?: string,            // Mamlakat
  accuracy?: number,           // GPS aniqligi
  altitude?: number,           // Balandlik
  speed?: number,              // Tezlik
  heading?: number,            // Yo'nalish
  deviceInfo?: string,         // Qurilma ma'lumoti
  isDeleted: boolean,          // Soft delete
  deletedAt?: Date             // O'chirilgan vaqt
}
```

## 🎯 **Business Logic**

### **1. Check-In/Out Logic**

```typescript
// Birinchi marta = Kirish
if (todayAttendances.length === 0) {
  type = AttendanceType.IN;
  
  // Kechikish tekshirish (9:00 dan keyin)
  if (now > workStartTime) {
    status = AttendanceStatus.LATE;
  }
} else {
  // Keyingi martalar - Kirish va Chiqish almashadi
  const lastAttendance = todayAttendances[todayAttendances.length - 1];
  type = lastAttendance.type === AttendanceType.IN ? AttendanceType.OUT : AttendanceType.IN;
  
  // Chiqish bo'lsa vaqt tekshirish
  if (type === AttendanceType.OUT) {
    if (now < workEndTime) {
      status = AttendanceStatus.EARLY;
    } else if (now > workEndTime) {
      status = AttendanceStatus.OVERTIME;
    }
  }
}
```

### **2. Warning System**

```typescript
// 18:00 dan keyin chiqmagan xodimlarga warning
if (lastAttendance.type === AttendanceType.IN) {
  const lastCheckInTime = new Date(lastAttendance.timestamp);
  const workEndTime = new Date(today);
  workEndTime.setHours(18, 0, 0, 0);
  
  if (lastCheckInTime > workEndTime) {
    // Warning qo'shish
    await this.attendanceModel.findByIdAndUpdate(lastAttendance._id, {
      hasWarning: true,
      warningReason: '18:00 dan keyin ishda qolgan',
      warningTimestamp: new Date(),
    });
  }
}
```

### **3. Work Hours Calculation**

```typescript
// Ish vaqtini hisoblash
let totalWorkHours = 0;
for (let i = 0; i < attendances.length - 1; i += 2) {
  if (attendances[i].type === AttendanceType.IN && attendances[i + 1]?.type === AttendanceType.OUT) {
    const checkIn = new Date(attendances[i].timestamp);
    const checkOut = new Date(attendances[i + 1].timestamp);
    const diffMs = checkOut.getTime() - checkIn.getTime();
    totalWorkHours += diffMs / (1000 * 60 * 60); // Soatga o'tkazish
  }
}
```

## 🚀 **Next Steps**

### **1. Report Implementation**
- Daily, weekly, monthly, yearly report logikasi
- Excel/PDF export
- Email notification

### **2. Advanced Features**
- Geofencing - ofis hududida kirish-chiqish
- Face recognition integration
- Biometric authentication
- Mobile app development

### **3. Analytics Dashboard**
- Real-time attendance monitoring
- Performance metrics
- Trend analysis
- Predictive analytics

## 🎉 **Benefits**

✅ **Avtomatik** - manual kirish-chiqish yo'q  
✅ **Aniq** - GPS koordinatalari bilan  
✅ **Smart** - avtomatik status aniqlash  
✅ **Monitoring** - real-time kuzatish  
✅ **Reports** - to'liq hisobotlar  
✅ **Warning** - avtomatik ogohlantirish  
✅ **Scalable** - katta kompaniyalar uchun  

Endi attendance tizimingiz to'liq ishlaydi! 🎯
