import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AttendanceType } from '../schemas/attendance.schema';

export class LocationDto {
  @ApiProperty({ description: 'Latitude koordinatasi', example: 41.3111 })
  @IsNumber()
  @IsNotEmpty()
  latitude: number;

  @ApiProperty({ description: 'Longitude koordinatasi', example: 69.2797 })
  @IsNumber()
  @IsNotEmpty()
  longitude: number;

  @ApiPropertyOptional({ description: 'Manzil', example: 'Toshkent sh., Yunusobod tumani' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'GPS aniqligi', example: 5.0 })
  @IsOptional()
  @IsNumber()
  accuracy?: number;
}

export class CheckInOutDto {
  @ApiProperty({ description: 'Xodim ID', example: '507f1f77bcf86cd799439011' })
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @ApiProperty({ description: 'GPS koordinatalari' })
  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  @ApiPropertyOptional({ description: 'Qurilma ma\'lumoti', example: 'iPhone 15' })
  @IsOptional()
  @IsString()
  device?: string;

  @ApiPropertyOptional({ description: 'Izohlar', example: 'Ofisga kirish' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class AttendanceResponseDto {
  @ApiProperty({ description: 'Attendance ID' })
  id: string;

  @ApiProperty({ description: 'Xodim ID' })
  employeeId: string;

  @ApiProperty({ description: 'Xodim to\'liq ismi' })
  employeeName: string;

  @ApiProperty({ description: 'Kirish yoki chiqish vaqti' })
  timestamp: Date;

  @ApiProperty({ description: 'Turi: in yoki out', enum: AttendanceType })
  type: AttendanceType;

  @ApiProperty({ description: 'Status' })
  status: string;

  @ApiProperty({ description: 'GPS koordinatalari' })
  location: LocationDto;

  @ApiProperty({ description: 'Qurilma' })
  device?: string;

  @ApiProperty({ description: 'Izohlar' })
  notes?: string;

  @ApiProperty({ description: 'Warning bormi' })
  hasWarning: boolean;

  @ApiProperty({ description: 'Yaratilgan vaqt' })
  createdAt: Date;
}

export class AttendanceQueryDto {
  @ApiPropertyOptional({ description: 'Xodim ID', example: '507f1f77bcf86cd799439011' })
  @IsOptional()
  @IsString()
  employeeId?: string;

  @ApiPropertyOptional({ description: 'Boshlang\'ich sana', example: '2025-01-01' })
  @IsOptional()
  @IsString()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'Tugash sana', example: '2025-01-31' })
  @IsOptional()
  @IsString()
  toDate?: string;

  @ApiPropertyOptional({ description: 'Turi', enum: AttendanceType })
  @IsOptional()
  @IsEnum(AttendanceType)
  type?: AttendanceType;

  @ApiPropertyOptional({ description: 'Sahifa raqami', example: 1 })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ description: 'Sahifa hajmi', example: 20 })
  @IsOptional()
  @IsNumber()
  limit?: number;
}

export class AttendanceStatisticsDto {
  @ApiProperty({ description: 'Jami kirishlar' })
  totalCheckIns: number;

  @ApiProperty({ description: 'Jami chiqishlar' })
  totalCheckOuts: number;

  @ApiProperty({ description: 'Ish vaqti (soat)' })
  totalWorkHours: number;

  @ApiProperty({ description: 'O\'rtacha ish vaqti (soat)' })
  averageWorkHours: number;

  @ApiProperty({ description: 'Kechikishlar soni' })
  lateCount: number;

  @ApiProperty({ description: 'Erta chiqishlar soni' })
  earlyCount: number;

  @ApiProperty({ description: 'Overtime soni' })
  overtimeCount: number;

  @ApiProperty({ description: 'Warninglar soni' })
  warningCount: number;
}
