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
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { CheckInOutDto, AttendanceQueryDto } from '../dto/attendance.dto';
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
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Attendance Management')
@Controller('attendance')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  // ==================== CHECK IN/OUT OPERATIONS ====================

  @Post('check-in-out')
  @ApiOperation({
    summary: 'Xodimning kirish yoki chiqishini qayd qilish',
    description: 'Birinchi marta = Kirish, ikkinchi marta = Chiqish, uchinchi marta = Kirish...',
  })
  @ApiBody({ type: CheckInOutDto })
  @ApiResponse({ status: 201, description: 'Kirish yoki chiqish muvaffaqiyatli qayd qilindi' })
  @ApiResponse({ status: 404, description: 'Xodim topilmadi' })
  @HttpCode(HttpStatus.CREATED)
  async checkInOut(@Body() checkInOutDto: CheckInOutDto) {
    return this.attendanceService.checkInOut(checkInOutDto);
  }

  // ==================== ATTENDANCE RECORDS ====================

  @Get('today/:employeeId')
  @ApiOperation({
    summary: 'Xodimning bugungi attendance ma\'lumoti',
    description: 'Bugungi kirish-chiqish va ish vaqtini ko\'rsatadi',
  })
  @ApiParam({ name: 'employeeId', description: 'Xodim ID' })
  @ApiResponse({ status: 200, description: 'Bugungi attendance ma\'lumoti' })
  async getTodayAttendance(@Param('employeeId') employeeId: string) {
    return this.attendanceService.getTodayAttendance(employeeId);
  }

  @Get()
  @ApiOperation({
    summary: 'Attendance ro\'yxatini olish',
    description: 'Filter va pagination bilan attendance recordlarini olish',
  })
  @ApiQuery({ name: 'employeeId', required: false, description: 'Xodim ID' })
  @ApiQuery({ name: 'fromDate', required: false, description: 'Boshlang\'ich sana (YYYY-MM-DD)' })
  @ApiQuery({ name: 'toDate', required: false, description: 'Tugash sana (YYYY-MM-DD)' })
  @ApiQuery({ name: 'type', required: false, enum: ['in', 'out'], description: 'Turi' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Sahifa raqami' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Sahifa hajmi' })
  @ApiResponse({ status: 200, description: 'Attendance ro\'yxati' })
  async getAttendances(@Query() query: AttendanceQueryDto) {
    return this.attendanceService.getAttendances(query);
  }

  // ==================== STATISTICS & REPORTS ====================

  @Get('statistics/:employeeId')
  @ApiOperation({
    summary: 'Xodimning attendance statistikasi',
    description: 'Belgilangan vaqt oralig\'ida attendance statistikasini olish',
  })
  @ApiParam({ name: 'employeeId', description: 'Xodim ID' })
  @ApiQuery({ name: 'fromDate', required: false, description: 'Boshlang\'ich sana (YYYY-MM-DD)' })
  @ApiQuery({ name: 'toDate', required: false, description: 'Tugash sana (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Attendance statistikasi' })
  async getEmployeeStatistics(
    @Param('employeeId') employeeId: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.attendanceService.getEmployeeStatistics(employeeId, fromDate, toDate);
  }

  @Get('reports/daily')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiOperation({
    summary: 'Kunlik attendance hisoboti',
    description: 'Bugungi barcha xodimlarning attendance ma\'lumoti (ADMIN va HR uchun)',
  })
  @ApiQuery({ name: 'date', required: false, description: 'Sana (YYYY-MM-DD), default: bugun' })
  @ApiResponse({ status: 200, description: 'Kunlik hisobot' })
  @ApiResponse({ status: 403, description: 'Ruxsat yo\'q - faqat ADMIN va HR' })
  async getDailyReport(@Query('date') date?: string) {
    // Kunlik hisobot logikasi
    const reportDate = date ? new Date(date) : new Date();
    return {
      date: reportDate.toISOString().split('T')[0],
      message: 'Daily report endpoint - implementation needed',
    };
  }

  @Get('reports/weekly')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiOperation({
    summary: 'Haftalik attendance hisoboti',
    description: 'O\'tgan hafta attendance statistikasi (ADMIN va HR uchun)',
  })
  @ApiQuery({ name: 'weekStart', required: false, description: 'Hafta boshlanishi (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Haftalik hisobot' })
  @ApiResponse({ status: 403, description: 'Ruxsat yo\'q - faqat ADMIN va HR' })
  async getWeeklyReport(@Query('weekStart') weekStart?: string) {
    // Haftalik hisobot logikasi
    return {
      message: 'Weekly report endpoint - implementation needed',
    };
  }

  @Get('reports/monthly')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiOperation({
    summary: 'Oylik attendance hisoboti',
    description: 'O\'tgan oy attendance statistikasi (ADMIN va HR uchun)',
  })
  @ApiQuery({ name: 'year', required: false, description: 'Yil (YYYY)', example: '2025' })
  @ApiQuery({ name: 'month', required: false, description: 'Oy (1-12)', example: '1' })
  @ApiResponse({ status: 200, description: 'Oylik hisobot' })
  @ApiResponse({ status: 403, description: 'Ruxsat yo\'q - faqat ADMIN va HR' })
  async getMonthlyReport(
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    // Oylik hisobot logikasi
    return {
      message: 'Monthly report endpoint - implementation needed',
    };
  }

  @Get('reports/yearly')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiOperation({
    summary: 'Yillik attendance hisoboti',
    description: 'O\'tgan yil attendance statistikasi (ADMIN va HR uchun)',
  })
  @ApiQuery({ name: 'year', required: false, description: 'Yil (YYYY)', example: '2025' })
  @ApiResponse({ status: 200, description: 'Yillik hisobot' })
  @ApiResponse({ status: 403, description: 'Ruxsat yo\'q - faqat ADMIN va HR' })
  async getYearlyReport(@Query('year') year?: string) {
    // Yillik hisobot logikasi
    return {
      message: 'Yearly report endpoint - implementation needed',
    };
  }

  // ==================== WARNING MANAGEMENT ====================

  @Get('warnings')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiOperation({
    summary: 'Barcha warninglar ro\'yxati',
    description: 'Attendance warninglarini ko\'rish (ADMIN va HR uchun)',
  })
  @ApiQuery({ name: 'employeeId', required: false, description: 'Xodim ID' })
  @ApiQuery({ name: 'date', required: false, description: 'Sana (YYYY-MM-DD)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Warninglar ro\'yxati' })
  @ApiResponse({ status: 403, description: 'Ruxsat yo\'q - faqat ADMIN va HR' })
  async getWarnings(
    @Query('employeeId') employeeId?: string,
    @Query('date') date?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    // Warninglar ro'yxati logikasi
    return {
      message: 'Warnings endpoint - implementation needed',
    };
  }

  @Get('warnings/clear/:attendanceId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiOperation({
    summary: 'Warningni tozalash',
    description: 'Attendance recorddan warningni olib tashlash (ADMIN va HR uchun)',
  })
  @ApiParam({ name: 'attendanceId', description: 'Attendance ID' })
  @ApiResponse({ status: 200, description: 'Warning muvaffaqiyatli tozalandi' })
  @ApiResponse({ status: 403, description: 'Ruxsat yo\'q - faqat ADMIN va HR' })
  async clearWarning(@Param('attendanceId') attendanceId: string) {
    // Warning tozalash logikasi
    return {
      message: 'Clear warning endpoint - implementation needed',
    };
  }

  // ==================== PUBLIC ENDPOINTS (No Auth) ====================

  @Post('public/check-in-out')
  @ApiOperation({
    summary: 'Public check-in/out (authentication talab qilmaydi)',
    description: 'Mobile app yoki boshqa tizimlardan kirish-chiqish qayd qilish',
  })
  @ApiBody({ type: CheckInOutDto })
  @ApiResponse({ status: 201, description: 'Kirish yoki chiqish muvaffaqiyatli qayd qilindi' })
  @HttpCode(HttpStatus.CREATED)
  async publicCheckInOut(@Body() checkInOutDto: CheckInOutDto) {
    // Public endpoint - authentication yo'q
    return this.attendanceService.checkInOut(checkInOutDto);
  }
}
