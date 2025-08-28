import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ComputersService } from './computers.service';
import { AddLogDto } from '../dto/add-logs.dto';

@ApiTags('Public Computers')
@Controller()
export class PublicComputersController {
  constructor(private readonly computersService: ComputersService) {}

  @Post('add-log')
  @ApiOperation({
    summary: "Log qo'shish (device va application avtomatik yaratish)",
    description: 'Public endpoint - authentication talab qilmaydi',
  })
  @ApiResponse({ status: 201, description: 'Log yaratildi' })
  addLog(@Body() body: AddLogDto) {
    return this.computersService.addLog(body);
  }
}
