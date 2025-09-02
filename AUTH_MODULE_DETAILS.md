# 🔐 Authentication Module - Batafsil Ma'lumot

## 📋 Modul haqida umumiy ma'lumot

Authentication moduli tizimning xavfsizlik asosini tashkil etadi. JWT token asosida ishlaydi va role-based access control (RBAC) tizimini ta'minlaydi.

## 🏗️ Modul strukturasi

```
src/auth/
├── auth.module.ts              # Asosiy modul
├── auth.controller.ts          # API endpointlari
├── auth.service.ts            # Business logic
├── seed-super-admin.ts        # Super admin yaratish
├── index.ts                   # Export fayllari
├── dto/                       # Data Transfer Objects
├── entities/                  # Ma'lumotlar sxemalari
├── guards/                    # Xavfsizlik guardlari
├── strategies/                # Passport strategiyalari
└── decorators/                # Custom decoratorlar
```

## 🔑 Foydalanuvchi rollari va huquqlari

### 1. SUPER_ADMIN
- **Huquqlar:** Barcha tizim funksiyalariga to'liq ruxsat
- **Vazifalari:** Tizim sozlamalari, barcha modullarni boshqarish
- **API endpointlari:** Barcha endpointlarga ruxsat

### 2. ADMIN
- **Huquqlar:** Tizim boshqaruvi, xodimlar va kompyuterlarni boshqarish
- **Vazifalari:** HR va Computers modullarini to'liq boshqarish
- **API endpointlari:** Admin darajasidagi barcha endpointlar

### 3. HR
- **Huquqlar:** Xodimlarni boshqarish, attendance tracking
- **Vazifalari:** Employee CRUD, attendance monitoring
- **API endpointlari:** HR moduli va attendance endpointlari

### 4. EMPLOYEE
- **Huquqlar:** O'z ma'lumotlarini ko'rish va yangilash
- **Vazifalari:** Profile management, attendance check-in/out
- **API endpointlari:** Cheklangan endpointlar

## 🚀 API Endpoints

### Authentication
```typescript
POST /auth/login          # Tizimga kirish
POST /auth/register       # Yangi foydalanuvchi ro'yxatdan o'tkazish
POST /auth/refresh        # Token yangilash
POST /auth/logout         # Tizimdan chiqish
GET  /auth/profile        # Foydalanuvchi profili
```

### User Management
```typescript
GET    /auth/users        # Foydalanuvchilar ro'yxati
GET    /auth/users/:id    # Foydalanuvchi ma'lumotlari
PATCH  /auth/users/:id    # Foydalanuvchi ma'lumotlarini yangilash
DELETE /auth/users/:id    # Foydalanuvchini o'chirish
```

## 🛡️ Xavfsizlik mexanizmlari

### 1. Password Security
- **Hashing:** bcryptjs orqali password hashing
- **Salt Rounds:** 12 (xavfsizlik darajasi)
- **Validation:** Kuchli password talablari

### 2. JWT Token Management
- **Secret Key:** Environment variable orqali
- **Expiration:** 24 soat (sozlanishi mumkin)
- **Refresh Token:** Avtomatik token yangilash

### 3. Rate Limiting
- **Login Attempts:** Xatoliklar sonini cheklash
- **IP Blocking:** Xavfli IP manzillarni bloklash
- **Session Management:** Faol sessiyalarni nazorat qilish

## 🔒 Guards va Strategiyalar

### JWT Auth Guard
```typescript
@UseGuards(JwtAuthGuard)
export class ProtectedController {
  // JWT token talab qilinadi
}
```

### Roles Guard
```typescript
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN, UserRole.HR)
export class AdminController {
  // Faqat ADMIN va HR ruxsati
}
```

### Passport Strategies
- **Local Strategy:** Username/password authentication
- **JWT Strategy:** Token validation
- **Custom Strategy:** Role-based access

## 📊 Ma'lumotlar sxemasi

### User Entity
```typescript
export class User {
  _id: ObjectId;
  username: string;           // Unique username
  email: string;              // Unique email
  password: string;           // Hashed password
  role: UserRole;             // User role
  isActive: boolean;          // Account status
  lastLogin: Date;            // Oxirgi kirish vaqti
  loginAttempts: number;      // Xatoliklar soni
  lockedUntil: Date;          // Bloklash vaqti
  createdAt: Date;
  updatedAt: Date;
}
```

### UserRole Enum
```typescript
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  HR = 'hr',
  EMPLOYEE = 'employee',
}
```

## 🔐 Login jarayoni

### 1. Credential Validation
```typescript
// Username va password tekshirish
const user = await this.validateUser(username, password);
```

### 2. Password Verification
```typescript
// bcryptjs orqali password tekshirish
const isPasswordValid = await bcrypt.compare(password, user.password);
```

### 3. Token Generation
```typescript
// JWT token yaratish
const payload = { username: user.username, sub: user._id, role: user.role };
const accessToken = this.jwtService.sign(payload);
```

### 4. Response
```typescript
return {
  access_token: accessToken,
  user: {
    id: user._id,
    username: user.username,
    role: user.role,
    email: user.email
  }
};
```

## 🚨 Xavfsizlik choralari

### 1. Brute Force Protection
- Login attempts monitoring
- Account temporary locking
- IP-based rate limiting

### 2. Session Security
- Token expiration
- Secure cookie settings
- CSRF protection

### 3. Data Validation
- Input sanitization
- SQL injection prevention
- XSS protection

## 📝 Environment Variables

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# Security
BCRYPT_SALT_ROUNDS=12
LOGIN_MAX_ATTEMPTS=5
ACCOUNT_LOCK_DURATION=15m

# Database
MONGODB_URI=mongodb://localhost:27017/computer_logs
```

## 🧪 Testing

### Unit Tests
```bash
npm run test src/auth/
```

### Integration Tests
```bash
npm run test:e2e
```

### Test Coverage
```bash
npm run test:cov
```

## 🔧 Customization

### Role Permissions
```typescript
// Yangi role qo'shish
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  HR = 'hr',
  EMPLOYEE = 'employee',
  MANAGER = 'manager',        // Yangi role
}
```

### Custom Guards
```typescript
// O'z guardingizni yaratish
@Injectable()
export class CustomGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // Custom logic
  }
}
```

## 📚 Foydali havolalar

- [NestJS Authentication](https://docs.nestjs.com/security/authentication)
- [JWT Best Practices](https://jwt.io/introduction)
- [Passport.js Documentation](http://www.passportjs.org/)
- [bcrypt Security](https://en.wikipedia.org/wiki/Bcrypt)

---

**Eslatma:** Bu modul production environment uchun tayyorlangan va enterprise-level security standartlariga mos keladi.
