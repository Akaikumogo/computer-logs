import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UploadExcelDto {
  @ApiProperty({
    description: 'Excel file to upload',
    type: 'string',
    format: 'binary',
  })
  file: Express.Multer.File;

  @ApiProperty({
    description: 'Optional note about the upload',
    required: false,
    example: 'Employee data import from HR system',
  })
  @IsOptional()
  @IsString()
  note?: string;
}

export class ExcelUploadResponseDto {
  @ApiProperty({
    description: 'Upload processing result',
    example: 'success',
  })
  status: string;

  @ApiProperty({
    description: 'Number of departments created',
    example: 5,
  })
  departmentsCreated: number;

  @ApiProperty({
    description: 'Number of positions created',
    example: 12,
  })
  positionsCreated: number;

  @ApiProperty({
    description: 'Number of employees created',
    example: 45,
  })
  employeesCreated: number;

  @ApiProperty({
    description: 'Number of employees skipped (duplicates)',
    example: 3,
  })
  employeesSkipped: number;

  @ApiProperty({
    description: 'Processing errors if any',
    type: [String],
    example: ['Row 5: Invalid email format', 'Row 12: Missing required field'],
  })
  errors: string[];

  @ApiProperty({
    description: 'Processing summary',
    example: 'Successfully imported 45 employees, 5 departments, and 12 positions',
  })
  message: string;
}
