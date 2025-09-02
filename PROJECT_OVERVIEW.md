# Computer Logs & HR Management System

## 🚀 Loyiha haqida umumiy ma'lumot

Bu loyiha kompyuter loglarini saqlash, xodimlarni boshqarish va attendance tracking qilish uchun yaratilgan keng qamrovli tizim hisoblanadi. NestJS framework asosida qurilgan va MongoDB ma'lumotlar bazasini ishlatadi.

## 🏗️ Tizim arxitekturasi

### Backend Framework
- **NestJS v11** - Node.js uchun enterprise-level framework
- **TypeScript** - Type-safe development
- **MongoDB + Mongoose** - NoSQL ma'lumotlar bazasi
- **JWT Authentication** - Xavfsiz autentifikatsiya
- **Swagger/OpenAPI** - API dokumentatsiyasi

### Asosiy modullar
1. **Auth Module** - Foydalanuvchilar autentifikatsiyasi va avtorizatsiyasi
2. **Computers Module** - Kompyuterlar va loglarni boshqarish
3. **HR Module** - Xodimlarni boshqarish
4. **Attendance Module** - Davomat nazorati
5. **Upload Module** - Fayl yuklash va boshqarish
6. **Workplaces Module** - Ish joylarini boshqarish

## 🔐 Xavfsizlik tizimi

### Autentifikatsiya
- JWT token asosida
- Password hashing (bcryptjs)
- Role-based access control (RBAC)

### Foydalanuvchi rollari
- **SUPER_ADMIN** - To'liq huquqlar
- **ADMIN** - Tizim boshqaruvi
- **HR** - Xodimlar boshqaruvi
- **EMPLOYEE** - O'z ma'lumotlarini ko'rish

## 📊 Ma'lumotlar bazasi sxemasi

### Asosiy jadvallar
- **Users** - Foydalanuvchilar
- **Employees** - Xodimlar
- **Computers** - Kompyuterlar
- **Logs** - Kompyuter loglari
- **Attendance** - Davomat yozuvlari
- **Workplaces** - Ish joylari
- **Uploads** - Yuklangan fayllar

## 🌐 API Endpoints

### Swagger Dokumentatsiya
- URL: `/akaikumogo/secret/api`
- To'liq API endpointlari va parametrlari
- Request/Response misollari
- Authentication keraklari

## 🚀 Ishga tushirish

### Talablar
- Node.js 18+
- MongoDB
- npm yoki yarn

### O'rnatish
```bash
npm install
```

### Ishga tushirish
```bash
# Development
npm run start:dev

# Production
npm run start:prod
```

### Environment o'zgaruvchilari
```env
PORT=3000
JWT_SECRET=your-secret-key
MONGODB_URI=mongodb://localhost:27017/computer_logs
NODE_ENV=development
```

## 📁 Loyiha strukturasi

```
src/
├── auth/           # Autentifikatsiya va avtorizatsiya
├── computers/      # Kompyuterlar va loglar
├── hr/            # Xodimlar boshqaruvi
├── attendance/    # Davomat nazorati
├── upload/        # Fayl yuklash
├── workplaces/    # Ish joylari
├── schemas/       # MongoDB sxemalari
├── dto/          # Data Transfer Objects
└── config/       # Konfiguratsiya
```

## 🔧 Asosiy funksionallik

### 1. Kompyuter Loglari
- Real-time log yig'ish
- Filter va qidirish
- Pagination
- Export qilish

### 2. Xodimlar Boshqaruvi
- Xodim qo'shish/o'chirish
- Ma'lumotlarni yangilash
- Avtomatik user account yaratish
- Bulk operations

### 3. Davomat Nazorati
- Check-in/Check-out
- Geolocation tracking
- Statistika va hisobotlar
- Warning tizimi

### 4. Fayl Boshqaruvi
- Rasm va hujjatlarni yuklash
- Xavfsiz saqlash
- Access control

## 📈 Monitoring va Logging

- Application performance monitoring
- Error tracking
- User activity logs
- System health checks

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

## 🚀 Deployment

### Production
- Environment variables sozlash
- MongoDB connection string
- JWT secret key
- CORS sozlash

### Docker (optional)
- Containerization
- Multi-stage builds
- Environment-specific configs

## 🔮 Kelajakdagi rivojlantirish

- Real-time notifications
- Mobile application
- Advanced analytics
- Machine learning integration
- Multi-tenant support

## 📞 Yordam va qo'llab-quvvatlash

- API dokumentatsiya: Swagger UI
- Error handling: Comprehensive error messages
- Logging: Detailed application logs
- Monitoring: Performance metrics

---

**Eslatma:** Bu loyiha production environment uchun tayyorlangan va enterprise-level security standartlariga mos keladi.
