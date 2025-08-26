/* eslint-disable @typescript-eslint/no-unsafe-return */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class AssignEmployeeDto {
  @ApiProperty({
    description: 'Employee ID to assign. Send null to unassign',
    required: false,
    type: String,
    nullable: true,
    example: '665a9c7e2f4d3b1a2c9e8f77',
  })
  @IsOptional()
  @Transform(({ value }) =>
    value === null || value === '' ? undefined : value,
  )
  @IsMongoId()
  employeeId?: string | null;

  @ApiPropertyOptional({
    description: 'Kompyuterning haqiqiy nomi (ko‘rinadigan nom)',
    required: false,
    type: String,
    nullable: true,
    example: 'Reception PC',
  })
  @IsOptional()
  @Transform(({ value }) =>
    value === null || value === '' ? undefined : value,
  )
  @IsString()
  deviceRealName?: string | null;
}
