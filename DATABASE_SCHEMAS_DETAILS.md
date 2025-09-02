# 🗄️ Database Schemas - Batafsil Ma'lumot

## 📋 Ma'lumotlar bazasi haqida umumiy ma'lumot

Bu loyiha MongoDB NoSQL ma'lumotlar bazasini ishlatadi va Mongoose ODM orqali boshqariladi. Barcha sxemalar TypeScript class-based approach da yaratilgan va comprehensive validation va indexing bilan jihozlangan.

## 🏗️ Asosiy Sxemalar

### 1. User Schema (Foydalanuvchilar)

```typescript
export class User {
  _id: ObjectId;
  username: string;                 // Unique username
  email: string;                    // Unique email
  password: string;                 // Hashed password
  role: UserRole;                   // Foydalanuvchi roli
  isActive: boolean;                // Account status
  lastLogin: Date;                  // Oxirgi kirish vaqti
  loginAttempts: number;            // Xatoliklar soni
  lockedUntil: Date;                // Bloklash vaqti
  profilePicture?: string;          // Profil rasmi
  preferences?: {                   # Foydalanuvchi sozlamalari
    language: string;
    timezone: string;
    notifications: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Indexes
UserSchema.index({ username: 1 }, { unique: true });
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ lastLogin: -1 });
```

### 2. Employee Schema (Xodimlar)

```typescript
export class Employee {
  _id: ObjectId;
  fullName: string;                 // To'liq ism
  position: string;                 // Lavozim
  department: string;               // Bo'lim
  hireDate?: Date;                  // Ishga qabul qilingan sana
  birthDate?: Date;                 // Tug'ilgan sana
  passportId?: string;              // Passport raqami (unique)
  phones: string[];                 # Telefon raqamlar
  email: string;                    # Email (unique)
  address?: string;                 # Manzil
  salary?: number;                  # Maosh
  status: 'active' | 'inactive';   # Status

  // File attachments
  files?: string[];                 # Bog'langan fayllar

  // Soft delete
  isDeleted: boolean;
  deletedAt?: Date;

  // Workplace linking
  primaryWorkplaceId?: ObjectId;    // Asosiy ish joyi

  // User account linking
  userId?: ObjectId;                // User account ID
  username?: string;                // Username
  tempPassword?: string;            # Vaqtinchalik password

  // Additional fields
  emergencyContact?: {              # Favqulodda aloqa
    name: string;
    relationship: string;
    phone: string;
  };
  skills?: string[];                # Ko'nikmalar
  certifications?: string[];        # Sertifikatlar
  createdAt: Date;
  updatedAt: Date;
}

// Indexes
EmployeeSchema.index({ email: 1 }, { unique: true });
EmployeeSchema.index({ passportId: 1 }, { sparse: true });
EmployeeSchema.index({ department: 1 });
EmployeeSchema.index({ status: 1 });
EmployeeSchema.index({ isDeleted: 1 });
EmployeeSchema.index({ hireDate: -1 });
EmployeeSchema.index({ fullName: 'text', email: 'text' }); // Text search
```

### 3. Computer Schema (Kompyuterlar)

```typescript
export class Computer {
  _id: ObjectId;
  name: string;                     // Kompyuter nomi (unique)
  assignedEmployeeId?: ObjectId;    // Biriktirilgan xodim
  deviceRealName?: string;          # Haqiqiy device nomi

  // Additional fields
  type?: 'desktop' | 'laptop' | 'server' | 'workstation';
  model?: string;                   // Model
  manufacturer?: string;            // Ishlab chiqaruvchi
  specifications?: {                # Texnik xususiyatlar
    cpu: string;
    ram: string;
    storage: string;
    os: string;
  };
  purchaseDate?: Date;              # Sotib olingan sana
  warrantyExpiry?: Date;            # Kafolat muddati
  status: 'active' | 'inactive' | 'maintenance' | 'retired';
  location?: string;                # Joylashuv
  notes?: string;                   # Izohlar
  createdAt: Date;
  updatedAt: Date;
}

// Indexes
ComputerSchema.index({ name: 1 }, { unique: true });
ComputerSchema.index({ assignedEmployeeId: 1 });
ComputerSchema.index({ type: 1 });
ComputerSchema.index({ status: 1 });
ComputerSchema.index({ location: 1 });
```

### 4. Log Schema (Kompyuter Loglari)

```typescript
export class Log {
  _id: ObjectId;
  device: string;                   // Kompyuter nomi
  action: string;                   # Amal turi
  application: string;              # Ilova nomi
  time: Date;                       # Vaqt
  path?: string;                    # Fayl yo'li
  link?: string;                    # Havola

  // Additional fields
  userId?: string;                  // Foydalanuvchi ID
  sessionId?: string;               # Session ID
  ipAddress?: string;               # IP manzil
  userAgent?: string;               # User agent
  duration?: number;                # Davomiyligi (ms)
  metadata?: any;                   # Qo'shimcha ma'lumotlar
  createdAt: Date;
  updatedAt: Date;
}

// Indexes
LogSchema.index({ device: 1 });
LogSchema.index({ application: 1 });
LogSchema.index({ action: 1 });
LogSchema.index({ time: -1 });     // Date range query uchun
LogSchema.index({ userId: 1 });
LogSchema.index({ device: 1, time: -1 }); // Compound index
LogSchema.index({ time: 1, device: 1, application: 1 }); // Multi-field index
```

### 5. Attendance Schema (Davomat)

```typescript
export class Attendance {
  _id: ObjectId;
  employeeId: ObjectId;             // Xodim ID
  timestamp: Date;                  // Vaqt
  type: AttendanceType;             // IN yoki OUT
  status: AttendanceStatus;         // NORMAL, LATE, EARLY, OVERTIME, WARNING

  // Geolocation
  location: {
    latitude: number;               // Kenglik
    longitude: number;              # Uzunlik
    address?: string;               # Manzil
    accuracy?: number;              # Aniqlik
  };

  device?: string;                  # Device ma'lumotlari
  notes?: string;                   # Izohlar

  // Warning system
  hasWarning: boolean;              # Warning bormi
  warningReason?: string;           # Warning sababi
  warningTimestamp?: Date;          # Warning vaqti

  // Additional fields
  workHours?: number;               # Ish soatlari
  overtimeHours?: number;           # Qo'shimcha ish soatlari
  breakTime?: number;               # Dam olish vaqti

  // Soft delete
  isDeleted: boolean;
  deletedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

// Indexes
AttendanceSchema.index({ employeeId: 1, timestamp: -1 });
AttendanceSchema.index({ timestamp: -1 });
AttendanceSchema.index({ type: 1 });
AttendanceSchema.index({ status: 1 });
AttendanceSchema.index({ 'location.latitude': 1, 'location.longitude': 1 });
AttendanceSchema.index({ hasWarning: 1 });
AttendanceSchema.index({ employeeId: 1, type: 1, timestamp: -1 }); // Compound index
```

### 6. Workplace Schema (Ish Joylari)

```typescript
export class Workplace {
  _id: ObjectId;
  name: string;                     // Workplace nomi
  code?: string;                    # Workplace kodi
  type: WorkplaceType;              # Workplace turi
  address?: string;                 # Manzil
  status: WorkplaceStatus;          # Status
  parentId?: ObjectId;              # Parent workplace ID
  children?: ObjectId[];            # Child workplaces
  managerId?: ObjectId;             # Manager ID
  capacity?: number;                # Xodimlar sig'imi
  description?: string;             # Tavsif

  // Contact information
  contactInfo?: {
    phone?: string;
    email?: string;
    website?: string;
  };

  // Additional fields
  floor?: string;                   // Qavat
  room?: string;                    # Xona
  coordinates?: {                    # Koordinatalar
    latitude: number;
    longitude: number;
  };
  facilities?: string[];            # Imkoniyatlar
  createdAt: Date;
  updatedAt: Date;
}

// Indexes
WorkplaceSchema.index({ name: 1 });
WorkplaceSchema.index({ code: 1 }, { sparse: true });
WorkplaceSchema.index({ type: 1 });
WorkplaceSchema.index({ status: 1 });
WorkplaceSchema.index({ parentId: 1 });
WorkplaceSchema.index({ managerId: 1 });
WorkplaceSchema.index({ name: 'text', description: 'text' }); // Text search
```

### 7. Upload Schema (Yuklangan Fayllar)

```typescript
export class Upload {
  _id: ObjectId;
  originalName: string;             // Asl fayl nomi
  filename: string;                 # Saqlangan fayl nomi
  mimetype: string;                 # MIME type
  size: number;                     # Fayl hajmi (bytes)
  path: string;                     # Fayl yo'li
  url: string;                      # Fayl URL
  uploadedBy: ObjectId;             # Yuklagan xodim
  tags?: string[];                  # Fayl teglari
  description?: string;             # Fayl tavsifi
  isPublic: boolean;                # Ommaviy faylmi
  downloadCount: number;            # Yuklab olishlar soni

  // Additional fields
  category?: string;                # Fayl kategoriyasi
  version?: string;                 # Versiya
  checksum?: string;                # Checksum
  metadata?: any;                   # Qo'shimcha ma'lumotlar
  createdAt: Date;
  updatedAt: Date;
}

// Indexes
UploadSchema.index({ uploadedBy: 1 });
UploadSchema.index({ mimetype: 1 });
UploadSchema.index({ size: 1 });
UploadSchema.index({ isPublic: 1 });
UploadSchema.index({ tags: 1 });
UploadSchema.index({ originalName: 'text', description: 'text' }); // Text search
```

### 8. Fingerprint Schema (Barmoq Izi)

```typescript
export class Fingerprint {
  _id: ObjectId;
  employeeId: ObjectId;             // Xodim ID
  fingerprintData: string;          # Barmoq izi ma'lumotlari
  quality: number;                  # Sifat darajasi
  isActive: boolean;                # Faol status

  // Additional fields
  fingerType?: 'thumb' | 'index' | 'middle' | 'ring' | 'little';
  captureDevice?: string;           # Qurilma
  captureDate?: Date;               # Qayd qilingan sana
  templateVersion?: string;         # Template versiyasi
  createdAt: Date;
  updatedAt: Date;
}

// Indexes
FingerprintSchema.index({ employeeId: 1 });
FingerprintSchema.index({ isActive: 1 });
FingerprintSchema.index({ quality: 1 });
FingerprintSchema.index({ fingerType: 1 });
```

### 9. Department Schema (Bo'limlar)

```typescript
export class Department {
  _id: ObjectId;
  name: string;                     // Bo'lim nomi
  code: string;                     # Bo'lim kodi
  description?: string;             # Tavsif
  managerId?: ObjectId;             # Bo'lim boshlig'i
  parentDepartmentId?: ObjectId;    # Yuqori bo'lim
  status: 'active' | 'inactive';   # Status
  budget?: number;                  # Byudjet
  location?: string;                # Joylashuv
  createdAt: Date;
  updatedAt: Date;
}

// Indexes
DepartmentSchema.index({ name: 1 });
DepartmentSchema.index({ code: 1 }, { unique: true });
DepartmentSchema.index({ managerId: 1 });
DepartmentSchema.index({ parentDepartmentId: 1 });
DepartmentSchema.index({ status: 1 });
```

### 10. Position Schema (Lavozimlar)

```typescript
export class Position {
  _id: ObjectId;
  title: string;                    // Lavozim nomi
  code: string;                     # Lavozim kodi
  departmentId: ObjectId;           # Bo'lim ID
  level: number;                    # Daraja
  description?: string;             # Tavsif
  requirements?: string[];          # Talablar
  salaryRange?: {                   # Maosh oralig'i
    min: number;
    max: number;
    currency: string;
  };
  status: 'active' | 'inactive';   # Status
  createdAt: Date;
  updatedAt: Date;
}

// Indexes
PositionSchema.index({ title: 1 });
PositionSchema.index({ code: 1 }, { unique: true });
PositionSchema.index({ departmentId: 1 });
PositionSchema.index({ level: 1 });
PositionSchema.index({ status: 1 });
```

### 11. Location Schema (Joylashuvlar)

```typescript
export class Location {
  _id: ObjectId;
  name: string;                     // Joylashuv nomi
  type: 'office' | 'branch' | 'warehouse' | 'factory'; // Turi
  address: string;                  # Manzil
  coordinates: {                     # Koordinatalar
    latitude: number;
    longitude: number;
  };
  country: string;                  // Davlat
  city: string;                     # Shahar
  timezone: string;                 # Vaqt zonasi
  contactInfo?: {                   # Aloqa ma'lumotlari
    phone: string;
    email: string;
    website?: string;
  };
  status: 'active' | 'inactive';   # Status
  createdAt: Date;
  updatedAt: Date;
}

// Indexes
LocationSchema.index({ name: 1 });
LocationSchema.index({ type: 1 });
LocationSchema.index({ country: 1 });
LocationSchema.index({ city: 1 });
LocationSchema.index({ 'coordinates.latitude': 1, 'coordinates.longitude': 1 });
LocationSchema.index({ status: 1 });
```

## 🔗 Sxemalar O'rtasidagi Bog'lanishlar

### 1. User - Employee Relationship

```typescript
// User dan Employee ga
UserSchema.virtual('employee', {
  ref: 'Employee',
  localField: '_id',
  foreignField: 'userId',
  justOne: true,
});

// Employee dan User ga
EmployeeSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});
```

### 2. Employee - Workplace Relationship

```typescript
// Employee dan Workplace ga
EmployeeSchema.virtual('primaryWorkplace', {
  ref: 'Workplace',
  localField: 'primaryWorkplaceId',
  foreignField: '_id',
  justOne: true,
});

// Workplace dan Employee ga
WorkplaceSchema.virtual('employees', {
  ref: 'Employee',
  localField: '_id',
  foreignField: 'primaryWorkplaceId',
});
```

### 3. Computer - Employee Relationship

```typescript
// Computer dan Employee ga
ComputerSchema.virtual('assignedEmployee', {
  ref: 'Employee',
  localField: 'assignedEmployeeId',
  foreignField: '_id',
  justOne: true,
});

// Employee dan Computer ga
EmployeeSchema.virtual('computers', {
  ref: 'Computer',
  localField: '_id',
  foreignField: 'assignedEmployeeId',
});
```

### 4. Workplace - Department Relationship

```typescript
// Workplace dan Department ga
WorkplaceSchema.virtual('department', {
  ref: 'Department',
  localField: 'departmentId',
  foreignField: '_id',
  justOne: true,
});

// Department dan Workplace ga
DepartmentSchema.virtual('workplaces', {
  ref: 'Workplace',
  localField: '_id',
  foreignField: 'departmentId',
});
```

## 📊 Database Performance Optimization

### 1. Indexing Strategy

```typescript
// Compound indexes for complex queries
LogSchema.index({ device: 1, time: -1, application: 1 });
AttendanceSchema.index({ employeeId: 1, timestamp: -1, type: 1 });
EmployeeSchema.index({ department: 1, status: 1, isDeleted: 1 });

// Text search indexes
EmployeeSchema.index({ fullName: 'text', email: 'text', position: 'text' });
WorkplaceSchema.index({ name: 'text', description: 'text' });
UploadSchema.index({ originalName: 'text', description: 'text' });

// Geospatial indexes
AttendanceSchema.index({ location: '2dsphere' });
LocationSchema.index({ coordinates: '2dsphere' });
```

### 2. Aggregation Pipeline Optimization

```typescript
// Efficient aggregation for statistics
async getEmployeeStatistics() {
  return this.employeeModel.aggregate([
    { $match: { isDeleted: false } },
    { $lookup: {
      from: 'attendances',
      localField: '_id',
      foreignField: 'employeeId',
      as: 'attendances'
    }},
    { $lookup: {
      from: 'workplaces',
      localField: 'primaryWorkplaceId',
      foreignField: '_id',
      as: 'workplace'
    }},
    { $project: {
      fullName: 1,
      department: 1,
      position: 1,
      attendanceCount: { $size: '$attendances' },
      workplaceName: { $arrayElemAt: ['$workplace.name', 0] }
    }},
    { $sort: { fullName: 1 } }
  ]);
}
```

### 3. Data Archiving Strategy

```typescript
// Log archiving for performance
async archiveOldLogs(monthsOld: number = 12) {
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - monthsOld);

  const oldLogs = await this.logModel.find({
    time: { $lt: cutoffDate }
  });

  // Archive to separate collection
  await this.archivedLogModel.insertMany(oldLogs);

  // Remove from main collection
  await this.logModel.deleteMany({
    time: { $lt: cutoffDate }
  });
}
```

## 🔐 Data Security va Validation

### 1. Schema Validation

```typescript
// Mongoose validation
EmployeeSchema.path('email').validate(function (value) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}, "Email formati noto'g'ri");

EmployeeSchema.path('salary').validate(function (value) {
  return value >= 0;
}, "Maosh manfiy bo'lishi mumkin emas");
```

### 2. Data Encryption

```typescript
// Sensitive data encryption
UserSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

// PII data encryption
EmployeeSchema.pre('save', async function (next) {
  if (this.isModified('passportId')) {
    this.passportId = await this.encryptField(this.passportId);
  }
  next();
});
```

### 3. Access Control

```typescript
// Field-level access control
EmployeeSchema.methods.toJSON = function () {
  const employee = this.toObject();

  // Remove sensitive fields for non-admin users
  if (!this.isAdminUser()) {
    delete employee.salary;
    delete employee.passportId;
    delete employee.address;
  }

  return employee;
};
```

## 📈 Monitoring va Maintenance

### 1. Database Health Monitoring

```typescript
// Collection size monitoring
async getCollectionStats() {
  const stats = await this.connection.db.stats();

  return {
    totalCollections: stats.collections,
    totalDataSize: stats.dataSize,
    totalIndexSize: stats.indexSize,
    totalStorageSize: stats.storageSize,
    collections: await this.getCollectionDetails()
  };
}
```

### 2. Index Usage Monitoring

```typescript
// Index performance monitoring
async getIndexStats() {
  const collections = await this.connection.db.listCollections().toArray();
  const indexStats = [];

  for (const collection of collections) {
    const stats = await this.connection.db.collection(collection.name).indexStats();
    indexStats.push({
      collection: collection.name,
      indexes: stats
    });
  }

  return indexStats;
}
```

### 3. Query Performance Analysis

```typescript
// Slow query monitoring
async enableQueryProfiling() {
  await this.connection.db.setProfilingLevel(2, 100); // Log queries slower than 100ms
}

async getSlowQueries() {
  const systemProfile = this.connection.db.collection('system.profile');
  return systemProfile.find({ millis: { $gt: 100 } }).sort({ ts: -1 }).limit(100);
}
```

---

**Eslatma:** Bu sxemalar production environment uchun tayyorlangan va enterprise-level database design standartlariga mos keladi.
