import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsMongoId,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export class GetAllFingerprintsQueryDto {
  @ApiPropertyOptional({ description: 'Page number (>=1)', default: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page (unlimited)',
    default: 20,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Include template data in response',
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeTemplate?: boolean = false;

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: ['active', 'revoked'],
  })
  @IsOptional()
  @IsIn(['active', 'revoked'])
  status?: 'active' | 'revoked';

  @ApiPropertyOptional({ description: 'Filter by employeeId' })
  @IsOptional()
  @IsMongoId()
  employeeId?: string;
}
