# 📁 Upload Module - Batafsil Ma'lumot

## 📋 Modul haqida umumiy ma'lumot

Upload moduli fayllarni yuklash, saqlash va boshqarish uchun yaratilgan. Bu modul rasm, hujjat va boshqa fayl turlarini xavfsiz saqlash va ularga access control qilish imkoniyatlarini ta'minlaydi.

## 🏗️ Modul strukturasi

```
src/upload/
├── upload.module.ts               # Asosiy modul
├── upload.controller.ts           # API endpointlari
├── upload.service.ts              # Business logic
├── dto/                          # Data Transfer Objects
└── entities/                     # Ma'lumotlar sxemalari
```

## 🔧 Asosiy funksionallik

### 1. Fayl Yuklash
- Rasm va hujjatlarni yuklash
- File type validation
- Size limit checking
- Virus scanning (optional)

### 2. Fayl Boshqaruvi
- Fayllarni ko'rish
- Fayl ma'lumotlarini yangilash
- Fayllarni o'chirish
- Access control

### 3. Xavfsizlik
- Role-based access control
- File type restrictions
- Size limitations
- Path traversal protection

## 🚀 API Endpoints

### File Upload
```typescript
POST   /upload                      # Fayl yuklash
```

### File Management
```typescript
GET    /upload                      # Fayllar ro'yxati
GET    /upload/:id                  # Faylni ko'rish/yuklab olish
DELETE /upload/:id                  # Faylni o'chirish
```

### Search va Filter
```typescript
GET    /upload?search=query        # Fayl qidirish
GET    /upload?page=1&limit=10     # Pagination
```

## 📊 Ma'lumotlar sxemasi

### Upload Schema
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
  createdAt: Date;
  updatedAt: Date;
}
```

## 🔐 Xavfsizlik va Ruxsatlar

### Role-based Access Control
```typescript
// Fayl yuklash - faqat ADMIN va HR
@Post()
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN, UserRole.HR)
@UseInterceptors(FileInterceptor('file'))
async uploadFile() { ... }

// Faylni o'chirish - faqat ADMIN
@Delete(':id')
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
async deleteFile() { ... }

// Fayllarni ko'rish - barcha autentifikatsiya qilingan foydalanuvchilar
@Get()
@UseGuards(JwtAuthGuard)
async getFiles() { ... }
```

### File Type Validation
```typescript
private validateFileType(mimetype: string): boolean {
  const allowedTypes = [
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    
    // Archives
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed'
  ];
  
  return allowedTypes.includes(mimetype);
}
```

### File Size Validation
```typescript
private validateFileSize(size: number): boolean {
  const maxSize = 10 * 1024 * 1024; // 10MB
  return size <= maxSize;
}
```

## 📁 Fayl Yuklash Jarayoni

### Process Flow
```typescript
async create(file: Express.Multer.File, user: any) {
  // 1. File validation
  if (!this.validateFileType(file.mimetype)) {
    throw new BadRequestException('Bu fayl turi ruxsat etilmagan');
  }
  
  if (!this.validateFileSize(file.size)) {
    throw new BadRequestException('Fayl hajmi juda katta');
  }
  
  // 2. Unique filename yaratish
  const filename = this.generateUniqueFilename(file.originalname);
  
  // 3. File path yaratish
  const filePath = path.join(process.cwd(), 'uploads', filename);
  
  // 4. Faylni saqlash
  await this.saveFile(file.buffer, filePath);
  
  // 5. Database record yaratish
  const upload = await this.uploadModel.create({
    originalName: file.originalname,
    filename: filename,
    mimetype: file.mimetype,
    size: file.size,
    path: filePath,
    url: `/upload/${filename}`,
    uploadedBy: user._id,
    isPublic: false,
    downloadCount: 0
  });
  
  return upload;
}
```

### Unique Filename Generation
```typescript
private generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = path.extname(originalName);
  const nameWithoutExt = path.basename(originalName, extension);
  
  return `${nameWithoutExt}_${timestamp}_${randomString}${extension}`;
}
```

### File Saving
```typescript
private async saveFile(buffer: Buffer, filePath: string): Promise<void> {
  try {
    // Uploads papkasini yaratish (agar mavjud bo'lmasa)
    const uploadsDir = path.dirname(filePath);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // Faylni saqlash
    await fs.promises.writeFile(filePath, buffer);
  } catch (error) {
    throw new InternalServerErrorException('Fayl saqlashda xatolik yuz berdi');
  }
}
```

## 🔍 Fayl Qidirish va Filter

### Search Implementation
```typescript
async findAll(page: number = 1, limit: number = 10, search?: string) {
  const filter: any = {};
  
  // Text search
  if (search) {
    filter.$or = [
      { originalName: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } }
    ];
  }
  
  // Pagination
  const skip = (page - 1) * limit;
  
  const [uploads, total] = await Promise.all([
    this.uploadModel.find(filter)
      .populate('uploadedBy', 'fullName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    this.uploadModel.countDocuments(filter)
  ]);
  
  return {
    uploads,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
}
```

### File Type Filtering
```typescript
async findByType(mimetype: string, page: number = 1, limit: number = 10) {
  const filter = { mimetype: { $regex: mimetype, $options: 'i' } };
  
  const skip = (page - 1) * limit;
  
  const [uploads, total] = await Promise.all([
    this.uploadModel.find(filter)
      .populate('uploadedBy', 'fullName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    this.uploadModel.countDocuments(filter)
  ]);
  
  return {
    uploads,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  };
}
```

## 📊 Fayl Statistikasi

### Upload Statistics
```typescript
async getUploadStatistics() {
  const stats = await this.uploadModel.aggregate([
    { $group: {
      _id: null,
      totalFiles: { $sum: 1 },
      totalSize: { $sum: '$size' },
      averageSize: { $avg: '$size' },
      fileTypes: { $addToSet: '$mimetype' }
    }},
    { $project: {
      _id: 0,
      totalFiles: 1,
      totalSize: 1,
      averageSize: { $round: ['$averageSize', 2] },
      fileTypes: 1
    }}
  ]);
  
  const typeStats = await this.uploadModel.aggregate([
    { $group: {
      _id: '$mimetype',
      count: { $sum: 1 },
      totalSize: { $sum: '$size' }
    }},
    { $sort: { count: -1 } }
  ]);
  
  return {
    ...stats[0],
    typeStats,
    recentUploads: await this.getRecentUploads(5)
  };
}
```

### User Upload Statistics
```typescript
async getUserUploadStats(userId: string) {
  const stats = await this.uploadModel.aggregate([
    { $match: { uploadedBy: new Types.ObjectId(userId) } },
    { $group: {
      _id: null,
      totalFiles: { $sum: 1 },
      totalSize: { $sum: '$size' },
      averageSize: { $avg: '$size' },
      downloadCount: { $sum: '$downloadCount' }
    }},
    { $project: {
      _id: 0,
      totalFiles: 1,
      totalSize: 1,
      averageSize: { $round: ['$averageSize', 2] },
      downloadCount: 1
    }}
  ]);
  
  return stats[0] || {
    totalFiles: 0,
    totalSize: 0,
    averageSize: 0,
    downloadCount: 0
  };
}
```

## 🗑️ Fayl O'chirish

### Soft Delete Implementation
```typescript
async delete(id: string): Promise<void> {
  const upload = await this.uploadModel.findById(id);
  
  if (!upload) {
    throw new NotFoundException('Fayl topilmadi');
  }
  
  try {
    // Physical file o'chirish
    if (fs.existsSync(upload.path)) {
      await fs.promises.unlink(upload.path);
    }
    
    // Database record o'chirish
    await this.uploadModel.findByIdAndDelete(id);
  } catch (error) {
    throw new InternalServerErrorException('Fayl o\'chirishda xatolik yuz berdi');
  }
}
```

### Bulk Delete
```typescript
async bulkDelete(ids: string[]): Promise<void> {
  const uploads = await this.uploadModel.find({ _id: { $in: ids } });
  
  for (const upload of uploads) {
    try {
      // Physical file o'chirish
      if (fs.existsSync(upload.path)) {
        await fs.promises.unlink(upload.path);
      }
    } catch (error) {
      console.error(`Error deleting file: ${upload.path}`, error);
    }
  }
  
  // Database records o'chirish
  await this.uploadModel.deleteMany({ _id: { $in: ids } });
}
```

## 🔄 Fayl Yangilash

### File Update
```typescript
async update(id: string, updateUploadDto: UpdateUploadDto): Promise<Upload> {
  const upload = await this.uploadModel.findById(id);
  
  if (!upload) {
    throw new NotFoundException('Fayl topilmadi');
  }
  
  // Update allowed fields
  const allowedFields = ['description', 'tags', 'isPublic'];
  const updateData: any = {};
  
  for (const field of allowedFields) {
    if (updateUploadDto[field] !== undefined) {
      updateData[field] = updateUploadDto[field];
    }
  }
  
  return this.uploadModel.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  );
}
```

## 📈 Performance Optimization

### File Streaming
```typescript
async streamFile(id: string, res: Response): Promise<void> {
  const upload = await this.uploadModel.findById(id);
  
  if (!upload) {
    throw new NotFoundException('Fayl topilmadi');
  }
  
  if (!fs.existsSync(upload.path)) {
    throw new NotFoundException('Fayl topilmadi');
  }
  
  // Download count oshirish
  await this.uploadModel.findByIdAndUpdate(id, {
    $inc: { downloadCount: 1 }
  });
  
  // File streaming
  const fileStream = fs.createReadStream(upload.path);
  
  res.setHeader('Content-Type', upload.mimetype);
  res.setHeader('Content-Disposition', `attachment; filename="${upload.originalName}"`);
  res.setHeader('Content-Length', upload.size.toString());
  
  fileStream.pipe(res);
}
```

### Caching Strategy
```typescript
@CacheKey('uploads')
@CacheTTL(300) // 5 daqiqa
async getCachedUploads(page: number, limit: number) {
  return this.findAll(page, limit);
}
```

## 🧪 Testing

### Unit Tests
```bash
npm run test src/upload/
```

### Integration Tests
```bash
npm run test:e2e
```

### File Upload Tests
```bash
# Test file upload
npm run test:upload

# Test file validation
npm run test:validation
```

## 🔧 Configuration

### Environment Variables
```env
# Upload Module
UPLOAD_MAX_FILE_SIZE=10485760
UPLOAD_ALLOWED_TYPES=image/*,application/pdf,application/msword
UPLOAD_STORAGE_PATH=./uploads
UPLOAD_PUBLIC_URL=/upload

# File Processing
ENABLE_IMAGE_COMPRESSION=true
ENABLE_VIRUS_SCANNING=false
IMAGE_QUALITY=80

# Security
UPLOAD_ENABLE_ANTI_VIRUS=false
UPLOAD_MAX_FILES_PER_REQUEST=5
```

### Multer Configuration
```typescript
// multer.config.ts
export const multerConfig = {
  storage: diskStorage({
    destination: './uploads',
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5 // Maximum 5 files
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.match(/\/(jpg|jpeg|png|gif|pdf|doc|docx|xls|xlsx)$/)) {
      cb(null, true);
    } else {
      cb(new Error('Bu fayl turi ruxsat etilmagan'), false);
    }
  }
};
```

## 📚 Foydali havolalar

- [NestJS File Upload](https://docs.nestjs.com/techniques/file-upload)
- [Multer Documentation](https://github.com/expressjs/multer)
- [File System Security](https://owasp.org/www-project-cheat-sheets/cheatsheets/File_Upload_Cheat_Sheet.html)
- [MIME Types](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types)

## 🔮 Kelajakdagi rivojlantirish

### 1. Advanced Features
- Cloud storage integration (AWS S3, Google Cloud)
- Image processing and optimization
- Video file support
- Document preview

### 2. Security Enhancements
- Virus scanning
- File encryption
- Digital signatures
- Access logs

### 3. Performance Improvements
- CDN integration
- File compression
- Lazy loading
- Progressive uploads

---

**Eslatma:** Bu modul production environment uchun tayyorlangan va enterprise-level file management standartlariga mos keladi.
