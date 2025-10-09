import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ScheduleService } from './schedule.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Worker Schedule Management')
@Controller('worker/schedule')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WorkerScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Get('yearly/:year')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Yillik ish jadvali',
    description: 'Belgilangan yil uchun xodimning yillik ish jadvali va davomat ma\'lumotlari',
  })
  @ApiParam({ 
    name: 'year', 
    description: 'Yil (masalan: 2025)', 
    example: 2025 
  })
  @ApiQuery({
    name: 'employeeId',
    required: true,
    description: 'Xodim ID',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Yillik jadval ma\'lumotlari muvaffaqiyatli olindi' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Xodim topilmadi' 
  })
  async getWorkerYearlySchedule(
    @Param('year') year: number,
    @Query('employeeId') employeeId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    return this.scheduleService.getWorkerYearlySchedule(year, employeeId);
  }

  @Get('monthly/:year/:month')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Oylik ish jadvali',
    description: 'Belgilangan oy uchun xodimning oylik ish jadvali va davomat ma\'lumotlari',
  })
  @ApiParam({ 
    name: 'year', 
    description: 'Yil (masalan: 2025)', 
    example: 2025 
  })
  @ApiParam({ 
    name: 'month', 
    description: 'Oy (1-12)', 
    example: 10 
  })
  @ApiQuery({
    name: 'employeeId',
    required: true,
    description: 'Xodim ID',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Oylik jadval ma\'lumotlari muvaffaqiyatli olindi' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Xodim topilmadi' 
  })
  async getWorkerMonthlySchedule(
    @Param('year') year: number,
    @Param('month') month: number,
    @Query('employeeId') employeeId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    return this.scheduleService.getWorkerMonthlySchedule(year, month, employeeId);
  }

  @Get('daily/:date')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Kunlik ish jadvali',
    description: 'Belgilangan kun uchun xodimning kunlik ish jadvali va davomat ma\'lumotlari',
  })
  @ApiParam({ 
    name: 'date', 
    description: 'Sana (YYYY-MM-DD formatida)', 
    example: '2025-10-15' 
  })
  @ApiQuery({
    name: 'employeeId',
    required: true,
    description: 'Xodim ID',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Kunlik jadval ma\'lumotlari muvaffaqiyatli olindi' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Xodim topilmadi' 
  })
  async getWorkerDailySchedule(
    @Param('date') date: string,
    @Query('employeeId') employeeId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    return this.scheduleService.getWorkerDailySchedule(date, employeeId);
  }
}
