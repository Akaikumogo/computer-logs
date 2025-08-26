import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class UploadFileDto {
  @ApiProperty({ type: String })
  filename: string;

  @ApiProperty({ type: String })
  originalname: string;

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  mimetype?: string;

  @ApiProperty({ type: Number, required: false })
  @IsOptional()
  size?: number;
}

export class UploadFilesArrayDto {
  @ApiProperty({ type: [UploadFileDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UploadFileDto)
  files?: UploadFileDto[];
}
