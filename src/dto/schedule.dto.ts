import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsDateString,
  IsBoolean,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum AttendanceStatus {
  PRESENT = 'present',
  LATE = 'late',
  ABSENT = 'absent',
  HALF_DAY = 'half-day',
  NORMAL = 'normal',
  EARLY = 'early',
  OVERTIME = 'overtime',
  WARNING = 'warning',
}

export enum AttendanceType {
  CHECKIN = 'checkin',
  CHECKOUT = 'checkout',
  IN = 'in',
  OUT = 'out',
}

export class LocationDto {
  @ApiProperty({ description: 'GPS latitude', example: 41.311081 })
  @IsNumber()
  latitude: number;

  @ApiProperty({ description: 'GPS longitude', example: 69.240562 })
  @IsNumber()
  longitude: number;

  @ApiPropertyOptional({
    description: 'Manzil',
    example: 'Toshkent sh., Yunusobod tumani',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'GPS aniqligi', example: 10 })
  @IsOptional()
  @IsNumber()
  accuracy?: number;
}

export class CheckInDto {
  @ApiProperty({ description: 'Xodim ID', example: '507f1f77bcf86cd799439011' })
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @ApiProperty({
    description: 'Turi',
    enum: AttendanceType,
    example: AttendanceType.CHECKIN,
  })
  @IsEnum(AttendanceType)
  type: AttendanceType;

  @ApiProperty({ description: 'Location nomi', example: 'Bosh Ofis' })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiPropertyOptional({
    description: "Qurilma ma'lumoti",
    example: 'iPhone 15',
  })
  @IsOptional()
  @IsString()
  device?: string;

  @ApiPropertyOptional({ description: 'Izohlar', example: 'Ishga keldim' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CheckOutDto {
  @ApiProperty({ description: 'Xodim ID', example: '507f1f77bcf86cd799439011' })
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @ApiProperty({
    description: 'Turi',
    enum: AttendanceType,
    example: AttendanceType.CHECKOUT,
  })
  @IsEnum(AttendanceType)
  type: AttendanceType;

  @ApiProperty({ description: 'Location nomi', example: 'Bosh Ofis' })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiPropertyOptional({
    description: "Qurilma ma'lumoti",
    example: 'iPhone 15',
  })
  @IsOptional()
  @IsString()
  device?: string;

  @ApiPropertyOptional({ description: 'Izohlar', example: 'Ishdan chiqdim' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class FingerAttendanceDto {
  @ApiProperty({ description: 'Barmoq raqami', example: '12345' })
  @IsString()
  @IsNotEmpty()
  fingerNumber: string;

  @ApiProperty({ description: 'Location nomi', example: 'Bosh Ofis' })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiPropertyOptional({
    description: "Qurilma ma'lumoti",
    example: 'Fingerprint Scanner',
  })
  @IsOptional()
  @IsString()
  device?: string;

  @ApiPropertyOptional({
    description: 'Izohlar',
    example: 'Barmoq orqali kirish',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class TodayAttendanceDto {
  @ApiProperty({ description: 'Attendance ID' })
  id: string;

  @ApiProperty({ description: 'Xodim ID' })
  employeeId: string;

  @ApiProperty({ description: 'Sana', example: '2025-01-15' })
  date: string;

  @ApiPropertyOptional({ description: 'Kirish vaqti', example: '08:30' })
  checkInTime?: string;

  @ApiPropertyOptional({ description: 'Chiqish vaqti', example: '17:30' })
  checkOutTime?: string;

  @ApiProperty({ description: 'Status', enum: AttendanceStatus })
  status: AttendanceStatus;

  @ApiPropertyOptional({ description: 'Jami soatlar', example: 8.5 })
  totalHours?: number;

  @ApiPropertyOptional({ description: 'Jami ish soatlari', example: 8.0 })
  totalWorkHours?: number;

  @ApiProperty({ description: 'Kirish qilinganmi' })
  isCheckedIn: boolean;

  @ApiProperty({ description: 'Chiqish qilinganmi' })
  isCheckedOut: boolean;

  @ApiProperty({ description: 'Kirishlar soni' })
  checkIns: number;

  @ApiProperty({ description: 'Chiqishlar soni' })
  checkOuts: number;
}

export class DashboardStatsDto {
  @ApiProperty({ description: 'Jami xodimlar soni' })
  totalEmployees: number;

  @ApiProperty({ description: 'Bugun ishga kelganlar' })
  presentToday: number;

  @ApiProperty({ description: 'Bugun kechikkanlar' })
  lateToday: number;

  @ApiProperty({ description: 'Bugun kelmaganlar' })
  absentToday: number;

  @ApiProperty({ description: "O'rtacha kirish vaqti", example: '08:25' })
  averageCheckInTime: string;

  @ApiProperty({ description: 'Davomat foizi' })
  attendanceRate: number;

  @ApiProperty({ description: 'Bugungi kirishlar' })
  todayCheckIns: number;

  @ApiProperty({ description: 'Bugungi chiqishlar' })
  todayCheckOuts: number;

  @ApiProperty({ description: 'Warninglar soni' })
  warningsCount: number;

  @ApiProperty({ description: 'Kechikishlar soni' })
  lateCount: number;

  @ApiProperty({ description: 'Jami ish soatlari' })
  totalWorkHours: number;
}

export class AttendanceSummaryDto {
  @ApiProperty({ description: 'Sana', example: '2025-01-15' })
  date: string;

  @ApiProperty({ description: 'Jami xodimlar' })
  totalEmployees: number;

  @ApiProperty({ description: 'Ishga kelganlar' })
  present: number;

  @ApiProperty({ description: 'Kechikkanlar' })
  late: number;

  @ApiProperty({ description: 'Kelmaganlar' })
  absent: number;

  @ApiProperty({ description: 'Davomat foizi' })
  attendanceRate: number;
}

export class AttendanceFilterDto {
  @ApiPropertyOptional({
    description: "Boshlang'ich sana",
    example: '2025-01-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Tugash sana', example: '2025-01-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Xodim ID',
    example: '507f1f77bcf86cd799439011',
  })
  @IsOptional()
  @IsString()
  employeeId?: string;

  @ApiPropertyOptional({ description: 'Status', enum: AttendanceStatus })
  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;

  @ApiPropertyOptional({
    description: "Bo'lim ID",
    example: '507f1f77bcf86cd799439012',
  })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({ description: 'Location nomi' })
  @IsOptional()
  @IsString()
  locationName?: string;

  @ApiPropertyOptional({ description: 'Natijalar soni', example: 50 })
  @IsOptional()
  @IsNumber()
  limit?: number;
}

export class DailyScheduleDto {
  @ApiProperty({ description: 'Sana', example: '2025-01-15' })
  date: string;

  @ApiProperty({ description: "Xodimlar ro'yxati" })
  employees: {
    employeeId: string;
    name: string;
    logs: {
      type: AttendanceType;
      hour: number;
      minute: number;
      time: string; // HH:MM formatida
      timestamp: string;
      location?: LocationDto; // GPS koordinatalari
    }[];
  }[];
}

export class MonthlyScheduleDto {
  @ApiProperty({ description: 'Yil', example: 2025 })
  year: number;

  @ApiProperty({ description: 'Oy', example: 1 })
  month: number;

  @ApiProperty({ description: "Kunlik ma'lumotlar" })
  dailyData: AttendanceSummaryDto[];
}

export class YearlyScheduleDto {
  @ApiProperty({ description: 'Yil', example: 2025 })
  year: number;

  @ApiProperty({ description: "Oylik ma'lumotlar" })
  monthlyData: {
    month: number;
    monthName: string;
    totalEmployees: number;
    present: number;
    late: number;
    absent: number;
    attendanceRate: number;
  }[];
}

export class EmployeeAttendanceDto {
  @ApiProperty({ description: 'Xodim ID' })
  employeeId: string;

  @ApiProperty({ description: "Xodim to'liq ismi" })
  name: string;

  @ApiProperty({ description: "Bo'lim" })
  department: string;

  @ApiProperty({ description: 'Lavozim' })
  position: string;

  @ApiProperty({ description: "Attendance ma'lumotlari" })
  attendance: {
    id: string;
    date: string;
    checkInTime?: string;
    checkOutTime?: string;
    status: AttendanceStatus;
    type: AttendanceType;
    timestamp: string;
    location?: {
      latitude: number;
      longitude: number;
      address?: string;
    };
    device?: string;
    notes?: string;
    hasWarning?: boolean;
    warningReason?: string;
    warningTimestamp?: string;
    createdAt: string;
    updatedAt: string;
  }[];
}
