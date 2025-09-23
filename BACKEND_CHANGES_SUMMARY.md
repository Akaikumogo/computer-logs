# Backend O'zgarishlar - Frontend AI uchun

## 🆕 Backend da qo'shilgan yangi funksiyalar:

### 1. **Snapshot (Rasm) Funksiyasi Qo'shildi**

**Nima qo'shildi:**

- Har bir check-in/out da avtomatik ravishda kamera orqali rasm olinadi
- Python API orqali DVR dan snapshot olinadi
- Rasm ma'lumotlari attendance record ga saqlanadi

### 2. **API Response o'zgarishi:**

**Eski response:**

```json
{
  "id": "attendance_id",
  "employeeName": "Sarvarbek Xazratov",
  "type": "in",
  "status": "normal",
  "timestamp": "2025-01-10T15:30:00.000Z",
  "location": { "latitude": 41.3111, "longitude": 69.2797 },
  "device": "Fingerprint Scanner",
  "notes": "Barmoq orqali kirish",
  "fingerNumber": "12345"
}
```

**Yangi response (qo'shilgan fieldlar):**

```json
{
  "id": "attendance_id",
  "employeeName": "Sarvarbek Xazratov",
  "type": "in",
  "status": "normal",
  "timestamp": "2025-01-10T15:30:00.000Z",
  "location": { "latitude": 41.3111, "longitude": 69.2797 },
  "device": "Fingerprint Scanner",
  "notes": "Barmoq orqali kirish",
  "fingerNumber": "12345",

  // 🆕 YANGI FIELDS:
  "image": "snapshot_ch109_20250912_163210.jpg",
  "imageUrl": "http://localhost:8000/downloads/snapshot_ch109_20250912_163210.jpg"
}
```

### 3. **Frontend da qo'shish kerak:**

#### A. **TypeScript Interface yangilash:**

```typescript
interface AttendanceResponse {
  id: string;
  employeeName: string;
  type: 'in' | 'out';
  status: string;
  timestamp: string;
  location: LocationData;
  device?: string;
  notes?: string;
  fingerNumber: string;

  // 🆕 YANGI FIELDS:
  image?: string; // Rasm fayl nomi
  imageUrl?: string; // Rasm to'liq URL
}
```

#### B. **Rasm ko'rsatish (ixtiyoriy):**

```jsx
// Attendance card da rasm ko'rsatish
{
  attendance.imageUrl && (
    <img
      src={attendance.imageUrl}
      alt={`${attendance.employeeName} - ${attendance.type}`}
      style={{ width: '100px', height: '75px' }}
    />
  );
}
```

### 4. **API Endpoint o'zgarishlari:**

**Hech qanday o'zgarish yo'q!**

- Endpoint: `POST /schedule/attendance/checkinout`
- Request format bir xil
- Faqat response ga 2 ta field qo'shildi

### 5. **GET Endpoint larda ham rasm fieldlari:**

**Barcha attendance GET endpoint larda rasm fieldlari qo'shildi:**

```json
// GET /schedule/attendance - Barcha attendance lar
// GET /schedule/attendance/employee/:id - Xodimning attendance lari
// GET /schedule/attendance/today - Bugungi attendance lar
// GET /schedule/attendance/range - Vaqt oralig'idagi attendance lar

{
  "data": [
    {
      "id": "attendance_id",
      "employeeName": "Sarvarbek Xazratov",
      "type": "in",
      "status": "normal",
      "timestamp": "2025-01-10T15:30:00.000Z",
      "location": { "latitude": 41.3111, "longitude": 69.2797 },
      "device": "Fingerprint Scanner",
      "notes": "Barmoq orqali kirish",
      "fingerNumber": "12345",

      // 🆕 YANGI FIELDS (barcha GET endpoint larda):
      "image": "snapshot_ch109_20250912_163210.jpg",
      "imageUrl": "http://localhost:8000/downloads/snapshot_ch109_20250912_163210.jpg"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

### 6. **Xususiyatlar:**

- ✅ **Avtomatik rasm olish** - Har bir check-in/out da
- ✅ **Optional** - Agar rasm olinmasa, fieldlar bo'sh bo'ladi
- ✅ **Python API** - `http://localhost:8000` da ishlaydi
- ✅ **JPG format** - Rasm fayllar `.jpg` formatida

### 7. **Test qilish:**

```bash
curl -X POST http://localhost:3000/schedule/attendance/checkinout \
  -H "Content-Type: application/json" \
  -d '{
    "fingerNumber": "12345",
    "location": "Bosh Ofis",
    "device": "Fingerprint Scanner"
  }'
```

**Natija:** Response da `image` va `imageUrl` fieldlar bo'lishi kerak.

---

**Frontend AI vazifasi:** Faqat `image` va `imageUrl` fieldlarini frontend da handle qilish! 🚀
