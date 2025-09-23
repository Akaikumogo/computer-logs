import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsDateString,
  IsNumber,
  IsIn,
  IsArray,
  IsString as IsStringArray,
  Min,
  IsMongoId,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class UpdateEmployeeDto {
  @ApiPropertyOptional({
    description: 'Employee full name',
    example: 'Sarvarbek Xazratov',
    required: false,
  })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({
    description: 'Employee position',
    example: 'Frontend Developer',
    required: false,
  })
  @IsOptional()
  @IsString()
  position?: string;

  @ApiPropertyOptional({
    description: 'Employee department',
    example: 'IT Department',
    required: false,
  })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({
    description: 'Employee table number',
    example: 'EMP001',
    required: false,
  })
  @IsOptional()
  @IsString()
  tabRaqami?: string;

  @ApiPropertyOptional({
    description: 'Hire date',
    example: '2025-01-15',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  hireDate?: Date;

  @ApiPropertyOptional({
    description: 'Birth date',
    example: '2005-09-18',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  birthDate?: Date;

  @ApiPropertyOptional({
    description: 'Passport ID',
    example: 'AA1234567',
    required: false,
  })
  @IsOptional()
  @IsString()
  passportId?: string;

  @ApiPropertyOptional({
    description: 'Phone numbers array',
    example: ['+998901234567', '+998933334455'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsStringArray({ each: true })
  phones?: string[];

  @ApiPropertyOptional({
    description: 'Address',
    example: 'Toshkent sh., Yunusobod tumani',
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    description: 'Salary amount',
    example: 500,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  salary?: number;

  @ApiPropertyOptional({
    description: 'Employee status',
    enum: ['active', 'inactive'],
    example: 'active',
    required: false,
  })
  @IsOptional()
  @IsIn(['active', 'inactive'])
  status?: 'active' | 'inactive';

  @ApiPropertyOptional({
    description: 'Associated files',
    example: ['file1.png', 'file2.pdf'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsStringArray({ each: true })
  files?: string[];

  @ApiPropertyOptional({
    description: 'Primary workplace ID',
    example: '507f1f77bcf86cd799439011',
    required: false,
  })
  @IsOptional()
  @IsMongoId()
  primaryWorkplaceId?: string;

  @ApiPropertyOptional({
    description: 'User account ID',
    example: '507f1f77bcf86cd799439012',
    required: false,
  })
  @IsOptional()
  @IsMongoId()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Username for user account',
    example: 'sarvarbek.xazratov',
    required: false,
  })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({
    description: 'Temporary password',
    example: 'tempPass123',
    required: false,
  })
  @IsOptional()
  @IsString()
  tempPassword?: string;

  @ApiPropertyOptional({
    description: 'Barmoq raqami',
    example: '12345',
    required: false,
  })
  @IsOptional()
  @IsString()
  fingerNumber?: string;
}
