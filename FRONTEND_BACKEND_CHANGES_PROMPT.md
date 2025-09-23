# Frontend AI - Backend O'zgarishlar Prompt

## Backend da qo'shilgan yangi funksiyalar:

### 1. **Snapshot (Rasm) Funksiyasi Qo'shildi**

**Nima qo'shildi:**

- Har bir check-in/out da avtomatik ravishda kamera orqali rasm olinadi
- Python API orqali DVR dan snapshot olinadi
- Rasm ma'lumotlari attendance record ga saqlanadi

**API Response o'zgarishi:**

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

### 2. **Frontend da qo'shish kerak bo'lgan narsalar:**

#### A. **Attendance Response Interface yangilash:**

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

#### B. **Attendance Card/List da rasm ko'rsatish:**

```jsx
const AttendanceCard = ({ attendance }) => (
  <div className="attendance-card">
    <div className="attendance-info">
      <h3>{attendance.employeeName}</h3>
      <p>Type: {attendance.type === 'in' ? 'Kirish' : 'Chiqish'}</p>
      <p>Time: {new Date(attendance.timestamp).toLocaleString()}</p>
      <p>Finger: {attendance.fingerNumber}</p>
    </div>

    {/* 🆕 Rasm ko'rsatish */}
    {attendance.imageUrl && (
      <div className="attendance-image">
        <img
          src={attendance.imageUrl}
          alt={`${attendance.employeeName} - ${attendance.type}`}
          style={{ width: '100px', height: '75px', objectFit: 'cover' }}
        />
        <p className="image-filename">{attendance.image}</p>
      </div>
    )}
  </div>
);
```

#### C. **Attendance History da rasm qo'shish:**

```jsx
const AttendanceHistory = ({ attendances }) => (
  <div className="attendance-history">
    {attendances.map((attendance) => (
      <div key={attendance.id} className="attendance-record">
        <div className="record-info">
          <span className="employee-name">{attendance.employeeName}</span>
          <span className="time">
            {new Date(attendance.timestamp).toLocaleString()}
          </span>
          <span className={`type ${attendance.type}`}>
            {attendance.type === 'in' ? 'Kirish' : 'Chiqish'}
          </span>
        </div>

        {/* 🆕 Rasm qo'shish */}
        {attendance.imageUrl && (
          <div className="record-image">
            <img
              src={attendance.imageUrl}
              alt="Attendance snapshot"
              onClick={() => window.open(attendance.imageUrl, '_blank')}
              style={{
                width: '60px',
                height: '45px',
                cursor: 'pointer',
                borderRadius: '4px',
              }}
            />
          </div>
        )}
      </div>
    ))}
  </div>
);
```

#### D. **Modal yoki popup da katta rasm ko'rsatish:**

```jsx
const ImageModal = ({ isOpen, onClose, imageUrl, employeeName, type }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            {employeeName} - {type === 'in' ? 'Kirish' : 'Chiqish'}
          </h3>
          <button onClick={onClose} className="close-btn">
            &times;
          </button>
        </div>
        <div className="modal-body">
          <img
            src={imageUrl}
            alt="Attendance snapshot"
            style={{ maxWidth: '100%', maxHeight: '80vh' }}
          />
        </div>
      </div>
    </div>
  );
};
```

#### E. **CSS Styling:**

```css
.attendance-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  margin-bottom: 12px;
}

.attendance-image {
  text-align: center;
}

.attendance-image img {
  border-radius: 4px;
  border: 2px solid #e0e0e0;
  transition: transform 0.2s;
}

.attendance-image img:hover {
  transform: scale(1.05);
  cursor: pointer;
}

.image-filename {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.record-image img {
  border: 1px solid #ccc;
  transition: opacity 0.2s;
}

.record-image img:hover {
  opacity: 0.8;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  max-width: 90vw;
  max-height: 90vh;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #eee;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
}
```

### 3. **API Endpoint o'zgarishlari:**

**Hech qanday o'zgarish yo'q!**

- Endpoint: `POST /schedule/attendance/checkinout`
- Request format bir xil
- Faqat response ga `image` va `imageUrl` fieldlar qo'shildi

### 4. **Xususiyatlar:**

- ✅ **Avtomatik rasm olish** - Har bir check-in/out da
- ✅ **Optional** - Agar rasm olinmasa, fieldlar bo'sh bo'ladi
- ✅ **Click to enlarge** - Rasmni bosib katta ko'rish mumkin
- ✅ **Download** - Rasmni yuklab olish mumkin
- ✅ **Responsive** - Barcha qurilmalarda ishlaydi

### 5. **Test qilish:**

```bash
# Test request
curl -X POST http://localhost:3000/schedule/attendance/checkinout \
  -H "Content-Type: application/json" \
  -d '{
    "fingerNumber": "12345",
    "location": "Bosh Ofis",
    "device": "Fingerprint Scanner"
  }'

# Response da image va imageUrl bo'lishi kerak
```

### 6. **Muhim eslatmalar:**

- Rasm faqat **check-in/out** da olinadi
- Rasm **Python API** orqali olinadi
- Agar Python API ishlamasa, attendance yaratiladi lekin rasm yo'q
- Rasm URL `http://localhost:8000` da joylashgan
- Rasm fayllar `.jpg` formatida

---

**Frontend AI vazifasi:** Yuqoridagi kodlarni frontend da implement qilish va rasm ko'rsatish funksiyasini qo'shish! 🚀



