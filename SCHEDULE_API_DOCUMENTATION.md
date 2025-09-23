# Schedule API Documentation

## Overview

Bu MES KPI tizimi uchun to'liq Schedule (Jadval) moduli API'si. Frontend React/TypeScript bilan yozilgan va attendance (davomat) ma'lumotlarini boshqarish uchun backend API.

## API Base URL

```
Development: http://localhost:1849/api
Production: https://your-domain.com/api
```

## Authentication

Barcha endpointlar JWT token authentication talab qiladi:

```http
Authorization: Bearer <your-jwt-token>
```

## API Endpoints

### 1. Attendance Management

#### Check In/Out Operations

##### POST /api/attendance/checkin

Xodimning kirishini qayd qilish

**Request Body:**

```json
{
  "employeeId": "507f1f77bcf86cd799439011",
  "location": {
    "latitude": 41.3111,
    "longitude": 69.2797,
    "address": "Toshkent shahar, Chilonzor tumani"
  },
  "device": "iPhone 15",
  "notes": "Ishga keldim"
}
```

**Response:**

```json
{
  "id": "507f1f77bcf86cd799439012",
  "employeeId": "507f1f77bcf86cd799439011",
  "employeeName": "Ali Valiyev",
  "timestamp": "2025-01-15T08:30:00.000Z",
  "type": "in",
  "status": "normal",
  "location": {
    "latitude": 41.3111,
    "longitude": 69.2797,
    "address": "Toshkent shahar, Chilonzor tumani"
  },
  "device": "iPhone 15",
  "notes": "Ishga keldim",
  "hasWarning": false
}
```

##### POST /api/attendance/checkout

Xodimning chiqishini qayd qilish

**Request Body:**

```json
{
  "employeeId": "507f1f77bcf86cd799439011",
  "location": {
    "latitude": 41.3111,
    "longitude": 69.2797,
    "address": "Toshkent shahar, Chilonzor tumani"
  },
  "device": "iPhone 15",
  "notes": "Ishdan chiqdim"
}
```

##### POST /api/attendance/check-in-out

Umumiy kirish/chiqish endpoint (mavjud)

#### Attendance Records

##### GET /api/attendance/today/:employeeId

Xodimning bugungi attendance ma'lumoti

**Response:**

```json
{
  "id": "507f1f77bcf86cd799439011",
  "employeeId": "507f1f77bcf86cd799439011",
  "date": "2025-01-15",
  "checkInTime": "08:30",
  "checkOutTime": "17:30",
  "status": "present",
  "totalHours": 8.5,
  "totalWorkHours": 8.0,
  "isCheckedIn": true,
  "isCheckedOut": true,
  "checkIns": 1,
  "checkOuts": 1
}
```

##### GET /api/attendance/employee/:employeeId

Xodimning attendance tarixi

**Query Parameters:**

- `startDate` (optional): Boshlang'ich sana (YYYY-MM-DD)
- `endDate` (optional): Tugash sana (YYYY-MM-DD)
- `status` (optional): Status filter
- `limit` (optional): Natijalar soni

**Response:**

```json
{
  "employeeId": "507f1f77bcf86cd799439011",
  "name": "Ali Valiyev",
  "department": "IT",
  "position": "Developer",
  "attendance": [
    {
      "id": "507f1f77bcf86cd799439012",
      "date": "2025-01-15",
      "checkInTime": "08:30",
      "checkOutTime": "17:30",
      "status": "present",
      "type": "in",
      "timestamp": "2025-01-15T08:30:00.000Z",
      "location": {
        "latitude": 41.3111,
        "longitude": 69.2797,
        "address": "Toshkent shahar, Chilonzor tumani"
      },
      "device": "iPhone 15",
      "notes": "Ishga keldim",
      "hasWarning": false,
      "createdAt": "2025-01-15T08:30:00.000Z",
      "updatedAt": "2025-01-15T08:30:00.000Z"
    }
  ]
}
```

### 2. Schedule Views

#### GET /api/schedule/daily/:date

Kunlik jadval

**Path Parameter:**

- `date`: Sana (YYYY-MM-DD formatida)

**Response:**

```json
{
  "date": "2025-01-15",
  "employees": [
    {
      "employeeId": "507f1f77bcf86cd799439011",
      "name": "Ali Valiyev",
      "logs": [
        {
          "type": "in",
          "hour": 8,
          "timestamp": "2025-01-15T08:30:00.000Z"
        },
        {
          "type": "out",
          "hour": 12,
          "timestamp": "2025-01-15T12:00:00.000Z"
        },
        {
          "type": "in",
          "hour": 13,
          "timestamp": "2025-01-15T13:00:00.000Z"
        },
        {
          "type": "out",
          "hour": 17,
          "timestamp": "2025-01-15T17:30:00.000Z"
        }
      ]
    }
  ]
}
```

#### GET /api/schedule/monthly/:year/:month

Oylik jadval

**Path Parameters:**

- `year`: Yil (masalan: 2025)
- `month`: Oy (1-12)

**Response:**

```json
{
  "year": 2025,
  "month": 1,
  "dailyData": [
    {
      "date": "2025-01-01",
      "totalEmployees": 50,
      "present": 45,
      "late": 3,
      "absent": 2,
      "attendanceRate": 90
    }
  ]
}
```

#### GET /api/schedule/yearly/:year

Yillik jadval

**Path Parameter:**

- `year`: Yil (masalan: 2025)

**Response:**

```json
{
  "year": 2025,
  "monthlyData": [
    {
      "month": 1,
      "monthName": "Yanvar",
      "totalEmployees": 50,
      "present": 45,
      "late": 3,
      "absent": 2,
      "attendanceRate": 90
    }
  ]
}
```

### 3. Dashboard & Statistics

#### GET /api/dashboard/stats

Dashboard statistikasi

**Response:**

```json
{
  "totalEmployees": 50,
  "presentToday": 45,
  "lateToday": 3,
  "absentToday": 2,
  "averageCheckInTime": "08:25",
  "attendanceRate": 90,
  "todayCheckIns": 45,
  "todayCheckOuts": 30,
  "warningsCount": 2,
  "lateCount": 3,
  "totalWorkHours": 360
}
```

#### GET /api/dashboard/summary

Attendance xulosa

**Query Parameters:**

- `date` (optional): Sana (YYYY-MM-DD)

**Response:**

```json
{
  "date": "2025-01-15",
  "totalEmployees": 50,
  "present": 45,
  "late": 3,
  "absent": 2,
  "attendanceRate": 90
}
```

### 4. Export Functionality

#### GET /api/dashboard/export/excel

Excel formatida export

**Query Parameters:**

- `startDate` (optional): Boshlang'ich sana
- `endDate` (optional): Tugash sana
- `employeeId` (optional): Xodim ID
- `status` (optional): Status filter

**Response:** Excel fayl yoki JSON formatida ma'lumotlar

#### GET /api/dashboard/export/pdf

PDF formatida export

**Query Parameters:** Xuddi Excel export kabi

**Response:** PDF fayl yoki JSON formatida ma'lumotlar

### 5. Employee Management

#### GET /api/attendance/employees

Xodimlar ro'yxati

**Query Parameters:**

- `department` (optional): Bo'lim filter
- `position` (optional): Lavozim filter

**Response:**

```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "fullName": "Ali Valiyev",
    "position": "Developer",
    "department": "IT",
    "tabRaqami": "EMP001",
    "email": "ali.valiyev@company.com",
    "phones": ["+998901234567"],
    "hireDate": "2024-01-15T00:00:00.000Z",
    "status": "active"
  }
]
```

#### GET /api/attendance/employees/:id

Xodim ma'lumoti

**Response:**

```json
{
  "id": "507f1f77bcf86cd799439011",
  "fullName": "Ali Valiyev",
  "position": "Developer",
  "department": "IT",
  "tabRaqami": "EMP001",
  "email": "ali.valiyev@company.com",
  "phones": ["+998901234567"],
  "hireDate": "2024-01-15T00:00:00.000Z",
  "birthDate": "1990-05-15T00:00:00.000Z",
  "passportId": "AA1234567",
  "address": "Toshkent shahar, Chilonzor tumani",
  "salary": 5000000,
  "status": "active",
  "files": [],
  "primaryWorkplaceId": null,
  "userId": "507f1f77bcf86cd799439013",
  "username": "ali.valiyev",
  "createdAt": "2024-01-15T08:00:00.000Z",
  "updatedAt": "2024-01-15T08:00:00.000Z"
}
```

#### GET /api/attendance/employees/:id/attendance

Xodimning attendance tarixi

**Query Parameters:**

- `startDate` (optional): Boshlang'ich sana
- `endDate` (optional): Tugash sana

**Response:**

```json
{
  "employee": {
    "id": "507f1f77bcf86cd799439011",
    "fullName": "Ali Valiyev",
    "position": "Developer",
    "department": "IT",
    "tabRaqami": "EMP001"
  },
  "attendance": [
    {
      "id": "507f1f77bcf86cd799439012",
      "date": "2025-01-15",
      "time": "08:30",
      "type": "in",
      "status": "normal",
      "location": {
        "latitude": 41.3111,
        "longitude": 69.2797,
        "address": "Toshkent shahar, Chilonzor tumani"
      },
      "device": "iPhone 15",
      "notes": "Ishga keldim",
      "hasWarning": false,
      "createdAt": "2025-01-15T08:30:00.000Z",
      "updatedAt": "2025-01-15T08:30:00.000Z"
    }
  ],
  "totalRecords": 1
}
```

## Business Logic

### 1. Check In/Out Logic

- **Check-in**: 8:00 dan oldin = normal, 8:00 dan keyin = late
- **Check-out**: 17:00 dan oldin = early, 17:00 dan keyin = normal
- Bir kunda bir nechta check-in/out bo'lishi mumkin
- Har bir check-in uchun check-out bo'lishi shart emas

### 2. Status Calculation

- **Present**: Hech bo'lmaganda bir marta check-in qilgan
- **Late**: 8:00 dan keyin check-in qilgan
- **Absent**: Hech qachon check-in qilmagan
- **Half-day**: Faqat check-in qilgan, check-out qilmagan

### 3. Time Tracking

- Har bir check-in/check-out juftligi uchun ish vaqtini hisoblash
- Kunlik umumiy ish vaqtini hisoblash
- Oylik va yillik statistikalar

### 4. Location Tracking

- GPS koordinatalarini saqlash
- Manzilni avtomatik aniqlash (reverse geocoding)
- Chetlab o'tishni aniqlash (radius check)

## Error Handling

### HTTP Status Codes

- `200 OK`: Muvaffaqiyatli so'rov
- `201 Created`: Yangi resurs yaratildi
- `400 Bad Request`: Noto'g'ri so'rov
- `401 Unauthorized`: Authentication talab qilinadi
- `403 Forbidden`: Ruxsat yo'q
- `404 Not Found`: Resurs topilmadi
- `500 Internal Server Error`: Server xatosi

### Error Response Format

```json
{
  "statusCode": 400,
  "message": "Xodim topilmadi",
  "error": "Bad Request"
}
```

## Security

### Authentication

- JWT token authentication
- Bearer token formatida header

### Authorization

- Role-based access control (Admin, HR, Employee)
- Admin va HR: Barcha endpointlarga ruxsat
- Employee: Faqat o'z ma'lumotlariga ruxsat

### Input Validation

- Barcha input ma'lumotlari validatsiya qilinadi
- XSS va SQL injection himoyasi
- Rate limiting

## Performance Considerations

### Database Indexing

- `employeeId` va `timestamp` uchun indexlar
- `status` va `type` uchun indexlar
- `location` koordinatalari uchun geospatial index

### Caching

- Dashboard statistikasi uchun cache
- Xodimlar ro'yxati uchun cache
- Redis cache server

### Pagination

- Katta ma'lumotlar uchun pagination
- Default limit: 20, max limit: 100

## Testing

### Unit Tests

- Service metodlari uchun unit testlar
- Business logic testlari
- Validation testlari

### Integration Tests

- API endpointlari uchun integration testlar
- Database operatsiyalari testlari
- Authentication testlari

### Performance Tests

- Katta ma'lumotlar bilan testlar
- Concurrent request testlari
- Database performance testlari

## Deployment

### Environment Variables

```env
DATABASE_URI=mongodb://localhost:27017/computer-logs
JWT_SECRET=your-jwt-secret
PORT=1849
NODE_ENV=development
```

### Docker Support

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 1849
CMD ["npm", "run", "start:prod"]
```

### Health Check

```http
GET /health
```

## Frontend Integration

### API Client Example (TypeScript)

```typescript
class AttendanceAPI {
  private baseURL = 'http://localhost:1849/api';
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  async checkIn(data: CheckInDto) {
    const response = await fetch(`${this.baseURL}/attendance/checkin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async getTodayAttendance(employeeId: string) {
    const response = await fetch(
      `${this.baseURL}/attendance/today/${employeeId}`,
      {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      },
    );
    return response.json();
  }

  async getDashboardStats() {
    const response = await fetch(`${this.baseURL}/dashboard/stats`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });
    return response.json();
  }
}
```

### React Hook Example

```typescript
import { useState, useEffect } from 'react';

export const useAttendance = (employeeId: string) => {
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const response = await attendanceAPI.getTodayAttendance(employeeId);
        setAttendance(response);
      } catch (error) {
        console.error('Error fetching attendance:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [employeeId]);

  return { attendance, loading };
};
```

## Support

Agar savollar yoki muammolar bo'lsa, iltimos quyidagi manbalarga murojaat qiling:

- **Documentation**: Bu fayl
- **API Testing**: Swagger UI - `http://localhost:1849/api-docs`
- **Issues**: GitHub Issues
- **Contact**: Development team

---

**Last Updated**: 2025-01-15
**Version**: 1.0.0
**Author**: MES KPI Development Team
