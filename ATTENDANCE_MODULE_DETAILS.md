# ⏰ Attendance Module - Batafsil Ma'lumot

## 📋 Modul haqida umumiy ma'lumot

Attendance moduli xodimlarning davomatini nazorat qilish, check-in/check-out jarayonini boshqarish va attendance statistikalarini yaratish uchun yaratilgan. Geolocation tracking va warning tizimi bilan jihozlangan.

## 🏗️ Modul strukturasi

```
src/attendance/
├── attendance.module.ts         # Asosiy modul
├── attendance.controller.ts     # API endpointlari
├── attendance.service.ts        # Business logic
└── attendance-cron.service.ts   # Avtomatik vazifalar
```

## 🔧 Asosiy funksionallik

### 1. Check-in/Check-out
- Xodimning kirish va chiqishini qayd qilish
- Geolocation tracking
- Device information
- Automatic status detection

### 2. Attendance Monitoring
- Real-time attendance tracking
- Daily attendance records
- Monthly reports
- Statistics generation

### 3. Warning System
- Late arrival warnings
- Early departure warnings
- Absence notifications
- Compliance monitoring

### 4. Cron Jobs
- Daily attendance processing
- Weekly report generation
- Monthly statistics calculation
- Automatic cleanup

## 🚀 API Endpoints

### Check-in/Check-out
```typescript
POST   /attendance/check-in-out     # Kirish yoki chiqish
```

### Attendance Records
```typescript
GET    /attendance/today/:employeeId # Bugungi davomat
GET    /attendance                   # Attendance ro'yxati
GET    /attendance/:id               # Bitta attendance record
```

### Statistics va Reports
```typescript
GET    /attendance/statistics/:employeeId # Xodim statistikasi
GET    /attendance/reports/daily          # Kunlik hisobot
GET    /attendance/reports/weekly         # Haftalik hisobot
GET    /attendance/reports/monthly        # Oylik hisobot
```

### Admin Operations
```typescript
PATCH  /attendance/:id              # Attendance record yangilash
DELETE /attendance/:id               # Attendance record o'chirish
POST   /attendance/bulk-import      # Mass import
```

## 📊 Ma'lumotlar sxemasi

### Attendance Schema
```typescript
export class Attendance {
  _id: ObjectId;
  employeeId: ObjectId;             // Xodim ID
  timestamp: Date;                   // Vaqt
  type: AttendanceType;              // IN yoki OUT
  status: AttendanceStatus;          // NORMAL, LATE, EARLY, OVERTIME, WARNING
  
  // Geolocation
  location: {
    latitude: number;                // Kenglik
    longitude: number;               # Uzunlik
    address?: string;                # Manzil
    accuracy?: number;               # Aniqlik
  };
  
  device?: string;                   # Device ma'lumotlari
  notes?: string;                    # Izohlar
  
  // Warning system
  hasWarning: boolean;               # Warning bormi
  warningReason?: string;            # Warning sababi
  warningTimestamp?: Date;           # Warning vaqti
  
  // Soft delete
  isDeleted: boolean;
  deletedAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}
```

### Enums
```typescript
export enum AttendanceType {
  IN = 'in',                         // Kirish
  OUT = 'out',                       # Chiqish
}

export enum AttendanceStatus {
  NORMAL = 'normal',                 // Oddiy
  LATE = 'late',                     # Kechikish
  EARLY = 'early',                   # Erta chiqish
  OVERTIME = 'overtime',             # Qo'shimcha ish
  WARNING = 'warning',               # Ogohlantirish
}
```

## 🔄 Check-in/Check-out Jarayoni

### Process Flow
```typescript
async checkInOut(checkInOutDto: CheckInOutDto) {
  const { employeeId, location, device, notes } = checkInOutDto;
  
  // 1. Xodimni topish
  const employee = await this.findEmployee(employeeId);
  
  // 2. Oxirgi attendance recordni topish
  const lastAttendance = await this.getLastAttendance(employeeId);
  
  // 3. Yangi record yaratish
  const newAttendance = await this.createAttendanceRecord({
    employeeId,
    location,
    device,
    notes,
    type: this.determineType(lastAttendance),
    status: this.determineStatus(lastAttendance, location)
  });
  
  // 4. Warning tekshirish
  await this.checkWarnings(newAttendance);
  
  // 5. Response qaytarish
  return {
    message: newAttendance.type === 'in' ? 'Kirish qayd qilindi' : 'Chiqish qayd qilindi',
    attendance: newAttendance,
    nextAction: newAttendance.type === 'in' ? 'Chiqish uchun tayyor' : 'Kirish uchun tayyor'
  };
}
```

### Type Determination
```typescript
private determineType(lastAttendance: Attendance | null): AttendanceType {
  if (!lastAttendance) {
    return AttendanceType.IN;        // Birinchi marta = Kirish
  }
  
  if (lastAttendance.type === AttendanceType.IN) {
    return AttendanceType.OUT;       # Oxirgi = IN, keyingi = OUT
  } else {
    return AttendanceType.IN;        # Oxirgi = OUT, keyingi = IN
  }
}
```

### Status Determination
```typescript
private determineStatus(lastAttendance: Attendance | null, location: any): AttendanceStatus {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  // Ish vaqti: 9:00 - 18:00
  const workStartHour = 9;
  const workEndHour = 18;
  
  if (lastAttendance?.type === AttendanceType.IN) {
    // Kirish vaqti tekshirish
    if (currentHour > workStartHour || (currentHour === workStartHour && currentMinute > 15)) {
      return AttendanceStatus.LATE;
    }
  } else {
    // Chiqish vaqti tekshirish
    if (currentHour < workEndHour) {
      return AttendanceStatus.EARLY;
    }
  }
  
  return AttendanceStatus.NORMAL;
}
```

## 📍 Geolocation Tracking

### Location Validation
```typescript
private validateLocation(location: any): boolean {
  const { latitude, longitude } = location;
  
  // Koordinatalar to'g'ri ekanligini tekshirish
  if (latitude < -90 || latitude > 90) return false;
  if (longitude < -180 || longitude > 180) return false;
  
  // Office radius (500 metr)
  const officeLocation = { lat: 41.2995, lng: 69.2401 }; // Tashkent
  const distance = this.calculateDistance(
    { lat: latitude, lng: longitude },
    officeLocation
  );
  
  return distance <= 0.5; // 500 metr ichida
}
```

### Distance Calculation
```typescript
private calculateDistance(point1: any, point2: any): number {
  const R = 6371; // Yer radiusi (km)
  const dLat = this.toRadians(point2.lat - point1.lat);
  const dLng = this.toRadians(point2.lng - point1.lng);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(this.toRadians(point1.lat)) * Math.cos(this.toRadians(point2.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
```

## 🚨 Warning System

### Warning Detection
```typescript
async checkWarnings(attendance: Attendance) {
  const warnings = [];
  
  // Late arrival warning
  if (attendance.status === AttendanceStatus.LATE) {
    warnings.push({
      type: 'LATE_ARRIVAL',
      reason: 'Ish vaqtidan kech keldingiz',
      severity: 'MEDIUM'
    });
  }
  
  // Early departure warning
  if (attendance.status === AttendanceStatus.EARLY) {
    warnings.push({
      type: 'EARLY_DEPARTURE',
      reason: 'Ish vaqtidan oldin chiqdingiz',
      severity: 'MEDIUM'
    });
  }
  
  // Absence warning (3 kun ketma-ket)
  const consecutiveAbsences = await this.getConsecutiveAbsences(attendance.employeeId);
  if (consecutiveAbsences >= 3) {
    warnings.push({
      type: 'CONSECUTIVE_ABSENCE',
      reason: `${consecutiveAbsences} kun ketma-ket ishga kelmadingiz`,
      severity: 'HIGH'
    });
  }
  
  // Warninglarni saqlash
  if (warnings.length > 0) {
    attendance.hasWarning = true;
    attendance.warningReason = warnings.map(w => w.reason).join('; ');
    attendance.warningTimestamp = new Date();
    await attendance.save();
    
    // Notification yuborish
    await this.sendWarningNotification(attendance, warnings);
  }
}
```

## 📊 Statistics va Reports

### Employee Statistics
```typescript
async getEmployeeStatistics(employeeId: string, fromDate?: string, toDate?: string) {
  const filter: any = { employeeId, isDeleted: false };
  
  if (fromDate || toDate) {
    filter.timestamp = {};
    if (fromDate) filter.timestamp.$gte = new Date(fromDate);
    if (toDate) filter.timestamp.$lte = new Date(toDate);
  }
  
  const attendances = await this.attendanceModel.find(filter);
  
  const stats = {
    totalDays: this.calculateTotalDays(attendances),
    presentDays: this.calculatePresentDays(attendances),
    absentDays: this.calculateAbsentDays(attendances),
    lateArrivals: this.countLateArrivals(attendances),
    earlyDepartures: this.countEarlyDepartures(attendances),
    averageWorkHours: this.calculateAverageWorkHours(attendances),
    overtimeHours: this.calculateOvertimeHours(attendances),
    warnings: this.countWarnings(attendances)
  };
  
  return stats;
}
```

### Daily Report
```typescript
async getDailyReport(date: string) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  const attendances = await this.attendanceModel.find({
    timestamp: { $gte: startOfDay, $lte: endOfDay },
    isDeleted: false
  });
  
  const report = {
    date: date,
    totalEmployees: await this.getTotalEmployees(),
    presentEmployees: this.countPresentEmployees(attendances),
    absentEmployees: this.countAbsentEmployees(attendances),
    lateArrivals: this.countLateArrivals(attendances),
    earlyDepartures: this.countEarlyDepartures(attendances),
    departmentStats: await this.getDepartmentStats(attendances),
    warnings: this.getWarnings(attendances)
  };
  
  return report;
}
```

## ⏰ Cron Jobs

### Daily Processing
```typescript
@Cron('0 0 * * *') // Har kuni 00:00 da
async processDailyAttendance() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  // Kechagi attendance recordlarni qayta ishlash
  await this.processYesterdayAttendance(yesterday);
  
  // Kunlik hisobot yaratish
  await this.generateDailyReport(yesterday);
  
  // Warninglarni tekshirish
  await this.checkDailyWarnings(yesterday);
}
```

### Weekly Report
```typescript
@Cron('0 0 * * 1') // Har dushanba 00:00 da
async generateWeeklyReport() {
  const lastWeek = this.getLastWeekDates();
  
  const report = {
    period: lastWeek,
    summary: await this.getWeeklySummary(lastWeek),
    topPerformers: await this.getTopPerformers(lastWeek),
    issues: await this.getWeeklyIssues(lastWeek)
  };
  
  // Report yuborish
  await this.sendWeeklyReport(report);
}
```

## 🔐 Xavfsizlik va Ruxsatlar

### Role-based Access
```typescript
// Check-in/out - barcha xodimlar
@Post('check-in-out')
@UseGuards(JwtAuthGuard)
async checkInOut() { ... }

// Reports - faqat ADMIN va HR
@Get('reports/daily')
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN, UserRole.HR)
async getDailyReport() { ... }
```

### Data Validation
- Location validation
- Time validation
- Employee verification
- Device verification

## 🗄️ Ma'lumotlar bazasi optimizatsiyasi

### Indexes
```typescript
// Performance optimization
AttendanceSchema.index({ employeeId: 1, timestamp: -1 });
AttendanceSchema.index({ timestamp: -1 });
AttendanceSchema.index({ type: 1 });
AttendanceSchema.index({ status: 1 });
AttendanceSchema.index({ 'location.latitude': 1, 'location.longitude': 1 });
AttendanceSchema.index({ hasWarning: 1 });
```

### Aggregation Pipelines
```typescript
async getMonthlyStatistics(employeeId: string, month: number, year: number) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  
  return this.attendanceModel.aggregate([
    { $match: {
      employeeId: new Types.ObjectId(employeeId),
      timestamp: { $gte: startDate, $lte: endDate },
      isDeleted: false
    }},
    { $group: {
      _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
      checkIns: { $sum: { $cond: [{ $eq: ['$type', 'in'] }, 1, 0] } },
      checkOuts: { $sum: { $cond: [{ $eq: ['$type', 'out'] }, 1, 0] } },
      warnings: { $sum: { $cond: ['$hasWarning', 1, 0] } }
    }},
    { $sort: { _id: 1 } }
  ]);
}
```

## 🧪 Testing

### Unit Tests
```bash
npm run test src/attendance/
```

### Integration Tests
```bash
npm run test:e2e
```

### Test Coverage
```bash
npm run test:cov
```

## 🔧 Configuration

### Environment Variables
```env
# Attendance Module
ATTENDANCE_WORK_START_HOUR=9
ATTENDANCE_WORK_END_HOUR=18
ATTENDANCE_LATE_THRESHOLD_MINUTES=15
ATTENDANCE_OFFICE_RADIUS_METERS=500

# Geolocation
GEOCODING_API_KEY=your-api-key
OFFICE_LATITUDE=41.2995
OFFICE_LONGITUDE=69.2401

# Notifications
NOTIFICATION_EMAIL_TEMPLATE=attendance-warning
SLACK_WEBHOOK_URL=your-webhook-url
```

## 📚 Foydali havolalar

- [NestJS Cron Jobs](https://docs.nestjs.com/techniques/task-scheduling)
- [MongoDB Geospatial Queries](https://docs.mongodb.com/manual/geospatial-queries/)
- [Geolocation APIs](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API)
- [Time Zone Handling](https://momentjs.com/timezone/)

## 🔮 Kelajakdagi rivojlantirish

### 1. Advanced Features
- Face recognition
- Biometric authentication
- Mobile app integration
- Real-time notifications

### 2. Analytics
- Predictive attendance
- Performance metrics
- Behavioral analysis
- Machine learning insights

### 3. Integration
- Payroll systems
- HRIS platforms
- Time tracking tools
- Calendar applications

---

**Eslatma:** Bu modul production environment uchun tayyorlangan va enterprise-level attendance management standartlariga mos keladi.
