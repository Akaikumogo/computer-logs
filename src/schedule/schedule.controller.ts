/* eslint-disable quotes */
import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Body,
  HttpCode,
  HttpStatus,
  Put,
  Delete,
  Res,
  Sse,
  MessageEvent,
} from '@nestjs/common';
import { Response } from 'express';
import { ScheduleService } from './schedule.service';
import {
  CheckInDto,
  CheckOutDto,
  FingerAttendanceDto,
  AttendanceFilterDto,
} from '../dto/schedule.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { SkipAuth } from '../auth/decorators/skip-auth.decorator';
import { Observable, interval, map, switchMap, from } from 'rxjs';

@ApiTags('Schedule Management')
@Controller('schedule')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  // ==================== CHECK IN/OUT OPERATIONS ====================

  @Post('attendance/checkin')
  @ApiOperation({
    summary: 'Xodimning kirishini qayd qilish',
    description: 'Xodimning ishga kirishini qayd qiladi',
  })
  @ApiBody({ type: CheckInDto })
  @ApiResponse({
    status: 201,
    description: 'Kirish muvaffaqiyatli qayd qilindi',
  })
  @ApiResponse({ status: 404, description: 'Xodim topilmadi' })
  @ApiResponse({
    status: 400,
    description: 'Bugun allaqachon kirish qayd qilingan',
  })
  @HttpCode(HttpStatus.CREATED)
  async checkIn(@Body() checkInDto: CheckInDto) {
    return this.scheduleService.checkIn(checkInDto);
  }

  @Post('attendance/checkout')
  @ApiOperation({
    summary: 'Xodimning chiqishini qayd qilish',
    description: 'Xodimning ishdan chiqishini qayd qiladi',
  })
  @ApiBody({ type: CheckOutDto })
  @ApiResponse({
    status: 201,
    description: 'Chiqish muvaffaqiyatli qayd qilindi',
  })
  @ApiResponse({ status: 404, description: 'Xodim topilmadi' })
  @ApiResponse({
    status: 400,
    description: 'Bugun kirish qayd qilinmagan',
  })
  @HttpCode(HttpStatus.CREATED)
  async checkOut(@Body() checkOutDto: CheckOutDto) {
    return this.scheduleService.checkOut(checkOutDto);
  }

  @Post('attendance/checkinout')
  @SkipAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Barmoq izi orqali kirish/chiqish (Public)',
    description:
      'Barmoq izi skaner orqali kirish yoki chiqish qayd qiladi - autentifikatsiya talab qilinmaydi',
  })
  @ApiBody({ type: FingerAttendanceDto })
  @ApiResponse({
    status: 201,
    description: 'Barmoq izi muvaffaqiyatli qayd qilindi',
  })
  @ApiResponse({ status: 404, description: 'Barmoq izi topilmadi' })
  @ApiResponse({
    status: 400,
    description: "Barmoq izi noto'g'ri yoki xodim topilmadi",
  })
  @HttpCode(HttpStatus.CREATED)
  async fingerCheckInOut(@Body() fingerAttendanceDto: FingerAttendanceDto) {
    return this.scheduleService.fingerCheckInOut(fingerAttendanceDto);
  }

  // ==================== ATTENDANCE MANAGEMENT ====================

  @Get('attendance/today/:employeeId')
  @ApiOperation({
    summary: 'Bugungi davomat',
    description: "Xodimning bugungi davomat ma'lumotlari",
  })
  @ApiParam({ name: 'employeeId', description: 'Xodim ID si' })
  @ApiResponse({ status: 200, description: "Bugungi davomat ma'lumotlari" })
  @ApiResponse({ status: 404, description: 'Xodim topilmadi' })
  async getTodayAttendance(@Param('employeeId') employeeId: string) {
    return this.scheduleService.getTodayAttendance(employeeId);
  }

  @Get('attendance/employee/:employeeId')
  @ApiOperation({
    summary: 'Xodim davomat tarixi',
    description: 'Xodimning davomat tarixi',
  })
  @ApiParam({ name: 'employeeId', description: 'Xodim ID si' })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Boshlanish sanasi',
  })
  @ApiQuery({ name: 'endDate', required: false, description: 'Tugash sanasi' })
  @ApiQuery({ name: 'status', required: false, description: 'Davomat holati' })
  @ApiResponse({ status: 200, description: 'Davomat tarixi' })
  async getEmployeeAttendance(
    @Param('employeeId') employeeId: string,
    @Query() filters: AttendanceFilterDto,
  ) {
    return this.scheduleService.getEmployeeAttendance(employeeId, filters);
  }

  @Put('attendance/:id')
  @ApiOperation({
    summary: "Davomat ma'lumotlarini yangilash",
    description: "Davomat ma'lumotlarini yangilaydi",
  })
  @ApiParam({ name: 'id', description: 'Davomat ID si' })
  @ApiBody({ type: CheckInDto })
  @ApiResponse({ status: 200, description: 'Davomat yangilandi' })
  @ApiResponse({ status: 404, description: 'Davomat topilmadi' })
  async updateAttendance(
    @Param('id') id: string,
    @Body() updateData: CheckInDto,
  ) {
    return this.scheduleService.updateAttendance(id, updateData);
  }

  @Delete('attendance/:id')
  @ApiOperation({
    summary: "Davomat ma'lumotlarini o'chirish",
    description: "Davomat ma'lumotlarini o'chiradi",
  })
  @ApiParam({ name: 'id', description: 'Davomat ID si' })
  @ApiResponse({ status: 200, description: "Davomat o'chirildi" })
  @ApiResponse({ status: 404, description: 'Davomat topilmadi' })
  async deleteAttendance(@Param('id') id: string) {
    return this.scheduleService.deleteAttendance(id);
  }

  // ==================== SCHEDULE VIEWS ====================

  @Get('daily/:date')
  @ApiOperation({
    summary: 'Kunlik jadval',
    description:
      "Belgilangan kun uchun barcha xodimlarning attendance ma'lumotlari",
  })
  @ApiParam({ name: 'date', description: 'Sana (YYYY-MM-DD formatida)' })
  @ApiQuery({
    name: 'locationName',
    required: false,
    description: 'Location nomi',
  })
  @ApiResponse({ status: 200, description: "Kunlik jadval ma'lumotlari" })
  async getDailySchedule(
    @Param('date') date: string,
    @Query('locationName') locationName?: string,
  ) {
    return this.scheduleService.getDailySchedule(date, locationName);
  }

  @Get('monthly/:year/:month')
  @ApiOperation({
    summary: 'Oylik jadval',
    description:
      "Belgilangan oy uchun barcha xodimlarning attendance ma'lumotlari",
  })
  @ApiParam({ name: 'year', description: 'Yil' })
  @ApiParam({ name: 'month', description: 'Oy (1-12)' })
  @ApiQuery({
    name: 'locationName',
    required: false,
    description: 'Location nomi',
  })
  @ApiResponse({ status: 200, description: "Oylik jadval ma'lumotlari" })
  async getMonthlySchedule(
    @Param('year') year: number,
    @Param('month') month: number,
    @Query('locationName') locationName?: string,
  ) {
    return this.scheduleService.getMonthlySchedule(year, month, locationName);
  }

  @Get('yearly/:year')
  @ApiOperation({
    summary: 'Yillik jadval',
    description:
      "Belgilangan yil uchun barcha xodimlarning attendance ma'lumotlari",
  })
  @ApiParam({ name: 'year', description: 'Yil' })
  @ApiQuery({
    name: 'locationName',
    required: false,
    description: 'Location nomi',
  })
  @ApiResponse({ status: 200, description: "Yillik jadval ma'lumotlari" })
  async getYearlySchedule(
    @Param('year') year: number,
    @Query('locationName') locationName?: string,
  ) {
    return this.scheduleService.getYearlySchedule(year, locationName);
  }

  // ==================== REALTIME UPDATES ====================

  @Sse('realtime/updates')
  @ApiOperation({
    summary: 'Realtime yangilanishlar',
    description: 'Server-Sent Events orqali realtime yangilanishlar',
  })
  @ApiResponse({
    status: 200,
    description: 'Realtime yangilanishlar oqimi',
  })
  getRealtimeUpdates(
    @Query('locationName') locationName?: string,
  ): Observable<MessageEvent> {
    return interval(5000).pipe(
      map(() => {
        const data = {
          type: 'schedule_update',
          timestamp: new Date().toISOString(),
          locationName: locationName || 'all',
          message: 'Schedule data updated',
        };
        return { data: JSON.stringify(data) } as MessageEvent;
      }),
    );
  }

  @Sse('realtime/daily/:date')
  @ApiOperation({
    summary: 'Kunlik jadval realtime yangilanishlari',
    description: 'Belgilangan kun uchun realtime yangilanishlar',
  })
  @ApiParam({ name: 'date', description: 'Sana (YYYY-MM-DD formatida)' })
  @ApiQuery({
    name: 'locationName',
    required: false,
    description: 'Location nomi',
  })
  getDailyRealtimeUpdates(
    @Param('date') date: string,
    @Query('locationName') locationName?: string,
  ): Observable<MessageEvent> {
    return interval(10000).pipe(
      switchMap(() => {
        return from(
          this.scheduleService.getDailySchedule(date, locationName),
        ).pipe(
          map((scheduleData) => {
            const data = {
              type: 'daily_schedule_update',
              date,
              locationName: locationName || 'all',
              timestamp: new Date().toISOString(),
              data: scheduleData,
            };
            return { data: JSON.stringify(data) } as MessageEvent;
          }),
        );
      }),
    );
  }

  @Sse('realtime/monthly/:year/:month')
  @ApiOperation({
    summary: 'Oylik jadval realtime yangilanishlari',
    description: 'Belgilangan oy uchun realtime yangilanishlar',
  })
  @ApiParam({ name: 'year', description: 'Yil' })
  @ApiParam({ name: 'month', description: 'Oy (1-12)' })
  @ApiQuery({
    name: 'locationName',
    required: false,
    description: 'Location nomi',
  })
  getMonthlyRealtimeUpdates(
    @Param('year') year: number,
    @Param('month') month: number,
    @Query('locationName') locationName?: string,
  ): Observable<MessageEvent> {
    return interval(15000).pipe(
      switchMap(() => {
        return from(
          this.scheduleService.getMonthlySchedule(year, month, locationName),
        ).pipe(
          map((scheduleData) => {
            const data = {
              type: 'monthly_schedule_update',
              year,
              month,
              locationName: locationName || 'all',
              timestamp: new Date().toISOString(),
              data: scheduleData,
            };
            return { data: JSON.stringify(data) } as MessageEvent;
          }),
        );
      }),
    );
  }

  @Sse('realtime/yearly/:year')
  @ApiOperation({
    summary: 'Yillik jadval realtime yangilanishlari',
    description: 'Belgilangan yil uchun realtime yangilanishlar',
  })
  @ApiParam({ name: 'year', description: 'Yil' })
  @ApiQuery({
    name: 'locationName',
    required: false,
    description: 'Location nomi',
  })
  getYearlyRealtimeUpdates(
    @Param('year') year: number,
    @Query('locationName') locationName?: string,
  ): Observable<MessageEvent> {
    return interval(30000).pipe(
      switchMap(() => {
        return from(
          this.scheduleService.getYearlySchedule(year, locationName),
        ).pipe(
          map((scheduleData) => {
            const data = {
              type: 'yearly_schedule_update',
              year,
              locationName: locationName || 'all',
              timestamp: new Date().toISOString(),
              data: scheduleData,
            };
            return { data: JSON.stringify(data) } as MessageEvent;
          }),
        );
      }),
    );
  }

  // ==================== DASHBOARD & STATISTICS ====================

  @Get('dashboard/stats')
  @ApiOperation({
    summary: 'Dashboard statistikasi',
    description: 'Dashboard uchun umumiy statistika',
  })
  @ApiResponse({ status: 200, description: 'Dashboard statistikasi' })
  async getDashboardStats() {
    return this.scheduleService.getDashboardStats();
  }

  @Get('dashboard/summary')
  @ApiOperation({
    summary: 'Dashboard xulosa',
    description: "Dashboard uchun xulosa ma'lumotlari",
  })
  @ApiQuery({
    name: 'date',
    required: false,
    description: 'Sana (YYYY-MM-DD formatida)',
  })
  @ApiResponse({ status: 200, description: 'Dashboard xulosasi' })
  async getDashboardSummary(@Query('date') date?: string) {
    return this.scheduleService.getDashboardSummary(date);
  }

  @Get('dashboard/export/excel')
  @ApiOperation({
    summary: 'Excel fayl export',
    description: "Dashboard ma'lumotlarini Excel faylga export qilish",
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Boshlanish sanasi',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'Tugash sanasi',
  })
  @ApiResponse({
    status: 200,
    description: 'Excel fayl yuklab olindi',
    content: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
        schema: { type: 'string', format: 'binary' },
      },
    },
  })
  async exportExcel(
    @Res() res: Response,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const buffer = await this.scheduleService.exportExcel(startDate, endDate);
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=attendance.xlsx',
    });
    res.send(buffer);
  }

  @Get('dashboard/export/pdf')
  @ApiOperation({
    summary: 'PDF fayl export',
    description: "Dashboard ma'lumotlarini PDF faylga export qilish",
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Boshlanish sanasi',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'Tugash sanasi',
  })
  @ApiResponse({
    status: 200,
    description: 'PDF fayl yuklab olindi',
    content: {
      'application/pdf': {
        schema: { type: 'string', format: 'binary' },
      },
    },
  })
  async exportPdf(
    @Res() res: Response,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const buffer = await this.scheduleService.exportPdf(startDate, endDate);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename=attendance.pdf',
    });
    res.send(buffer);
  }

  // ==================== NEW: EXCEL EXPORTS ====================

  @Get('export/daily')
  @ApiOperation({
    summary: 'Kunlik Excel export',
    description:
      "Kun bo'yicha attendance ma'lumotlarini Excel formatida yuklab olish",
  })
  @ApiQuery({ name: 'date', required: true, description: 'Sana (YYYY-MM-DD)' })
  @ApiResponse({
    status: 200,
    description: 'Excel fayl',
    content: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
        schema: { type: 'string', format: 'binary' },
      },
    },
  })
  async exportDaily(@Res() res: Response, @Query('date') date: string) {
    const buffer = await this.scheduleService.exportDailyExcel(date);
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename=daily_${date}.xlsx`,
    });
    res.send(buffer);
  }

  @Get('export/monthly')
  @ApiOperation({
    summary: 'Oylik Excel export',
    description:
      "Oy bo'yicha attendance ma'lumotlarini Excel formatida yuklab olish",
  })
  @ApiQuery({ name: 'year', required: true, description: 'Yil' })
  @ApiQuery({ name: 'month', required: true, description: 'Oy (1-12)' })
  @ApiResponse({
    status: 200,
    description: 'Excel fayl',
    content: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
        schema: { type: 'string', format: 'binary' },
      },
    },
  })
  async exportMonthly(
    @Res() res: Response,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    const y = parseInt(year, 10);
    const m = parseInt(month, 10);
    const buffer = await this.scheduleService.exportMonthlyExcel(y, m);
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename=monthly_${y}-${m}.xlsx`,
    });
    res.send(buffer);
  }

  @Get('export/yearly')
  @ApiOperation({
    summary: 'Yillik Excel export',
    description:
      "Yil bo'yicha attendance ma'lumotlarini Excel formatida yuklab olish",
  })
  @ApiQuery({ name: 'year', required: true, description: 'Yil' })
  @ApiResponse({
    status: 200,
    description: 'Excel fayl',
    content: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
        schema: { type: 'string', format: 'binary' },
      },
    },
  })
  async exportYearly(@Res() res: Response, @Query('year') year: string) {
    const y = parseInt(year, 10);
    const buffer = await this.scheduleService.exportYearlyExcel(y);
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename=yearly_${y}.xlsx`,
    });
    res.send(buffer);
  }
}
