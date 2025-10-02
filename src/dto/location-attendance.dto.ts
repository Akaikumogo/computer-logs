import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { AttendanceType, AttendanceStatus } from '../schemas/attendance.schema';

export class LocationCheckInDto {
  @ApiProperty({ 
    description: 'Location ID yoki nomi', 
    example: '64f1a2b3c4d5e6f7g8h9i0j1' 
  })
  @IsString()
  @IsNotEmpty()
  locationIdOrName: string;

  @ApiProperty({ 
    description: 'Barmoq raqami', 
    example: '12345' 
  })
  @IsString()
  @IsNotEmpty()
  fingerprintNumber: string;

  @ApiProperty({ 
    description: 'GPS latitude', 
    example: 41.311081 
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ 
    description: 'GPS longitude', 
    example: 69.240562 
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiPropertyOptional({ 
    description: 'Manzil', 
    example: 'Toshkent sh., Yunusobod tumani' 
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ 
    description: 'GPS aniqligi (metr)', 
    example: 5 
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  accuracy?: number;

  @ApiPropertyOptional({ 
    description: 'Qurilma nomi', 
    example: 'iPhone 12' 
  })
  @IsOptional()
  @IsString()
  device?: string;

  @ApiPropertyOptional({ 
    description: 'Izoh', 
    example: 'Kechikish sababi: transport muammosi' 
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ 
    description: 'Rasm (base64)', 
    example: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...' 
  })
  @IsOptional()
  @IsString()
  image?: string;
}

export class LocationCheckOutDto {
  @ApiProperty({ 
    description: 'Location ID yoki nomi', 
    example: '64f1a2b3c4d5e6f7g8h9i0j1' 
  })
  @IsString()
  @IsNotEmpty()
  locationIdOrName: string;

  @ApiProperty({ 
    description: 'Barmoq raqami', 
    example: '12345' 
  })
  @IsString()
  @IsNotEmpty()
  fingerprintNumber: string;

  @ApiProperty({ 
    description: 'GPS latitude', 
    example: 41.311081 
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ 
    description: 'GPS longitude', 
    example: 69.240562 
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiPropertyOptional({ 
    description: 'Manzil', 
    example: 'Toshkent sh., Yunusobod tumani' 
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ 
    description: 'GPS aniqligi (metr)', 
    example: 5 
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  accuracy?: number;

  @ApiPropertyOptional({ 
    description: 'Qurilma nomi', 
    example: 'iPhone 12' 
  })
  @IsOptional()
  @IsString()
  device?: string;

  @ApiPropertyOptional({ 
    description: 'Izoh', 
    example: 'Erta ketish sababi: shifokor qabuli' 
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ 
    description: 'Rasm (base64)', 
    example: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...' 
  })
  @IsOptional()
  @IsString()
  image?: string;
}

export class LocationAttendanceResponseDto {
  @ApiProperty({ description: 'Attendance ID' })
  id: string;

  @ApiProperty({ description: 'Xodim ID' })
  employeeId: string;

  @ApiProperty({ description: 'Xodim to\'liq ismi' })
  employeeName: string;

  @ApiProperty({ description: 'Xodim lavozimi' })
  employeePosition: string;

  @ApiProperty({ description: 'Xodim bo\'limi' })
  employeeDepartment: string;

  @ApiProperty({ description: 'Location ID' })
  locationId: string;

  @ApiProperty({ description: 'Location nomi' })
  locationName: string;

  @ApiProperty({ description: 'Vaqt' })
  timestamp: Date;

  @ApiProperty({ description: 'Turi', enum: AttendanceType })
  type: AttendanceType;

  @ApiProperty({ description: 'Holati', enum: AttendanceStatus })
  status: AttendanceStatus;

  @ApiProperty({ description: 'GPS ma\'lumotlari' })
  location: {
    latitude: number;
    longitude: number;
    address?: string;
    accuracy?: number;
  };

  @ApiPropertyOptional({ description: 'Barmoq raqami' })
  fingerprintNumber?: string;

  @ApiPropertyOptional({ description: 'Qurilma' })
  device?: string;

  @ApiPropertyOptional({ description: 'Izoh' })
  notes?: string;

  @ApiPropertyOptional({ description: 'Rasm URL' })
  imageUrl?: string;

  @ApiProperty({ description: 'Ogohlantirish bor' })
  hasWarning: boolean;

  @ApiPropertyOptional({ description: 'Ogohlantirish sababi' })
  warningReason?: string;

  @ApiProperty({ description: 'Yaratilgan vaqt' })
  createdAt: Date;

  @ApiProperty({ description: 'Yangilangan vaqt' })
  updatedAt: Date;
}

export class LocationAttendanceQueryDto {
  @ApiPropertyOptional({ description: 'Location ID' })
  @IsOptional()
  @IsString()
  locationId?: string;

  @ApiPropertyOptional({ description: 'Xodim ID' })
  @IsOptional()
  @IsString()
  employeeId?: string;

  @ApiPropertyOptional({ description: 'Barmoq raqami' })
  @IsOptional()
  @IsString()
  fingerprintNumber?: string;

  @ApiPropertyOptional({ description: 'Turi', enum: AttendanceType })
  @IsOptional()
  @IsEnum(AttendanceType)
  type?: AttendanceType;

  @ApiPropertyOptional({ description: 'Holati', enum: AttendanceStatus })
  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;

  @ApiPropertyOptional({ description: 'Boshlanish sanasi', example: '2024-01-01' })
  @IsOptional()
  @IsString()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'Tugash sanasi', example: '2024-01-31' })
  @IsOptional()
  @IsString()
  toDate?: string;

  @ApiPropertyOptional({ description: 'Sahifa raqami', example: 1 })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ description: 'Sahifa hajmi', example: 20 })
  @IsOptional()
  @IsNumber()
  limit?: number;
}

export class LocationEmployeeAssignmentDto {
  @ApiProperty({ description: 'Xodim ID' })
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @ApiProperty({ description: 'Location ID' })
  @IsString()
  @IsNotEmpty()
  locationId: string;
}

export class LocationDetailResponseDto {
  @ApiProperty({ description: 'Location ma\'lumotlari' })
  location: {
    id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    radius: number;
    isActive: boolean;
    description?: string;
    hasWifi?: boolean;
    wifiName?: string;
    wifiPassword?: string;
    responsiblePerson?: string;
    responsiblePersonPhone?: string;
    responsiblePersonEmail?: string;
    workingHours?: string;
    contactInfo?: string;
    images?: string[];
    facilities?: string[];
    createdAt: Date;
    updatedAt: Date;
  };

  @ApiProperty({ description: 'Location\'da ishlaydigan xodimlar' })
  employees: Array<{
    id: string;
    fullName: string;
    position: string;
    department: string;
    tabRaqami: string;
    status: string;
    assignedAt: Date;
  }>;

  @ApiProperty({ description: 'Bugungi davomat statistikasi' })
  todayAttendance: {
    totalEmployees: number;
    checkedIn: number;
    checkedOut: number;
    absent: number;
    late: number;
    early: number;
  };

  @ApiProperty({ description: 'Oxirgi 7 kunlik davomat' })
  weeklyAttendance: Array<{
    date: string;
    checkedIn: number;
    checkedOut: number;
    absent: number;
  }>;
}
