# 🏢 Workplaces Module - Batafsil Ma'lumot

## 📋 Modul haqida umumiy ma'lumot

Workplaces moduli tashkilotdagi ish joylarini, bo'limlarni va filiallarni boshqarish uchun yaratilgan. Bu modul hierarchical structure va flexible workplace management imkoniyatlarini ta'minlaydi.

## 🏗️ Modul strukturasi

```
src/workplaces/
├── workplaces.module.ts            # Asosiy modul
├── workplaces.controller.ts        # API endpointlari
└── workplaces.service.ts           # Business logic
```

## 🔧 Asosiy funksionallik

### 1. Workplace CRUD Operatsiyalari
- Yangi workplace yaratish
- Workplace ma'lumotlarini yangilash
- Workplace o'chirish
- Workplace ma'lumotlarini ko'rish

### 2. Hierarchical Structure
- Parent-child relationships
- Department organization
- Branch management
- Team structure

### 3. Search va Filter
- Text-based search
- Type filtering
- Status filtering
- Pagination

### 4. Employee Assignment
- Xodimlarni workplace ga biriktirish
- Primary workplace designation
- Workplace transfer

## 🚀 API Endpoints

### Workplace Management
```typescript
POST   /workplaces                  # Yangi workplace yaratish
GET    /workplaces                  # Workplace ro'yxati
GET    /workplaces/:id              # Workplace ma'lumotlari
PATCH  /workplaces/:id              # Workplace yangilash
```

### Search va Filter
```typescript
GET    /workplaces?search=query     # Workplace qidirish
GET    /workplaces?type=department  # Type bo'yicha filter
GET    /workplaces?status=active    # Status bo'yicha filter
GET    /workplaces?page=1&limit=20  # Pagination
```

## 📊 Ma'lumotlar sxemasi

### Workplace Schema
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
  contactInfo?: {                   # Aloqa ma'lumotlari
    phone?: string;
    email?: string;
    website?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### Enums
```typescript
export enum WorkplaceType {
  DEPARTMENT = 'department',         // Bo'lim
  BRANCH = 'branch',                # Filial
  OFFICE = 'office',                # Ofis
  TEAM = 'team',                    # Jamoa
  LOCATION = 'location',            # Joylashuv
}

export enum WorkplaceStatus {
  ACTIVE = 'active',                // Faol
  INACTIVE = 'inactive',            # Faol emas
  MAINTENANCE = 'maintenance',      # Ta'mirlash
  CLOSED = 'closed',                # Yopiq
}
```

## 🔄 Workplace Yaratish Jarayoni

### Process Flow
```typescript
async create(createWorkplaceDto: CreateWorkplaceDto): Promise<Workplace> {
  // 1. Validation
  await this.validateWorkplaceData(createWorkplaceDto);
  
  // 2. Parent workplace tekshirish
  if (createWorkplaceDto.parentId) {
    await this.validateParentWorkplace(createWorkplaceDto.parentId);
  }
  
  // 3. Workplace yaratish
  const workplace = await this.workplaceModel.create({
    ...createWorkplaceDto,
    children: [],
    status: WorkplaceStatus.ACTIVE
  });
  
  // 4. Parent workplace ga child qo'shish
  if (createWorkplaceDto.parentId) {
    await this.addChildToParent(
      createWorkplaceDto.parentId,
      workplace._id
    );
  }
  
  return workplace;
}
```

### Validation
```typescript
private async validateWorkplaceData(dto: CreateWorkplaceDto): Promise<void> {
  // Name validation
  if (!dto.name || dto.name.trim().length < 2) {
    throw new BadRequestException('Workplace nomi kamida 2 belgi bo\'lishi kerak');
  }
  
  // Code validation (agar berilgan bo'lsa)
  if (dto.code) {
    const existingWorkplace = await this.workplaceModel.findOne({ code: dto.code });
    if (existingWorkplace) {
      throw new BadRequestException('Bu kod allaqachon mavjud');
    }
  }
  
  // Type validation
  if (!Object.values(WorkplaceType).includes(dto.type)) {
    throw new BadRequestException('Noto\'g\'ri workplace turi');
  }
}
```

## 🔍 Workplace Qidirish va Filter

### Advanced Search
```typescript
async getAll(
  page: number = 1,
  limit: number = 20,
  search?: string,
  status?: WorkplaceStatus,
  type?: WorkplaceType
): Promise<{ workplaces: Workplace[]; pagination: any }> {
  const filter: any = {};
  
  // Text search
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } },
      { address: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }
  
  // Status filter
  if (status) {
    filter.status = status;
  }
  
  // Type filter
  if (type) {
    filter.type = type;
  }
  
  // Pagination
  const skip = (page - 1) * limit;
  
  const [workplaces, total] = await Promise.all([
    this.workplaceModel.find(filter)
      .populate('parentId', 'name type')
      .populate('managerId', 'fullName email')
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit),
    this.workplaceModel.countDocuments(filter)
  ]);
  
  return {
    workplaces,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
}
```

### Hierarchical Search
```typescript
async getHierarchicalStructure(): Promise<any> {
  const workplaces = await this.workplaceModel.find({ status: WorkplaceStatus.ACTIVE })
    .populate('parentId', 'name type')
    .populate('managerId', 'fullName email')
    .sort({ type: 1, name: 1 });
  
  return this.buildHierarchy(workplaces);
}

private buildHierarchy(workplaces: Workplace[]): any[] {
  const workplaceMap = new Map();
  const roots: any[] = [];
  
  // Map yaratish
  workplaces.forEach(workplace => {
    workplaceMap.set(workplace._id.toString(), {
      ...workplace.toObject(),
      children: []
    });
  });
  
  // Parent-child relationships
  workplaces.forEach(workplace => {
    if (workplace.parentId) {
      const parent = workplaceMap.get(workplace.parentId.toString());
      if (parent) {
        parent.children.push(workplaceMap.get(workplace._id.toString()));
      }
    } else {
      roots.push(workplaceMap.get(workplace._id.toString()));
    }
  });
  
  return roots;
}
```

## 🔗 Parent-Child Relationships

### Child Qo'shish
```typescript
async addChildToParent(parentId: string, childId: string): Promise<void> {
  const parent = await this.workplaceModel.findById(parentId);
  if (!parent) {
    throw new NotFoundException('Parent workplace topilmadi');
  }
  
  // Parent ga child qo'shish
  if (!parent.children.includes(childId)) {
    parent.children.push(childId);
    await parent.save();
  }
}
```

### Child O'chirish
```typescript
async removeChildFromParent(parentId: string, childId: string): Promise<void> {
  const parent = await this.workplaceModel.findById(parentId);
  if (!parent) {
    throw new NotFoundException('Parent workplace topilmadi');
  }
  
  // Parent dan child ni o'chirish
  parent.children = parent.children.filter(id => id.toString() !== childId);
  await parent.save();
}
```

### Subtree Olish
```typescript
async getSubtree(workplaceId: string): Promise<any[]> {
  const workplace = await this.workplaceModel.findById(workplaceId);
  if (!workplace) {
    throw new NotFoundException('Workplace topilmadi');
  }
  
  const subtree: any[] = [];
  await this.buildSubtree(workplace, subtree);
  
  return subtree;
}

private async buildSubtree(workplace: Workplace, subtree: any[]): Promise<void> {
  subtree.push({
    _id: workplace._id,
    name: workplace.name,
    type: workplace.type,
    status: workplace.status
  });
  
  for (const childId of workplace.children) {
    const child = await this.workplaceModel.findById(childId);
    if (child) {
      await this.buildSubtree(child, subtree);
    }
  }
}
```

## 📊 Workplace Statistikasi

### General Statistics
```typescript
async getWorkplaceStatistics(): Promise<any> {
  const stats = await this.workplaceModel.aggregate([
    { $group: {
      _id: null,
      totalWorkplaces: { $sum: 1 },
      activeWorkplaces: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
      inactiveWorkplaces: { $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] } }
    }},
    { $project: {
      _id: 0,
      totalWorkplaces: 1,
      activeWorkplaces: 1,
      inactiveWorkplaces: 1
    }}
  ]);
  
  const typeStats = await this.workplaceModel.aggregate([
    { $group: {
      _id: '$type',
      count: { $sum: 1 },
      activeCount: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } }
    }},
    { $sort: { count: -1 } }
  ]);
  
  return {
    ...stats[0],
    typeStats,
    hierarchicalLevels: await this.getHierarchicalLevels()
  };
}
```

### Employee Distribution
```typescript
async getEmployeeDistribution(): Promise<any> {
  const distribution = await this.workplaceModel.aggregate([
    { $lookup: {
      from: 'employees',
      localField: '_id',
      foreignField: 'primaryWorkplaceId',
      as: 'employees'
    }},
    { $project: {
      name: 1,
      type: 1,
      employeeCount: { $size: '$employees' },
      capacity: 1,
      utilization: {
        $cond: [
          { $gt: ['$capacity', 0] },
          { $multiply: [{ $divide: [{ $size: '$employees' }, '$capacity'] }, 100] },
          0
        ]
      }
    }},
    { $sort: { employeeCount: -1 } }
  ]);
  
  return distribution;
}
```

## 🔄 Workplace Yangilash

### Update Process
```typescript
async update(id: string, updateWorkplaceDto: UpdateWorkplaceDto): Promise<Workplace> {
  const workplace = await this.workplaceModel.findById(id);
  if (!workplace) {
    throw new NotFoundException('Workplace topilmadi');
  }
  
  // Parent ID o'zgargan bo'lsa
  if (updateWorkplaceDto.parentId && updateWorkplaceDto.parentId !== workplace.parentId?.toString()) {
    // Eski parent dan child ni o'chirish
    if (workplace.parentId) {
      await this.removeChildFromParent(workplace.parentId.toString(), id);
    }
    
    // Yangi parent ga child ni qo'shish
    await this.addChildToParent(updateWorkplaceDto.parentId, id);
  }
  
  // Workplace ni yangilash
  const updatedWorkplace = await this.workplaceModel.findByIdAndUpdate(
    id,
    updateWorkplaceDto,
    { new: true, runValidators: true }
  );
  
  return updatedWorkplace;
}
```

### Status Update
```typescript
async updateStatus(id: string, status: WorkplaceStatus): Promise<Workplace> {
  const workplace = await this.workplaceModel.findById(id);
  if (!workplace) {
    throw new NotFoundException('Workplace topilmadi');
  }
  
  // Status o'zgarishini tekshirish
  if (status === WorkplaceStatus.CLOSED) {
    // Child workplaces mavjud bo'lsa
    if (workplace.children.length > 0) {
      throw new BadRequestException('Child workplaces mavjud bo\'lgan workplace ni yopib bo\'lmaydi');
    }
    
    // Employee lar mavjud bo'lsa
    const employeeCount = await this.getEmployeeCount(id);
    if (employeeCount > 0) {
      throw new BadRequestException('Employee lar mavjud bo\'lgan workplace ni yopib bo\'lmaydi');
    }
  }
  
  return this.workplaceModel.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  );
}
```

## 🗄️ Ma'lumotlar bazasi optimizatsiyasi

### Indexes
```typescript
// Performance optimization
WorkplaceSchema.index({ name: 1 });
WorkplaceSchema.index({ code: 1 }, { sparse: true });
WorkplaceSchema.index({ type: 1 });
WorkplaceSchema.index({ status: 1 });
WorkplaceSchema.index({ parentId: 1 });
WorkplaceSchema.index({ managerId: 1 });
WorkplaceSchema.index({ name: 'text', description: 'text' }); // Text search
```

### Aggregation Optimization
```typescript
async getWorkplaceHierarchy(): Promise<any> {
  return this.workplaceModel.aggregate([
    { $match: { status: WorkplaceStatus.ACTIVE } },
    { $lookup: {
      from: 'workplaces',
      localField: '_id',
      foreignField: 'parentId',
      as: 'children'
    }},
    { $lookup: {
      from: 'employees',
      localField: '_id',
      foreignField: 'primaryWorkplaceId',
      as: 'employees'
    }},
    { $project: {
      name: 1,
      type: 1,
      children: 1,
      employeeCount: { $size: '$employees' }
    }},
    { $sort: { name: 1 } }
  ]);
}
```

## 🔐 Xavfsizlik va Ruxsatlar

### Role-based Access Control
```typescript
// Workplace yaratish - faqat ADMIN va HR
@Post()
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN, UserRole.HR)
async create() { ... }

// Workplace yangilash - faqat ADMIN va HR
@Patch(':id')
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN, UserRole.HR)
async update() { ... }

// Workplace ko'rish - barcha autentifikatsiya qilingan foydalanuvchilar
@Get()
@UseGuards(JwtAuthGuard)
async getAll() { ... }
```

### Data Validation
- Name validation
- Code uniqueness
- Parent-child relationship validation
- Status transition validation

## 🧪 Testing

### Unit Tests
```bash
npm run test src/workplaces/
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
# Workplaces Module
WORKPLACE_MAX_NAME_LENGTH=100
WORKPLACE_MAX_CODE_LENGTH=20
WORKPLACE_MAX_HIERARCHY_LEVELS=5
WORKPLACE_DEFAULT_STATUS=active

# Validation
WORKPLACE_NAME_MIN_LENGTH=2
WORKPLACE_CODE_PATTERN=^[A-Z0-9_-]+$
```

## 📚 Foydali havolalar

- [NestJS Controllers](https://docs.nestjs.com/controllers)
- [MongoDB Aggregation](https://docs.mongodb.com/manual/aggregation/)
- [Hierarchical Data Models](https://docs.mongodb.com/manual/applications/data-models-tree-structures/)
- [Tree Structures](https://en.wikipedia.org/wiki/Tree_(data_structure))

## 🔮 Kelajakdagi rivojlantirish

### 1. Advanced Features
- Geographic mapping
- Floor plan management
- Resource allocation
- Capacity planning

### 2. Integration
- HRIS systems
- Facility management
- Space planning tools
- Asset management

### 3. Analytics
- Space utilization
- Employee density
- Cost analysis
- Performance metrics

---

**Eslatma:** Bu modul production environment uchun tayyorlangan va enterprise-level workplace management standartlariga mos keladi.
