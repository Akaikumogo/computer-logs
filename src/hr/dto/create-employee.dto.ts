import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsNumber,
  IsIn,
  Matches,
  IsArray,
  ArrayMinSize,
} from 'class-validator';

export class CreateEmployeeDto {
  @ApiProperty({ example: 'Sarvarbek Xazratov' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: 'Frontend Developer' })
  @IsString()
  @IsNotEmpty()
  position: string;

  @ApiProperty({ example: 'IT Department' })
  @IsString()
  @IsNotEmpty()
  department: string;

  @ApiProperty({ example: '2025-01-15', required: false })
  @IsOptional()
  @IsDateString()
  hireDate?: Date;

  @ApiProperty({ example: '2005-09-18', required: false })
  @IsOptional()
  @IsDateString()
  birthDate?: Date;

  @ApiProperty({ example: 'AA1234567', required: false })
  @IsOptional()
  @IsString()
  passportId?: string;

  @ApiProperty({ example: ['+998901234567', '+998933334455'] })
  @IsArray()
  @ArrayMinSize(1)
  @Matches(/^\+998[0-9]{9}$/, {
    each: true,
    message: 'Telefon +998 formatida bo‘lishi kerak',
  })
  phones: string[];

  @ApiProperty({ example: 'test@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Toshkent sh., Yunusobod tumani', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: 500, required: false })
  @IsOptional()
  @IsNumber()
  salary?: number;

  @ApiProperty({
    example: 'active',
    enum: ['active', 'inactive'],
    required: false,
  })
  @IsOptional()
  @IsIn(['active', 'inactive'])
  status?: 'active' | 'inactive';

  @ApiProperty({ example: ['file1.png', 'file2.pdf'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  files?: string[];
}
