# Attendance System - Backend Logic va Frontend UI Tavsiyalari

## 📋 Umumiy ma'lumot

Bu dokumentatsiya Attendance (Davomat) tizimining backend logikasini va frontend uchun qanday UI yaratish kerakligini tushuntiradi. Boshliqlar va dasturchilar uchun tushunarli qilib yozilgan.

## 🏗️ Backend Tizim Arxitekturasi

### Modullar va Vazifalari

- **AttendanceController** - API endpointlari (frontend bilan aloqa)
- **AttendanceService** - Asosiy business logic (mantiq)
- **AttendanceCronService** - Avtomatik vazifalar (18:00 da warning qo'yish)
- **AttendanceModule** - Modul konfiguratsiyasi

### Ma'lumotlar Bazasi Schema'lari

- **Attendance** - Har bir kirish/chiqish yozuvi
- **Employee** - Xodimlar ma'lumoti
- **Location** - GPS koordinatalari

---

## 🔐 Autentifikatsiya Tizimi

Barcha endpointlar JWT token talab qiladi, faqat public endpointlar bundan mustasno.

```typescript
// Frontend dan backend ga so'rov yuborishda
Authorization: Bearer<jwt_token>;
```

---

## 📊 Backend Ma'lumotlar Strukturasi

### Davomat Turlari (AttendanceType)

```typescript
enum AttendanceType {
  IN = 'in', // Kirish
  OUT = 'out', // Chiqish
}
```

### Davomat Statuslari (AttendanceStatus)

```typescript
enum AttendanceStatus {
  NORMAL = 'normal', // Oddiy (9:00 dan oldin kirish, 18:00 dan keyin chiqish)
  LATE = 'late', // Kechikish (9:00 dan keyin kirish)
  EARLY = 'early', // Erta chiqish (18:00 dan oldin chiqish)
  OVERTIME = 'overtime', // Qo'shimcha ish (18:00 dan keyin chiqish)
  WARNING = 'warning', // Ogohlantirish (18:00 dan keyin ishda qolgan)
}
```

### Attendance Ma'lumotlari

```typescript
interface Attendance {
  _id: string; // Yozuv ID
  employeeId: ObjectId; // Xodim ID
  timestamp: Date; // Kirish/chiqish vaqti
  type: AttendanceType; // 'in' yoki 'out'
  status: AttendanceStatus; // Status (normal, late, early, overtime)
  location: {
    // GPS koordinatalari
    latitude: number;
    longitude: number;
    address?: string; // Manzil (ixtiyoriy)
    accuracy?: number; // GPS aniqligi
  };
  device?: string; // Qurilma ma'lumoti
  notes?: string; // Izohlar
  hasWarning: boolean; // Warning bormi
  warningReason?: string; // Warning sababi
  warningTimestamp?: Date; // Warning vaqti
  isDeleted: boolean; // O'chirilganmi (soft delete)
  createdAt: Date; // Yaratilgan vaqt
  updatedAt: Date; // Yangilangan vaqt
}
```

---

## 🎯 Backend API Endpointlari

### 1. Kirish/Chiqish Operatsiyalari

#### POST `/attendance/check-in-out`

**Backend Logic:**

- Xodimning bugungi barcha attendance recordlarini tekshiradi
- Agar birinchi marta bo'lsa = Kirish (IN)
- Agar ikkinchi marta bo'lsa = Chiqish (OUT)
- Agar uchinchi marta bo'lsa = Yana Kirish (IN)
- Va hokazo...

**Status Avtomatik Aniqlanadi:**

- 9:00 dan oldin kirish = NORMAL
- 9:00 dan keyin kirish = LATE
- 18:00 dan oldin chiqish = EARLY
- 18:00 dan keyin chiqish = OVERTIME

**Frontend uchun Request:**

```typescript
{
  employeeId: "507f1f77bcf86cd799439011",
  location: {
    latitude: 41.3111,
    longitude: 69.2797,
    address: "Toshkent sh., Yunusobod tumani"
  },
  device: "iPhone 15",
  notes: "Ofisga kirish"
}
```

**Backend Response:**

```typescript
{
  id: "attendance_id",
  employeeId: "507f1f77bcf86cd799439011",
  employeeName: "Sarvarbek Xazratov",
  timestamp: "2025-01-15T09:15:00.000Z",
  type: "in",
  status: "late",
  location: { latitude: 41.3111, longitude: 69.2797 },
  device: "iPhone 15",
  notes: "Ofisga kirish",
  hasWarning: false
}
```

#### POST `/attendance/public/check-in-out`

**Backend Logic:** Xuddi yuqoridagi bilan bir xil, lekin JWT token talab qilmaydi
**Ishlatish:** Mobile app yoki boshqa tizimlardan kirish-chiqish qayd qilish

---

### 2. Davomat Ma'lumotlari

#### GET `/attendance/today/:employeeId`

**Backend Logic:**

- Xodimning bugungi barcha attendance recordlarini olish
- Kirish va chiqishlar sonini hisoblash
- Jami ish vaqtini hisoblash (kirish va chiqish orasidagi vaqt)
- Hozirgi holatni aniqlash (ishda yoki chiqib ketgan)

**Backend Response:**

```typescript
{
  employeeId: "507f1f77bcf86cd799439011",
  today: "2025-01-15",
  checkIns: 2,           // Bugungi kirishlar soni
  checkOuts: 1,          // Bugungi chiqishlar soni
  totalWorkHours: 7.5,   // Jami ish vaqti (soat)
  status: "Currently at work", // Hozirgi holat
  attendances: [
    {
      id: "att1",
      timestamp: "2025-01-15T09:15:00.000Z",
      type: "in",
      status: "late",
      location: { latitude: 41.3111, longitude: 69.2797 },
      device: "iPhone 15"
    },
    {
      id: "att2",
      timestamp: "2025-01-15T12:00:00.000Z",
      type: "out",
      status: "normal",
      location: { latitude: 41.3111, longitude: 69.2797 }
    },
    {
      id: "att3",
      timestamp: "2025-01-15T13:00:00.000Z",
      type: "in",
      status: "normal",
      location: { latitude: 41.3111, longitude: 69.2797 }
    }
  ]
}
```

#### GET `/attendance`

**Backend Logic:**

- Filter va pagination bilan attendance ro'yxatini olish
- Xodim ID, sana oralig'i, tur (in/out) bo'yicha filterlash
- Sahifa bo'yicha bo'lish (default: 20 ta yozuv)

**Frontend uchun Query Parameters:**

```typescript
{
  employeeId: "507f1f77bcf86cd799439011",  // Xodim ID
  fromDate: "2025-01-01",                  // Boshlang'ich sana
  toDate: "2025-01-31",                    // Tugash sana
  type: "in",                              // Turi (in/out)
  page: 1,                                 // Sahifa raqami
  limit: 20                                // Sahifa hajmi
}
```

**Backend Response:**

```typescript
{
  attendances: [
    {
      _id: "att1",
      employeeId: { _id: "emp1", fullName: "Sarvarbek Xazratov" },
      timestamp: "2025-01-15T09:15:00.000Z",
      type: "in",
      status: "late",
      location: { latitude: 41.3111, longitude: 69.2797 },
      device: "iPhone 15"
    }
    // ... boshqa yozuvlar
  ],
  pagination: {
    page: 1,
    limit: 20,
    total: 150,    // Jami yozuvlar soni
    pages: 8       // Jami sahifalar soni
  }
}
```

---

### 3. Statistika va Hisobotlar

#### GET `/attendance/statistics/:employeeId`

**Backend Logic:**

- Xodimning belgilangan vaqt oralig'idagi barcha attendance recordlarini olish
- Jami kirish/chiqishlar sonini hisoblash
- Jami va o'rtacha ish vaqtini hisoblash
- Kechikish, erta chiqish, overtime va warning statistikasini hisoblash

**Frontend uchun Query Parameters:**

```typescript
{
  fromDate: "2025-01-01",  // Boshlang'ich sana (ixtiyoriy)
  toDate: "2025-01-31"     // Tugash sana (ixtiyoriy)
}
```

**Backend Response:**

```typescript
{
  totalCheckIns: 45,        // Jami kirishlar
  totalCheckOuts: 44,       // Jami chiqishlar
  totalWorkHours: 180.5,    // Jami ish vaqti (soat)
  averageWorkHours: 8.2,    // O'rtacha ish vaqti (soat)
  lateCount: 5,             // Kechikishlar soni
  earlyCount: 3,            // Erta chiqishlar soni
  overtimeCount: 8,         // Overtime soni
  warningCount: 2           // Warninglar soni
}
```

---

#### GET `/attendance/reports/daily`

**Backend Logic:** (Hali implementatsiya qilinmagan)

- Bugungi barcha xodimlarning attendance ma'lumoti
- ADMIN va HR rollari uchun

**Frontend uchun Query Parameters:**

```typescript
{
  date: '2025-01-15'; // Sana (ixtiyoriy), default: bugun
}
```

#### GET `/attendance/reports/weekly`

**Backend Logic:** (Hali implementatsiya qilinmagan)

- O'tgan hafta attendance statistikasi
- ADMIN va HR rollari uchun

**Frontend uchun Query Parameters:**

```typescript
{
  weekStart: '2025-01-13'; // Hafta boshlanishi (ixtiyoriy)
}
```

#### GET `/attendance/reports/monthly`

**Backend Logic:** (Hali implementatsiya qilinmagan)

- O'tgan oy attendance statistikasi
- ADMIN va HR rollari uchun

**Frontend uchun Query Parameters:**

```typescript
{
  year: "2025",   // Yil (ixtiyoriy)
  month: "1"      // Oy 1-12 (ixtiyoriy)
}
```

#### GET `/attendance/reports/yearly`

**Backend Logic:** (Hali implementatsiya qilinmagan)

- O'tgan yil attendance statistikasi
- ADMIN va HR rollari uchun

**Frontend uchun Query Parameters:**

```typescript
{
  year: '2025'; // Yil (ixtiyoriy)
}
```

---

### 4. Warning Boshqaruvi

#### GET `/attendance/warnings`

**Backend Logic:** (Hali implementatsiya qilinmagan)

- Barcha warninglar ro'yxatini olish
- ADMIN va HR rollari uchun

**Frontend uchun Query Parameters:**

```typescript
{
  employeeId: "507f1f77bcf86cd799439011",  // Xodim ID (ixtiyoriy)
  date: "2025-01-15",                      // Sana (ixtiyoriy)
  page: 1,                                 // Sahifa raqami (ixtiyoriy)
  limit: 20                                // Sahifa hajmi (ixtiyoriy)
}
```

#### GET `/attendance/warnings/clear/:attendanceId`

**Backend Logic:** (Hali implementatsiya qilinmagan)

- Attendance recorddan warningni olib tashlash
- ADMIN va HR rollari uchun

**Frontend uchun Parameters:**

```typescript
{
  attendanceId: 'attendance_id'; // Attendance ID
}
```

---

## 🔄 Backend Avtomatik Vazifalar (Cron Jobs)

### AttendanceCronService - Avtomatik Jarayonlar

#### 1. Har kuni 18:00 - Warning Tekshirish ✅ (Ishlaydi)

**Backend Logic:**

- Har kuni 18:00 da avtomatik ishga tushadi
- Barcha xodimlarning bugungi attendance recordlarini tekshiradi
- Agar xodimning oxirgi record IN bo'lsa va 18:00 dan keyin bo'lsa, warning qo'yadi
- Warning sababi: "18:00 dan keyin ishda qolgan"

**Frontend uchun:** Bu jarayon avtomatik, frontend da ko'rsatish uchun warninglar ro'yxatini olish kerak

#### 2. Har kuni 00:01 - Warning Tozalash ⏳ (Hali implementatsiya qilinmagan)

**Backend Logic:** (Hali implementatsiya qilinmagan)

- Kechagi warninglarni tozalash

#### 3. Har hafta dushanba 09:00 - Haftalik Statistika ⏳ (Hali implementatsiya qilinmagan)

**Backend Logic:** (Hali implementatsiya qilinmagan)

- O'tgan hafta statistikasini hisoblash

#### 4. Har oy 1-kuni 09:00 - Oylik Statistika ⏳ (Hali implementatsiya qilinmagan)

**Backend Logic:** (Hali implementatsiya qilinmagan)

- O'tgan oy statistikasini hisoblash

#### 5. Har yil 1-yanvar 09:00 - Yillik Statistika ⏳ (Hali implementatsiya qilinmagan)

**Backend Logic:** (Hali implementatsiya qilinmagan)

- O'tgan yil statistikasini hisoblash

---

## 🎨 Frontend UI/UX Tavsiyalari

### 1. Asosiy Dashboard - Boshliqlar uchun

**Backend dan olinadigan ma'lumotlar:**

- Bugungi jami xodimlar soni
- Bugungi kirish/chiqish statistikasi
- Warninglar soni
- Kechikishlar soni

**Frontend UI tavsiyasi:**

```
┌─────────────────────────────────────────────────────────┐
│  📊 Bugungi Davomat Dashboard                          │
├─────────────────────────────────────────────────────────┤
│  👥 Jami Xodimlar: 150    ✅ Kirish: 120    ❌ Chiqish: 110 │
│  ⚠️  Warninglar: 5        🕐 Kechikishlar: 8              │
│  📈 Bugungi ish vaqti: 1,200 soat                        │
└─────────────────────────────────────────────────────────┘
```

### 2. Xodim Dashboard - Xodimlar uchun

**Backend dan olinadigan ma'lumotlar:**

- Bugungi attendance ma'lumoti
- Hozirgi holat (ishda/chiqib ketgan)
- Jami ish vaqti

**Frontend UI tavsiyasi:**

```
┌─────────────────────────────────────────────────────────┐
│  👤 Mening Davomatim                                    │
├─────────────────────────────────────────────────────────┤
│  📅 Bugun: 2025-01-15                                   │
│  🕘 Kirish: 09:15 (Kechikish)                          │
│  🕕 Chiqish: 18:30 (Overtime)                          │
│  ⏱️  Jami ish vaqti: 8.25 soat                          │
│  📍 Hozirgi holat: Ishda                               │
│                                                         │
│  [🔴 CHIQISH] (Agar ishda bo'lsa)                      │
│  [🟢 KIRISH] (Agar chiqib ketgan bo'lsa)               │
└─────────────────────────────────────────────────────────┘
```

### 3. Attendance Tarixi - Barcha uchun

**Backend dan olinadigan ma'lumotlar:**

- Filter va pagination bilan attendance ro'yxati
- Har bir yozuv uchun: vaqt, tur, status, manzil

**Frontend UI tavsiyasi:**

```
┌─────────────────────────────────────────────────────────┐
│  📋 Davomat Tarixi                                      │
├─────────────────────────────────────────────────────────┤
│  🔍 Filter: [Sana] [Xodim] [Tur] [Tozalash]            │
├─────────────────────────────────────────────────────────┤
│  📅 15.01.2025 09:15  🟢 Kirish   ⚠️ Kechikish         │
│  📍 Toshkent sh., Yunusobod tumani                     │
│  ────────────────────────────────────────────────────── │
│  📅 15.01.2025 18:30  🔴 Chiqish  ⏰ Overtime          │
│  📍 Toshkent sh., Yunusobod tumani                     │
│  ────────────────────────────────────────────────────── │
│  📅 14.01.2025 08:45  🟢 Kirish   ✅ Normal            │
│  📍 Toshkent sh., Yunusobod tumani                     │
├─────────────────────────────────────────────────────────┤
│  [◀️ Oldingi] 1/8 [Keyingi ▶️]                         │
└─────────────────────────────────────────────────────────┘
```

### 4. Statistika - Boshliqlar uchun

**Backend dan olinadigan ma'lumotlar:**

- Xodim statistikasi (kirish/chiqish, ish vaqti, kechikishlar)

**Frontend UI tavsiyasi:**

```
┌─────────────────────────────────────────────────────────┐
│  📊 Xodim Statistikasi                                 │
├─────────────────────────────────────────────────────────┤
│  👤 Sarvarbek Xazratov                                 │
│  📅 2025-yil yanvar                                    │
│                                                         │
│  📈 Jami kirishlar: 22                                 │
│  📉 Jami chiqishlar: 21                                │
│  ⏱️  Jami ish vaqti: 168 soat                          │
│  📊 O'rtacha ish vaqti: 8.0 soat                       │
│                                                         │
│  ⚠️  Kechikishlar: 3                                   │
│  🕐 Erta chiqishlar: 1                                 │
│  ⏰ Overtime: 5                                         │
│  🚨 Warninglar: 0                                       │
└─────────────────────────────────────────────────────────┘
```

### 5. Warning Boshqaruvi - ADMIN/HR uchun

**Backend dan olinadigan ma'lumotlar:**

- Barcha warninglar ro'yxati
- Warning tozalash imkoniyati

**Frontend UI tavsiyasi:**

```
┌─────────────────────────────────────────────────────────┐
│  ⚠️ Warning Boshqaruvi                                 │
├─────────────────────────────────────────────────────────┤
│  🔍 Filter: [Xodim] [Sana] [Tozalash]                  │
├─────────────────────────────────────────────────────────┤
│  👤 Sarvarbek Xazratov                                 │
│  📅 15.01.2025 18:30                                   │
│  🚨 Sabab: 18:00 dan keyin ishda qolgan                │
│  [✅ Tozalash]                                          │
│  ────────────────────────────────────────────────────── │
│  👤 Alisher Karimov                                     │
│  📅 14.01.2025 19:15                                   │
│  🚨 Sabab: 18:00 dan keyin ishda qolgan                │
│  [✅ Tozalash]                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 Backend Konfiguratsiya

### Environment Variables

```env
# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=24h

# MongoDB
MONGODB_URI=mongodb://localhost:27017/computer-logs

# Server
PORT=3000
```

### Work Time Settings

```typescript
// AttendanceService da
const workStartTime = new Date(today);
workStartTime.setHours(9, 0, 0, 0); // 9:00

const workEndTime = new Date(today);
workEndTime.setHours(18, 0, 0, 0); // 18:00
```

---

## ⚠️ Xatoliklar va Status Kodlari

### HTTP Status Kodlari

- `200` - Muvaffaqiyatli
- `201` - Yaratildi
- `400` - Noto'g'ri so'rov
- `401` - Autentifikatsiya talab qilinadi
- `403` - Ruxsat yo'q
- `404` - Topilmadi
- `500` - Server xatoligi

### Xatolik Response

```typescript
interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string;
}
```

---

## 📝 Qo'shimcha Eslatmalar

1. **GPS Koordinatalari:** Barcha check-in/out operatsiyalari GPS koordinatalarini talab qiladi
2. **Warning Tizimi:** 18:00 dan keyin chiqmagan xodimlarga avtomatik warning qo'yiladi
3. **Soft Delete:** Barcha attendance recordlar soft delete qilinadi
4. **Pagination:** Ro'yxatlar pagination bilan qaytariladi
5. **Role-based Access:** Ba'zi endpointlar faqat ADMIN/HR rollari uchun ochiq
6. **Cron Jobs:** Avtomatik vazifalar har kuni ishga tushadi

---

## 🚀 Keyingi Qadamlar

1. **Report Endpointlari:** Kunlik, haftalik, oylik va yillik hisobotlar implementatsiya qilish
2. **Warning Management:** Warning tozalash va boshqarish funksiyalari
3. **Notification System:** Real-time bildirishnomalar
4. **Mobile App:** React Native yoki Flutter mobile app
5. **Analytics Dashboard:** Batafsil analytics va grafiklar

---

Bu dokumentatsiya attendance tizimining barcha aspektlarini qamrab oladi. Backend logic va frontend UI tavsiyalari kiritilgan. Boshliqlar va dasturchilar uchun tushunarli qilib yozilgan.
