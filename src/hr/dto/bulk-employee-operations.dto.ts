import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  IsIn,
} from 'class-validator';
import { IsMongoId as IsMongoIdArray } from 'class-validator';

export class BulkUpdateEmployeesDto {
  @ApiProperty({
    description: 'Array of employee IDs to update',
    example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
    type: [String],
  })
  @IsArray()
  @IsMongoIdArray({ each: true })
  employeeIds: string[];

  @ApiPropertyOptional({
    description: 'New status for all selected employees',
    enum: ['active', 'inactive'],
    example: 'active',
  })
  @IsOptional()
  @IsEnum(['active', 'inactive'])
  status?: 'active' | 'inactive';

  @ApiPropertyOptional({
    description: 'New department for all selected employees',
    example: 'IT Department',
  })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({
    description: 'New position for all selected employees',
    example: 'Developer',
  })
  @IsOptional()
  @IsString()
  position?: string;
}

export class BulkDeleteEmployeesDto {
  @ApiProperty({
    description: 'Array of employee IDs to soft delete',
    example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
    type: [String],
  })
  @IsArray()
  @IsMongoIdArray({ each: true })
  employeeIds: string[];

  @ApiPropertyOptional({
    description: 'Reason for deletion',
    example: 'Company restructuring',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class BulkRestoreEmployeesDto {
  @ApiProperty({
    description: 'Array of soft-deleted employee IDs to restore',
    example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
    type: [String],
  })
  @IsArray()
  @IsMongoIdArray({ each: true })
  employeeIds: string[];
}

export class BulkPasswordResetDto {
  @ApiProperty({
    description: 'Array of employee IDs to reset passwords for',
    example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
    type: [String],
  })
  @IsArray()
  @IsMongoIdArray({ each: true })
  employeeIds: string[];

  @ApiPropertyOptional({
    description: 'Note about the password reset',
    example: 'Security policy update',
  })
  @IsOptional()
  @IsString()
  note?: string;
}
