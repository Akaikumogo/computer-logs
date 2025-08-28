import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class AddLogDto {
  @ApiProperty({ example: 'open', description: 'Action type' })
  @IsString()
  @IsNotEmpty()
  action: string;

  @ApiProperty({ example: 'pc1', description: 'Device name' })
  @IsString()
  @IsNotEmpty()
  device: string;

  @ApiProperty({ example: 'chrome', description: 'Application name' })
  @IsString()
  @IsNotEmpty()
  application: string;

  @ApiProperty({
    example: '2025-08-11T12:00:00Z',
    description: 'Full ISO date',
  })
  @IsISO8601()
  time: string;

  @ApiPropertyOptional({
    description: 'File path related to the log',
    nullable: true,
    default: null,
    example: null,
  })
  @IsOptional()
  @Transform(({ value }) =>
    value === null || value === '' ? undefined : value,
  )
  @IsString()
  path?: string | null;

  @ApiPropertyOptional({
    description: 'Related URL',
    nullable: true,
    default: null,
    example: null,
  })
  @IsOptional()
  @Transform(({ value }) =>
    value === null || value === '' ? undefined : value,
  )
  @IsUrl({ require_protocol: true }, { message: 'Link must be a valid URL' })
  link?: string | null;
}
