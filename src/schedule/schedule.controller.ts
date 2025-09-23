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
} from '@nestjs/common';
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
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SkipAuth } from '../auth/decorators/skip-auth.decorator';

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
    description: 'Avval kirish qayd qilishingiz kerak',
  })
  @HttpCode(HttpStatus.CREATED)
  async checkOut(@Body() checkOutDto: CheckOutDto) {
    return this.scheduleService.checkOut(checkOutDto);
  }

  @Post('attendance/checkinout')
  @SkipAuth()
  @ApiOperation({
    summary: 'Barmoq orqali kirish/chiqish qayd qilish (Public)',
    description:
      "Barmoq raqami asosida avtomatik ravishda kirish yoki chiqishni aniqlaydi. Oxirgi record IN bo'lsa keyingisi OUT, aks holda IN bo'ladi. Authentication talab qilmaydi.",
  })
  @ApiBody({ type: FingerAttendanceDto })
  @ApiResponse({
    status: 201,
    description: 'Kirish yoki chiqish muvaffaqiyatli qayd qilindi',
  })
  @ApiResponse({ status: 404, description: 'Barmoq raqami topilmadi' })
  @HttpCode(HttpStatus.CREATED)
  async checkInOutByFinger(@Body() fingerAttendanceDto: FingerAttendanceDto) {
    return this.scheduleService.checkInOutByFinger(fingerAttendanceDto);
  }

  // ==================== ATTENDANCE RECORDS ====================

  @Get('attendance/today/:employeeId')
  @ApiOperation({
    summary: "Xodimning bugungi attendance ma'lumoti",
    description: "Xodimning bugungi kirish/chiqish ma'lumotlarini olish",
  })
  @ApiParam({ name: 'employeeId', description: 'Xodim ID' })
  @ApiResponse({ status: 200, description: "Bugungi attendance ma'lumoti" })
  @ApiResponse({ status: 404, description: 'Xodim topilmadi' })
  async getTodayAttendance(@Param('employeeId') employeeId: string) {
    return this.scheduleService.getTodayAttendance(employeeId);
  }

  @Get('attendance/employee/:employeeId')
  @ApiOperation({
    summary: 'Xodimning attendance tarixi',
    description: "Xodimning barcha attendance ma'lumotlarini olish",
  })
  @ApiParam({ name: 'employeeId', description: 'Xodim ID' })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: "Boshlang'ich sana (YYYY-MM-DD)",
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'Tugash sana (YYYY-MM-DD)',
  })
  @ApiQuery({ name: 'status', required: false, description: 'Status filter' })
  @ApiQuery({ name: 'limit', required: false, description: 'Natijalar soni' })
  @ApiResponse({ status: 200, description: 'Xodimning attendance tarixi' })
  @ApiResponse({ status: 404, description: 'Xodim topilmadi' })
  async getEmployeeAttendance(
    @Param('employeeId') employeeId: string,
    @Query() filter: AttendanceFilterDto,
  ) {
    return this.scheduleService.getEmployeeAttendance(employeeId, filter);
  }

  @Put('attendance/:id')
  @ApiOperation({
    summary: "Attendance ma'lumotini yangilash",
    description: "Mavjud attendance ma'lumotini yangilash",
  })
  @ApiParam({ name: 'id', description: 'Attendance ID' })
  @ApiResponse({ status: 200, description: "Attendance ma'lumoti yangilandi" })
  @ApiResponse({ status: 404, description: 'Attendance topilmadi' })
  @Roles(UserRole.ADMIN, UserRole.HR)
  @UseGuards(RolesGuard)
  async updateAttendance(@Param('id') id: string, @Body() updateData: any) {
    // Bu metodni to'liq implement qilish kerak
    return { message: "Attendance ma'lumoti yangilandi", id };
  }

  @Delete('attendance/:id')
  @ApiOperation({
    summary: "Attendance ma'lumotini o'chirish",
    description: "Attendance ma'lumotini soft delete qilish",
  })
  @ApiParam({ name: 'id', description: 'Attendance ID' })
  @ApiResponse({ status: 200, description: "Attendance ma'lumoti o'chirildi" })
  @ApiResponse({ status: 404, description: 'Attendance topilmadi' })
  @Roles(UserRole.ADMIN, UserRole.HR)
  @UseGuards(RolesGuard)
  async deleteAttendance(@Param('id') id: string) {
    // Bu metodni to'liq implement qilish kerak
    return { message: "Attendance ma'lumoti o'chirildi", id };
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
    description: 'Belgilangan oy uchun kunlik attendance statistikasi',
  })
  @ApiParam({ name: 'year', description: 'Yil (masalan: 2025)' })
  @ApiParam({ name: 'month', description: 'Oy (1-12)' })
  @ApiQuery({
    name: 'locationName',
    required: false,
    description: 'Location nomi',
  })
  @ApiResponse({ status: 200, description: "Oylik jadval ma'lumotlari" })
  async getMonthlySchedule(
    @Param('year') year: string,
    @Param('month') month: string,
    @Query('locationName') locationName?: string,
  ) {
    return this.scheduleService.getMonthlySchedule(
      parseInt(year),
      parseInt(month),
      locationName,
    );
  }

  @Get('yearly/:year')
  @ApiOperation({
    summary: 'Yillik jadval',
    description: 'Belgilangan yil uchun oylik attendance statistikasi',
  })
  @ApiParam({ name: 'year', description: 'Yil (masalan: 2025)' })
  @ApiQuery({
    name: 'locationName',
    required: false,
    description: 'Location nomi',
  })
  @ApiResponse({ status: 200, description: "Yillik jadval ma'lumotlari" })
  async getYearlySchedule(
    @Param('year') year: string,
    @Query('locationName') locationName?: string,
  ) {
    return this.scheduleService.getYearlySchedule(parseInt(year), locationName);
  }

  // ==================== DASHBOARD & STATISTICS ====================

  @Get('dashboard/stats')
  @ApiOperation({
    summary: 'Dashboard statistikasi',
    description: 'Umumiy dashboard statistikalarini olish',
  })
  @ApiResponse({ status: 200, description: 'Dashboard statistikasi' })
  async getDashboardStats() {
    return this.scheduleService.getDashboardStats();
  }

  @Get('dashboard/summary')
  @ApiOperation({
    summary: 'Attendance xulosa',
    description: "Attendance bo'yicha umumiy xulosa",
  })
  @ApiQuery({ name: 'date', required: false, description: 'Sana (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Attendance xulosa' })
  async getAttendanceSummary(@Query('date') date?: string) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    return this.scheduleService.getAttendanceSummary(targetDate);
  }

  // ==================== EXPORT FUNCTIONALITY ====================

  @Get('attendance/export/excel')
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
  async exportToExcel(@Query() filter: AttendanceFilterDto) {
    return this.scheduleService.exportAttendanceToExcel(filter);
  }

  @Get('attendance/export/pdf')
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
  async exportToPDF(@Query() filter: AttendanceFilterDto) {
    return this.scheduleService.exportAttendanceToPDF(filter);
  }

  // ==================== EMPLOYEE MANAGEMENT ====================

  @Get('employees')
  @ApiOperation({
    summary: "Xodimlar ro'yxati",
    description: "Barcha faol xodimlarning ro'yxatini olish",
  })
  @ApiQuery({
    name: 'department',
    required: false,
    description: "Bo'lim filter",
  })
  @ApiQuery({
    name: 'position',
    required: false,
    description: 'Lavozim filter',
  })
  @ApiResponse({ status: 200, description: "Xodimlar ro'yxati" })
  async getEmployees(
    @Query('department') department?: string,
    @Query('position') position?: string,
  ) {
    // Bu metodni to'liq implement qilish kerak
    return { message: "Xodimlar ro'yxati", department, position };
  }

  @Get('employees/:id')
  @ApiOperation({
    summary: "Xodim ma'lumoti",
    description: "Belgilangan xodimning to'liq ma'lumotini olish",
  })
  @ApiParam({ name: 'id', description: 'Xodim ID' })
  @ApiResponse({ status: 200, description: "Xodim ma'lumoti" })
  @ApiResponse({ status: 404, description: 'Xodim topilmadi' })
  async getEmployee(@Param('id') id: string) {
    // Bu metodni to'liq implement qilish kerak
    return { message: "Xodim ma'lumoti", id };
  }

  @Get('employees/:id/attendance')
  @ApiOperation({
    summary: 'Xodimning attendance tarixi',
    description: "Belgilangan xodimning barcha attendance ma'lumotlari",
  })
  @ApiParam({ name: 'id', description: 'Xodim ID' })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: "Boshlang'ich sana",
  })
  @ApiQuery({ name: 'endDate', required: false, description: 'Tugash sana' })
  @ApiResponse({ status: 200, description: 'Xodimning attendance tarixi' })
  @ApiResponse({ status: 404, description: 'Xodim topilmadi' })
  async getEmployeeAttendanceHistory(
    @Param('id') id: string,
    @Query() filter: AttendanceFilterDto,
  ) {
    return this.scheduleService.getEmployeeAttendance(id, filter);
  }
}
