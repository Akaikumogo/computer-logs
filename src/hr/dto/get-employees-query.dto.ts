import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsNumber,
  IsDateString,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class GetEmployeesQueryDto {
  @ApiPropertyOptional({
    description:
      'Search query for full name, position, department, tab raqami, or passport ID',
    example: 'developer',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Employee status filter',
    enum: ['active', 'inactive'],
    example: 'active',
    required: false,
  })
  @IsOptional()
  @IsEnum(['active', 'inactive'])
  status?: 'active' | 'inactive';

  @ApiPropertyOptional({
    description: 'Department filter',
    example: 'IT Department',
    required: false,
  })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({
    description: 'Position filter',
    example: 'Frontend Developer',
    required: false,
  })
  @IsOptional()
  @IsString()
  position?: string;

  @ApiPropertyOptional({
    description: 'Hire date from (YYYY-MM-DD)',
    example: '2024-01-01',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  hireDateFrom?: string;

  @ApiPropertyOptional({
    description: 'Hire date to (YYYY-MM-DD)',
    example: '2025-01-01',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  hireDateTo?: string;

  @ApiPropertyOptional({
    description: 'Birth date from (YYYY-MM-DD)',
    example: '1980-01-01',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  birthDateFrom?: string;

  @ApiPropertyOptional({
    description: 'Birth date to (YYYY-MM-DD)',
    example: '2000-01-01',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  birthDateTo?: string;

  @ApiPropertyOptional({
    description: 'Salary range from',
    example: 1000,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  salaryFrom?: number;

  @ApiPropertyOptional({
    description: 'Salary range to',
    example: 5000,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  salaryTo?: number;

  @ApiPropertyOptional({
    description: 'Has user account filter',
    example: true,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  hasUserAccount?: boolean;

  @ApiPropertyOptional({
    description: 'Has workplace assigned filter',
    example: true,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  hasWorkplace?: boolean;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    default: 1,
    minimum: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 20,
    default: 20,
    minimum: 1,
    maximum: 100,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Sort field',
    enum: [
      'fullName',
      'position',
      'department',
      'tabRaqami',
      'hireDate',
      'birthDate',
      'salary',
      'createdAt',
      'updatedAt',
    ],
    example: 'fullName',
    default: 'createdAt',
    required: false,
  })
  @IsOptional()
  @IsEnum([
    'fullName',
    'position',
    'department',
    'tabRaqami',
    'hireDate',
    'birthDate',
    'salary',
    'createdAt',
    'updatedAt',
  ])
  sortBy?:
    | 'fullName'
    | 'position'
    | 'department'
    | 'tabRaqami'
    | 'hireDate'
    | 'birthDate'
    | 'salary'
    | 'createdAt'
    | 'updatedAt' = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    example: 'desc',
    default: 'desc',
    required: false,
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({
    description: 'Include soft-deleted employees',
    example: false,
    default: false,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  includeDeleted?: boolean = false;
}
