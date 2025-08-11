import { ApiProperty } from '@nestjs/swagger';

export class AddLogDto {
  @ApiProperty({ example: 'open', description: 'Action type' })
  action: string;

  @ApiProperty({ example: 'pc1', description: 'Device name' })
  device: string;

  @ApiProperty({ example: 'chrome', description: 'Application name' })
  application: string;

  @ApiProperty({
    example: '2025-08-11T12:00:00Z',
    description: 'Full ISO date',
  })
  time: string;
}
