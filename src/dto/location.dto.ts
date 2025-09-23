import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  Max,
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
