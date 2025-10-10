import { Controller, Get, Query, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
import { DashboardService } from './dashboard.service';
import { AttendanceFilterDto } from '../dto/schedule.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({
    summary: 'Dashboard statistikasi',
    description: 'Umumiy dashboard statistikalarini olish',
  })
  @ApiResponse({ status: 200, description: 'Dashboard statistikasi' })
  async getDashboardStats() {
    return this.dashboardService.getDashboardStats();
  }

  @Get('overview')
  @ApiOperation({
    summary: "Dashboard umumiy ko'rinish",
    description:
      "Bosh sahifa uchun to'liq dashboard ma'lumotlari - statistika, vazifalar, ishchilar",
  })
  @ApiResponse({ status: 200, description: "Dashboard umumiy ko'rinish" })
  async getDashboardOverview() {
    return this.dashboardService.getDashboardOverview();
  }

  @Get('summary')
  @ApiOperation({
    summary: 'Attendance xulosa',
    description: "Attendance bo'yicha umumiy xulosa",
  })
  @ApiQuery({ name: 'date', required: false, description: 'Sana (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Attendance xulosa' })
  async getAttendanceSummary(@Query('date') date?: string) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    return this.dashboardService.getAttendanceSummary(targetDate);
  }

  @Get('export/excel')
  @ApiOperation({
    summary: 'Excel formatida export',
    description: "Attendance ma'lumotlarini Excel formatida export qilish",
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: "Boshlang'ich sana",
  })
  @ApiQuery({ name: 'endDate', required: false, description: 'Tugash sana' })
  @ApiQuery({ name: 'employeeId', required: false, description: 'Xodim ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Status filter' })
  @ApiResponse({ status: 200, description: 'Excel fayl' })
  @Roles(UserRole.ADMIN, UserRole.HR)
  @UseGuards(RolesGuard)
  async exportToExcel(
    @Query() filter: AttendanceFilterDto,
    @Res() res: Response,
  ) {
    const data = await this.dashboardService.exportAttendanceToExcel(filter);

    // Excel fayl yaratish uchun xlsx kutubxonasi kerak
    // Hozircha JSON formatida qaytaramiz
    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="attendance_export.json"',
    );
    res.json(data);
  }

  @Get('export/pdf')
  @ApiOperation({
    summary: 'PDF formatida export',
    description: "Attendance ma'lumotlarini PDF formatida export qilish",
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: "Boshlang'ich sana",
  })
  @ApiQuery({ name: 'endDate', required: false, description: 'Tugash sana' })
  @ApiQuery({ name: 'employeeId', required: false, description: 'Xodim ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Status filter' })
  @ApiResponse({ status: 200, description: 'PDF fayl' })
  @Roles(UserRole.ADMIN, UserRole.HR)
  @UseGuards(RolesGuard)
  async exportToPDF(
    @Query() filter: AttendanceFilterDto,
    @Res() res: Response,
  ) {
    const data = await this.dashboardService.exportAttendanceToPDF(filter);

    // PDF fayl yaratish uchun puppeteer yoki boshqa kutubxona kerak
    // Hozircha JSON formatida qaytaramiz
    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="attendance_export.pdf"',
    );
    res.json(data);
  }

  @Get('reports/daily')
  @ApiOperation({
    summary: 'Kunlik hisobot',
    description: 'Kunlik attendance hisobotini olish',
  })
  @ApiQuery({ name: 'date', required: false, description: 'Sana (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Kunlik hisobot' })
  async getDailyReport(@Query('date') date?: string) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    return this.dashboardService.getDailyReport(targetDate);
  }

  @Get('reports/monthly')
  @ApiOperation({
    summary: 'Oylik hisobot',
    description: 'Oylik attendance hisobotini olish',
  })
  @ApiQuery({ name: 'year', required: false, description: 'Yil' })
  @ApiQuery({ name: 'month', required: false, description: 'Oy' })
  @ApiResponse({ status: 200, description: 'Oylik hisobot' })
  async getMonthlyReport(
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    const currentDate = new Date();
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();
    const targetMonth = month ? parseInt(month) : currentDate.getMonth() + 1;

    return this.dashboardService.getMonthlyReport(targetYear, targetMonth);
  }

  @Get('reports/yearly')
  @ApiOperation({
    summary: 'Yillik hisobot',
    description: 'Yillik attendance hisobotini olish',
  })
  @ApiQuery({ name: 'year', required: false, description: 'Yil' })
  @ApiResponse({ status: 200, description: 'Yillik hisobot' })
  async getYearlyReport(@Query('year') year?: string) {
    const currentDate = new Date();
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();

    return this.dashboardService.getYearlyReport(targetYear);
  }
}
