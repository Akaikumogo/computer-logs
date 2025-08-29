/* eslint-disable quotes */
import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ComputersService } from './computers.service';
import { AddLogDto } from '../dto/add-logs.dto';

@ApiTags('Public Computers')
@Controller()
export class PublicComputersController {
  constructor(private readonly computersService: ComputersService) {}
  @Post('enrich-all')
  @ApiOperation({
    summary: 'Barcha ilovalarni enrich qilish',
    description: 'Faqat ADMIN xodimlar bu funksiyani ishlata oladi',
  })
  @ApiResponse({ status: 200, description: 'Barcha ilovalar enrich qilindi' })
  @ApiResponse({ status: 403, description: "Ruxsat yo'q - faqat ADMIN" })
  async enrichAll() {
    return this.computersService.enrichAllApplications();
  }
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
