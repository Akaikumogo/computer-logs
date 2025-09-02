# 💻 Computers Module - Batafsil Ma'lumot

## 📋 Modul haqida umumiy ma'lumot

Computers moduli kompyuterlar va ularning loglarini boshqarish uchun yaratilgan. Bu modul real-time log yig'ish, kompyuterlarga xodimlarni biriktirish va loglarni filter qilish imkoniyatlarini ta'minlaydi.

## 🏗️ Modul strukturasi

```
src/computers/
├── computers.module.ts         # Asosiy modul
├── computers.controller.ts     # API endpointlari
├── computers.service.ts        # Business logic
├── ai.service.ts              # AI-powered log analysis
├── public-computers.controller.ts # Public endpoints
├── dto/                       # Data Transfer Objects
└── logs.json                  # Sample log data
```

## 🔧 Asosiy funksionallik

### 1. Kompyuterlar Boshqaruvi
- Kompyuterlar ro'yxatini olish
- Xodimlarni kompyuterga biriktirish/ajratish
- Kompyuter ma'lumotlarini yangilash

### 2. Log Yig'ish va Boshqarish
- Real-time log yig'ish
- Filter va qidirish
- Pagination
- Export qilish

### 3. AI-powered Analysis
- Log pattern recognition
- Anomaly detection
- Performance analytics

## 🚀 API Endpoints

### Kompyuterlar
```typescript
GET    /computers                    # Barcha kompyuterlar ro'yxati
PATCH  /computers/:device/employee  # Xodimni biriktirish/ajratish
```

### Loglar
```typescript
GET    /computers/:device/logs      # Device bo'yicha loglar
GET    /applications                # Barcha ilovalar ro'yxati
GET    /applications/:name          # Ilova nomi bo'yicha
```

### Public Endpoints
```typescript
GET    /public/computers            # Ommaviy kompyuter ma'lumotlari
```

## 📊 Ma'lumotlar sxemasi

### Computer Schema
```typescript
export class Computer {
  _id: ObjectId;
  name: string;                     // Kompyuter nomi (unique)
  assignedEmployeeId?: ObjectId;    // Biriktirilgan xodim
  deviceRealName?: string;          // Haqiqiy device nomi
  createdAt: Date;
  updatedAt: Date;
}
```

### Log Schema
```typescript
export class Log {
  _id: ObjectId;
  device: string;                   // Kompyuter nomi
  action: string;                   # Amal turi
  application: string;              # Ilova nomi
  time: Date;                       # Vaqt
  path?: string;                    # Fayl yo'li
  link?: string;                    # Havola
  createdAt: Date;
  updatedAt: Date;
}
```

## 🔍 Log Filter va Qidirish

### Query Parameters
```typescript
export class GetLogsQueryDto {
  application?: string;             // Ilova nomi
  action?: string;                  # Amal turi
  from?: string;                    # Boshlang'ich sana
  to?: string;                      # Tugash sana
  page?: number;                    # Sahifa raqami
  limit?: number;                   # Sahifa hajmi
  sortBy?: 'time' | 'device' | 'application' | 'action';
  order?: 'asc' | 'desc';          # Tartib
}
```

### Filter Examples
```typescript
// Chrome ilovasi loglari
GET /computers/PC-001/logs?application=chrome

// Bugungi loglar
GET /computers/PC-001/logs?from=2025-01-15&to=2025-01-15

// Pagination bilan
GET /computers/PC-001/logs?page=1&limit=50

// Vaqt bo'yicha tartiblash
GET /computers/PC-001/logs?sortBy=time&order=desc
```

## 🤖 AI Service Funksionalligi

### Log Pattern Recognition
```typescript
// Anomaly detection
async detectAnomalies(deviceId: string, timeRange: DateRange) {
  // Log patternlarni tahlil qilish
  // Oddiy bo'lmagan faoliyatni aniqlash
}
```

### Performance Analytics
```typescript
// Kompyuter ishlash statistikasi
async getPerformanceMetrics(deviceId: string) {
  // CPU, RAM, Disk usage
  // Application performance
  // User activity patterns
}
```

### Predictive Analysis
```typescript
// Kelajakdagi muammolarni bashorat qilish
async predictIssues(deviceId: string) {
  // Log trendlarni tahlil qilish
  // Potential problems identification
}
```

## 🔐 Xavfsizlik va Ruxsatlar

### Role-based Access
```typescript
// Xodimni biriktirish - faqat ADMIN va HR
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN, UserRole.HR)
@Patch('computers/:device/employee')
assignEmployee() { ... }

// Loglarni ko'rish - barcha autentifikatsiya qilingan foydalanuvchilar
@UseGuards(JwtAuthGuard)
@Get('computers/:device/logs')
getLogs() { ... }
```

### Data Validation
- Input sanitization
- SQL injection prevention
- XSS protection
- Rate limiting

## 📈 Log Analytics va Hisobotlar

### 1. Device Performance
- Application usage statistics
- User activity patterns
- System resource utilization

### 2. Security Monitoring
- Suspicious activities
- Unauthorized access attempts
- Data breach detection

### 3. Compliance Reporting
- Audit trails
- Regulatory compliance
- Data retention policies

## 🔄 Real-time Log Collection

### WebSocket Integration
```typescript
// Real-time log streaming
@WebSocketGateway()
export class LogsGateway {
  @SubscribeMessage('subscribe_logs')
  handleSubscribeLogs(client: Socket, deviceId: string) {
    // Device loglarini real-time yuborish
  }
}
```

### Event-driven Architecture
```typescript
// Log event handling
@EventPattern('log.created')
async handleLogCreated(data: LogCreatedEvent) {
  // Yangi log yaratilganda
  // Real-time updates
  // Analytics processing
}
```

## 🗄️ Ma'lumotlar bazasi optimizatsiyasi

### Indexes
```typescript
// Performance optimization
LogSchema.index({ device: 1 });
LogSchema.index({ application: 1 });
LogSchema.index({ action: 1 });
LogSchema.index({ time: -1 });     // Date range queries
LogSchema.index({ device: 1, time: -1 }); // Compound index
```

### Aggregation Pipelines
```typescript
// Complex queries optimization
async getLogsWithAggregation(deviceId: string, query: GetLogsQueryDto) {
  const pipeline = [
    { $match: { device: deviceId } },
    { $sort: { time: -1 } },
    { $skip: (query.page - 1) * query.limit },
    { $limit: query.limit }
  ];
  
  return this.logModel.aggregate(pipeline);
}
```

## 📊 Monitoring va Alerting

### System Health Checks
```typescript
// Kompyuter status monitoring
async checkDeviceHealth(deviceId: string) {
  const lastLog = await this.getLastLog(deviceId);
  const isOnline = this.isDeviceOnline(lastLog);
  
  if (!isOnline) {
    await this.sendAlert(`Device ${deviceId} is offline`);
  }
}
```

### Performance Thresholds
```typescript
// Performance monitoring
async monitorPerformance(deviceId: string) {
  const metrics = await this.getPerformanceMetrics(deviceId);
  
  if (metrics.cpuUsage > 90) {
    await this.sendAlert(`High CPU usage on ${deviceId}`);
  }
}
```

## 🧪 Testing

### Unit Tests
```bash
npm run test src/computers/
```

### Integration Tests
```bash
npm run test:e2e
```

### Performance Tests
```bash
# Load testing
npm run test:load

# Memory usage testing
npm run test:memory
```

## 🔧 Configuration

### Environment Variables
```env
# Log Collection
LOG_COLLECTION_INTERVAL=5000ms
LOG_RETENTION_DAYS=90
LOG_BATCH_SIZE=100

# AI Service
AI_MODEL_PATH=./models/log-analysis
AI_CONFIDENCE_THRESHOLD=0.8

# Performance
LOG_QUERY_TIMEOUT=30000ms
MAX_LOG_RESULTS=10000
```

## 📚 Foydali havolalar

- [NestJS Controllers](https://docs.nestjs.com/controllers)
- [MongoDB Aggregation](https://docs.mongodb.com/manual/aggregation/)
- [WebSocket Implementation](https://docs.nestjs.com/websockets/gateways)
- [Event-driven Architecture](https://docs.nestjs.com/microservices/events)

## 🔮 Kelajakdagi rivojlantirish

### 1. Advanced AI Features
- Machine learning models
- Predictive maintenance
- Behavioral analysis

### 2. Real-time Dashboard
- Live monitoring
- Interactive charts
- Custom alerts

### 3. Integration Capabilities
- SIEM systems
- ITSM platforms
- Cloud monitoring

---

**Eslatma:** Bu modul production environment uchun tayyorlangan va enterprise-level monitoring standartlariga mos keladi.
