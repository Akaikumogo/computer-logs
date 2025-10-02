import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  Max,
  IsEmail,
  IsArray,
} from 'class-validator';

export class CreateLocationDto {
  @ApiProperty({ description: 'Location nomi', example: 'Bosh Ofis' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Manzil',
    example: 'Toshkent sh., Yunusobod tumani',
  })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ description: 'GPS latitude', example: 41.311081 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ description: 'GPS longitude', example: 69.240562 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiPropertyOptional({
    description: 'Radius (metr)',
    example: 100,
    default: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(1000)
  radius?: number;

  @ApiPropertyOptional({ description: 'Tavsif', example: 'Asosiy ofis binosi' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Faol', example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  // 🔹 WiFi ma'lumotlari
  @ApiPropertyOptional({ description: 'WiFi mavjudligi', example: true })
  @IsOptional()
  @IsBoolean()
  hasWifi?: boolean;

  @ApiPropertyOptional({ description: 'WiFi nomi', example: 'Office_WiFi' })
  @IsOptional()
  @IsString()
  wifiName?: string;

  @ApiPropertyOptional({ description: 'WiFi paroli', example: 'office123' })
  @IsOptional()
  @IsString()
  wifiPassword?: string;

  // 🔹 Javobgar shaxs
  @ApiPropertyOptional({ description: 'Javobgar shaxs', example: 'Ahmad Karimov' })
  @IsOptional()
  @IsString()
  responsiblePerson?: string;

  @ApiPropertyOptional({ description: 'Javobgar shaxs telefoni', example: '+998901234567' })
  @IsOptional()
  @IsString()
  responsiblePersonPhone?: string;

  @ApiPropertyOptional({ description: 'Javobgar shaxs email', example: 'ahmad@company.com' })
  @IsOptional()
  @IsEmail()
  responsiblePersonEmail?: string;

  // 🔹 Qo'shimcha ma'lumotlar
  @ApiPropertyOptional({ description: 'Ish vaqtlari', example: '9:00-18:00' })
  @IsOptional()
  @IsString()
  workingHours?: string;

  @ApiPropertyOptional({ description: 'Aloqa ma\'lumotlari', example: '+998901234567' })
  @IsOptional()
  @IsString()
  contactInfo?: string;

  @ApiPropertyOptional({ description: 'Rasmlar', example: ['image1.jpg', 'image2.jpg'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ description: 'Imkoniyatlar', example: ['Parking', 'Cafeteria'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  facilities?: string[];
}

export class UpdateLocationDto {
  @ApiPropertyOptional({ description: 'Location nomi', example: 'Bosh Ofis' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({
    description: 'Manzil',
    example: 'Toshkent sh., Yunusobod tumani',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  address?: string;

  @ApiPropertyOptional({ description: 'GPS latitude', example: 41.311081 })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ description: 'GPS longitude', example: 69.240562 })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({ description: 'Radius (metr)', example: 100 })
  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(1000)
  radius?: number;

  @ApiPropertyOptional({ description: 'Tavsif', example: 'Asosiy ofis binosi' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Faol', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  // 🔹 WiFi ma'lumotlari
  @ApiPropertyOptional({ description: 'WiFi mavjudligi', example: true })
  @IsOptional()
  @IsBoolean()
  hasWifi?: boolean;

  @ApiPropertyOptional({ description: 'WiFi nomi', example: 'Office_WiFi' })
  @IsOptional()
  @IsString()
  wifiName?: string;

  @ApiPropertyOptional({ description: 'WiFi paroli', example: 'office123' })
  @IsOptional()
  @IsString()
  wifiPassword?: string;

  // 🔹 Javobgar shaxs
  @ApiPropertyOptional({ description: 'Javobgar shaxs', example: 'Ahmad Karimov' })
  @IsOptional()
  @IsString()
  responsiblePerson?: string;

  @ApiPropertyOptional({ description: 'Javobgar shaxs telefoni', example: '+998901234567' })
  @IsOptional()
  @IsString()
  responsiblePersonPhone?: string;

  @ApiPropertyOptional({ description: 'Javobgar shaxs email', example: 'ahmad@company.com' })
  @IsOptional()
  @IsEmail()
  responsiblePersonEmail?: string;

  // 🔹 Qo'shimcha ma'lumotlar
  @ApiPropertyOptional({ description: 'Ish vaqtlari', example: '9:00-18:00' })
  @IsOptional()
  @IsString()
  workingHours?: string;

  @ApiPropertyOptional({ description: 'Aloqa ma\'lumotlari', example: '+998901234567' })
  @IsOptional()
  @IsString()
  contactInfo?: string;

  @ApiPropertyOptional({ description: 'Rasmlar', example: ['image1.jpg', 'image2.jpg'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ description: 'Imkoniyatlar', example: ['Parking', 'Cafeteria'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  facilities?: string[];
}

export class LocationResponseDto {
  @ApiProperty({ description: 'Location ID' })
  id: string;

  @ApiProperty({ description: 'Location nomi' })
  name: string;

  @ApiProperty({ description: 'Manzil' })
  address: string;

  @ApiProperty({ description: 'GPS latitude' })
  latitude: number;

  @ApiProperty({ description: 'GPS longitude' })
  longitude: number;

  @ApiProperty({ description: 'Radius (metr)' })
  radius: number;

  @ApiProperty({ description: 'Faol' })
  isActive: boolean;

  @ApiPropertyOptional({ description: 'Tavsif' })
  description?: string;

  // 🔹 WiFi ma'lumotlari
  @ApiPropertyOptional({ description: 'WiFi mavjudligi' })
  hasWifi?: boolean;

  @ApiPropertyOptional({ description: 'WiFi nomi' })
  wifiName?: string;

  @ApiPropertyOptional({ description: 'WiFi paroli' })
  wifiPassword?: string;

  // 🔹 Javobgar shaxs
  @ApiPropertyOptional({ description: 'Javobgar shaxs' })
  responsiblePerson?: string;

  @ApiPropertyOptional({ description: 'Javobgar shaxs telefoni' })
  responsiblePersonPhone?: string;

  @ApiPropertyOptional({ description: 'Javobgar shaxs email' })
  responsiblePersonEmail?: string;

  // 🔹 Qo'shimcha ma'lumotlar
  @ApiPropertyOptional({ description: 'Ish vaqtlari' })
  workingHours?: string;

  @ApiPropertyOptional({ description: 'Aloqa ma\'lumotlari' })
  contactInfo?: string;

  @ApiPropertyOptional({ description: 'Rasmlar' })
  images?: string[];

  @ApiPropertyOptional({ description: 'Imkoniyatlar' })
  facilities?: string[];

  @ApiProperty({ description: 'Yaratilgan vaqt' })
  createdAt: Date;

  @ApiProperty({ description: 'Yangilangan vaqt' })
  updatedAt: Date;
}

export class LocationQueryDto {
  @ApiPropertyOptional({ description: 'Faol locationlar', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Sahifa raqami', example: 1 })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ description: 'Sahifa hajmi', example: 20 })
  @IsOptional()
  @IsNumber()
  limit?: number;

  @ApiPropertyOptional({ description: 'Qidiruv matni' })
  @IsOptional()
  @IsString()
  search?: string;
}
