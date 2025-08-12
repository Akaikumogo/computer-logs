/* eslint-disable @typescript-eslint/no-unsafe-call */
import { ApiProperty } from '@nestjs/swagger';
import { IsISO8601, IsNotEmpty, IsString } from 'class-validator';

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
}
