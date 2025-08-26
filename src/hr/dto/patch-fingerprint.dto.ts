import { ApiProperty } from '@nestjs/swagger';
import { IsBase64, IsNotEmpty } from 'class-validator';

export class PatchFingerprintDto {
  @ApiProperty({ description: 'AS608 template in base64 format' })
  @IsNotEmpty()
  @IsBase64()
  template: string;
} 