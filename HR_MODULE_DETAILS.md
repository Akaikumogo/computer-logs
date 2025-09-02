# 👥 HR Module - Batafsil Ma'lumot

## 📋 Modul haqida umumiy ma'lumot

HR moduli xodimlarni boshqarish, ularning ma'lumotlarini saqlash va avtomatik user account yaratish uchun yaratilgan. Bu modul comprehensive employee management system hisoblanadi.

## 🏗️ Modul strukturasi

```
src/hr/
├── hr.module.ts                 # Asosiy modul
├── hr.controller.ts             # API endpointlari
├── hr.service.ts               # Business logic
├── dto/                        # Data Transfer Objects
├── entities/                   # Ma'lumotlar sxemalari
└── AUTOMATIC_USER_ACCOUNTS.md  # User account yaratish haqida
```

## 🔧 Asosiy funksionallik

### 1. Xodimlar CRUD Operatsiyalari
- Yangi xodim qo'shish
- Xodim ma'lumotlarini yangilash
- Xodimni o'chirish (soft delete)
- Xodim ma'lumotlarini ko'rish

### 2. Avtomatik User Account Yaratish
- Xodim qo'shilganda avtomatik user account
- Username va password generation
- Role assignment
- Email notification

### 3. Bulk Operations
- Bir necha xodimlarni bir vaqtda yangilash
- Mass o'chirish
- Password reset
- Status update

### 4. Fingerprint Management
- Barmoq izi ma'lumotlarini saqlash
- Fingerprint search va filter
- Attendance tracking uchun

## 🚀 API Endpoints

### Employee Management
```typescript
POST   /hr                           # Yangi xodim qo'shish
GET    /hr                           # Xodimlar ro'yxati
GET    /hr/:id                       # Xodim ma'lumotlari
PATCH  /hr/:id                       # Xodim ma'lumotlarini yangilash
DELETE /hr/:id                       # Xodimni o'chirish
```

### Bulk Operations
```typescript
PATCH  /hr/bulk-update              # Bir necha xodimlarni yangilash
DELETE /hr/bulk-delete              # Bir necha xodimlarni o'chirish
PATCH  /hr/bulk-restore             # O'chirilgan xodimlarni tiklash
PATCH  /hr/bulk-password-reset     # Password reset
```

### Fingerprint Management
```typescript
GET    /hr/fingerprints             # Barcha fingerprintlar
GET    /hr/fingerprints/search      # Fingerprint qidirish
PATCH  /hr/fingerprints/:id         # Fingerprint yangilash
```

### Statistics va Reports
```typescript
GET    /hr/statistics               # Umumiy statistika
GET    /hr/reports/employees        # Xodimlar hisoboti
GET    /hr/reports/departments      # Bo'limlar hisoboti
```

## 📊 Ma'lumotlar sxemasi

### Employee Schema
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
  files?: string[];                 # Bog'langan fayllar
  
  // Soft delete
  isDeleted: boolean;
  deletedAt?: Date;
  
  // Workplace linking
  primaryWorkplaceId?: ObjectId;
  
  // User account linking
  userId?: ObjectId;
  username?: string;
  tempPassword?: string;
}
```

### Fingerprint Schema
```typescript
export class Fingerprint {
  _id: ObjectId;
  employeeId: ObjectId;             // Xodim ID
  fingerprintData: string;          # Barmoq izi ma'lumotlari
  quality: number;                  # Sifat darajasi
  isActive: boolean;                # Faol status
  createdAt: Date;
  updatedAt: Date;
}
```

## 🔐 Xavfsizlik va Ruxsatlar

### Role-based Access Control
```typescript
// Yangi xodim qo'shish - faqat ADMIN va HR
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN, UserRole.HR)
@Post()
createEmployee() { ... }

// Xodim ma'lumotlarini yangilash - faqat ADMIN va HR
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN, UserRole.HR)
@Patch(':id')
updateEmployee() { ... }

// O'chirish - faqat ADMIN
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
@Delete(':id')
deleteEmployee() { ... }
```

### Data Validation
- Input sanitization
- Unique constraint validation
- Business rule validation
- Data integrity checks

## 🔄 Avtomatik User Account Yaratish

### Process Flow
```typescript
async createEmployee(createEmployeeDto: CreateEmployeeDto) {
  // 1. Xodim ma'lumotlarini saqlash
  const employee = await this.employeeModel.create(createEmployeeDto);
  
  // 2. Avtomatik user account yaratish
  const userAccount = await this.createUserAccount(employee);
  
  // 3. Employee bilan bog'lash
  employee.userId = userAccount._id;
  employee.username = userAccount.username;
  employee.tempPassword = userAccount.tempPassword;
  
  // 4. Yangilash
  await employee.save();
  
  // 5. Email notification
  await this.sendWelcomeEmail(employee);
  
  return employee;
}
```

### Username Generation
```typescript
private generateUsername(fullName: string): string {
  const names = fullName.toLowerCase().split(' ');
  const firstName = names[0];
  const lastName = names[names.length - 1];
  
  let username = `${firstName}.${lastName}`;
  let counter = 1;
  
  // Unique username tekshirish
  while (await this.isUsernameExists(username)) {
    username = `${firstName}.${lastName}${counter}`;
    counter++;
  }
  
  return username;
}
```

### Password Generation
```typescript
private generatePassword(): string {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  return password;
}
```

## 📈 Statistika va Hisobotlar

### Employee Statistics
```typescript
async getEmployeeStatistics(): Promise<HrStatisticsDto> {
  const totalEmployees = await this.employeeModel.countDocuments({ isDeleted: false });
  const activeEmployees = await this.employeeModel.countDocuments({ 
    status: 'active', 
    isDeleted: false 
  });
  const newHiresThisMonth = await this.getNewHiresThisMonth();
  const departmentStats = await this.getDepartmentStatistics();
  
  return {
    totalEmployees,
    activeEmployees,
    inactiveEmployees: totalEmployees - activeEmployees,
    newHiresThisMonth,
    departmentStats,
    averageSalary: await this.getAverageSalary(),
    turnoverRate: await this.getTurnoverRate()
  };
}
```

### Department Reports
```typescript
async getDepartmentReport(departmentId: string) {
  const employees = await this.employeeModel.find({
    department: departmentId,
    isDeleted: false
  });
  
  const stats = {
    totalEmployees: employees.length,
    averageSalary: this.calculateAverageSalary(employees),
    positions: this.groupByPosition(employees),
    hireDateDistribution: this.getHireDateDistribution(employees)
  };
  
  return stats;
}
```

## 🔍 Qidirish va Filter

### Advanced Search
```typescript
async searchEmployees(query: GetEmployeesQueryDto) {
  const filter: any = { isDeleted: false };
  
  // Text search
  if (query.search) {
    filter.$or = [
      { fullName: { $regex: query.search, $options: 'i' } },
      { email: { $regex: query.search, $options: 'i' } },
      { position: { $regex: query.search, $options: 'i' } }
    ];
  }
  
  // Department filter
  if (query.department) {
    filter.department = query.department;
  }
  
  // Status filter
  if (query.status) {
    filter.status = query.status;
  }
  
  // Date range filter
  if (query.hireDateFrom || query.hireDateTo) {
    filter.hireDate = {};
    if (query.hireDateFrom) filter.hireDate.$gte = new Date(query.hireDateFrom);
    if (query.hireDateTo) filter.hireDate.$lte = new Date(query.hireDateTo);
  }
  
  return this.employeeModel.find(filter)
    .sort({ [query.sortBy || 'fullName']: query.order || 'asc' })
    .skip((query.page - 1) * query.limit)
    .limit(query.limit);
}
```

## 📧 Email Notifications

### Welcome Email
```typescript
async sendWelcomeEmail(employee: Employee) {
  const emailData = {
    to: employee.email,
    subject: 'Xush kelibsiz! Sizning account yaratildi',
    template: 'welcome-email',
    context: {
      fullName: employee.fullName,
      username: employee.username,
      tempPassword: employee.tempPassword,
      loginUrl: `${process.env.FRONTEND_URL}/login`
    }
  };
  
  await this.emailService.sendEmail(emailData);
}
```

### Password Reset Email
```typescript
async sendPasswordResetEmail(employee: Employee, newPassword: string) {
  const emailData = {
    to: employee.email,
    subject: 'Password qayta o\'rnatildi',
    template: 'password-reset',
    context: {
      fullName: employee.fullName,
      newPassword: newPassword,
      loginUrl: `${process.env.FRONTEND_URL}/login`
    }
  };
  
  await this.emailService.sendEmail(emailData);
}
```

## 🗄️ Ma'lumotlar bazasi optimizatsiyasi

### Indexes
```typescript
// Performance optimization
EmployeeSchema.index({ email: 1 }, { unique: true });
EmployeeSchema.index({ passportId: 1 }, { sparse: true });
EmployeeSchema.index({ department: 1 });
EmployeeSchema.index({ status: 1 });
EmployeeSchema.index({ isDeleted: 1 });
EmployeeSchema.index({ hireDate: -1 });
EmployeeSchema.index({ fullName: 'text', email: 'text' }); // Text search
```

### Aggregation Pipelines
```typescript
async getDepartmentStatistics() {
  return this.employeeModel.aggregate([
    { $match: { isDeleted: false } },
    { $group: {
      _id: '$department',
      count: { $sum: 1 },
      averageSalary: { $avg: '$salary' },
      positions: { $addToSet: '$position' }
    }},
    { $sort: { count: -1 } }
  ]);
}
```

## 🧪 Testing

### Unit Tests
```bash
npm run test src/hr/
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
# HR Module
HR_DEFAULT_PASSWORD_LENGTH=12
HR_WELCOME_EMAIL_TEMPLATE=welcome-email
HR_PASSWORD_RESET_TEMPLATE=password-reset

# Email Service
EMAIL_SERVICE_URL=smtp://localhost:587
EMAIL_FROM=noreply@company.com

# Password Policy
MIN_PASSWORD_LENGTH=8
PASSWORD_COMPLEXITY=true
```

## 📚 Foydali havolalar

- [NestJS Services](https://docs.nestjs.com/providers)
- [MongoDB Aggregation](https://docs.mongodb.com/manual/aggregation/)
- [Email Templates](https://nodemailer.com/)
- [Password Security](https://owasp.org/www-project-cheat-sheets/cheatsheets/Authentication_Cheat_Sheet.html)

## 🔮 Kelajakdagi rivojlantirish

### 1. Advanced Analytics
- Employee performance metrics
- Predictive analytics
- Machine learning insights

### 2. Integration Features
- HRIS systems
- Payroll systems
- Time tracking systems

### 3. Mobile Application
- Employee self-service
- Mobile attendance
- Push notifications

---

**Eslatma:** Bu modul production environment uchun tayyorlangan va enterprise-level HR management standartlariga mos keladi.
