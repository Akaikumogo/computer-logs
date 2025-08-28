/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { HrService } from './hr.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { Employee } from '../schemas/employee.schema';
import { EmployeeResponseDto } from './dto/employee-response.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PatchFingerprintDto } from './dto/patch-fingerprint.dto';
import { GetFingerprintsQueryDto } from './dto/get-fingerprints-query.dto';
import { GetAllFingerprintsQueryDto } from './dto/get-all-fingerprints-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('HR')
@Controller('hr')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class HrController {
  constructor(private readonly hrService: HrService) {}

  @Post()
  @ApiBody({ type: CreateEmployeeDto })
  @ApiOperation({
    summary: 'Create new employee with automatic user account',
    description:
      'Creates an employee and automatically generates a user account with username and password',
  })
  @ApiResponse({
    status: 201,
    description: 'Employee created with user account',
    type: EmployeeResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Email or Passport ID already exists',
  })
  create(@Body() dto: CreateEmployeeDto) {
    return this.hrService.createEmployee(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all employees with optional filter/search' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'inactive'] })
  @ApiQuery({ name: 'department', required: false, type: String })
  getAll(
    @Query('search') search?: string,
    @Query('status') status?: 'active' | 'inactive',
    @Query('department') department?: string,
  ) {
    const filter: any = {};
    if (status) filter.status = status;
    if (department) filter.department = department;
    return this.hrService.getEmployees(filter, search);
  }

  // ---------- Fingerprints (global list) BEFORE dynamic :id to avoid conflicts ----------
  @Get('fingerprints')
  @ApiOperation({
    summary: 'Barcha barmoq izlari (pagination, optional filterlar)',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'includeTemplate', required: false, type: Boolean })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'revoked'] })
  @ApiQuery({ name: 'employeeId', required: false, type: String })
  listAllFingerprints(@Query() query: GetAllFingerprintsQueryDto) {
    return this.hrService.listAllFingerprints(
      query.page ?? 1,
      query.limit ?? 20,
      query.includeTemplate ?? false,
      query.status,
      query.employeeId,
    );
  }

  @Get('employees/credentials')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: "Barcha xodimlarning login/parol ma'lumotlari",
    description:
      "Faqat SUPER ADMIN ko'ra oladi - barcha xodimlarning login va parollarini ko'rish",
  })
  @ApiResponse({
    status: 200,
    description: "Barcha xodimlarning credential ma'lumotlari",
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          employeeId: { type: 'string' },
          fullName: { type: 'string' },
          username: { type: 'string' },
          email: { type: 'string' },
          department: { type: 'string' },
          position: { type: 'string' },
          hasTempPassword: { type: 'boolean' },
          tempPassword: { type: 'string' },
          note: { type: 'string' },
        },
      },
    },
  })
  @ApiResponse({ status: 403, description: "Ruxsat yo'q - faqat SUPER ADMIN" })
  getAllEmployeeCredentials() {
    return this.hrService.getAllEmployeeCredentials();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get employee by ID' })
  @ApiResponse({ status: 200, description: 'Employee found', type: Employee })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async getOne(@Param('id') id: string) {
    const employee = await this.hrService.getEmployeeById(id);
    if (!employee) throw new NotFoundException('Employee not found');
    return employee;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update employee by ID' })
  @ApiResponse({ status: 200, description: 'Employee updated', type: Employee })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  update(@Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    return this.hrService.updateEmployee(id, dto);
  }

  @Get(':id/credentials')
  @ApiOperation({
    summary: 'Get employee credentials info',
    description:
      'Get information about employee user account and password status',
  })
  @ApiResponse({
    status: 200,
    description: 'Employee credentials info retrieved',
    schema: {
      type: 'object',
      properties: {
        employeeId: { type: 'string' },
        fullName: { type: 'string' },
        username: { type: 'string' },
        email: { type: 'string' },
        hasTempPassword: { type: 'boolean' },
        note: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  @ApiResponse({
    status: 409,
    description: 'Employee does not have a user account',
  })
  getCredentials(@Param('id') id: string) {
    return this.hrService.getEmployeeCredentials(id);
  }

  @Patch(':id/reset-password')
  @ApiOperation({
    summary: 'Reset employee password',
    description: 'Generates a new temporary password for the employee',
  })
  @ApiResponse({
    status: 200,
    description: 'Password reset successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        username: { type: 'string' },
        newPassword: { type: 'string' },
        note: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  @ApiResponse({
    status: 409,
    description: 'Employee does not have a user account',
  })
  resetPassword(@Param('id') id: string) {
    return this.hrService.resetEmployeePassword(id);
  }

  @Patch(':id/delete')
  @ApiOperation({ summary: 'Soft delete employee by ID' })
  @ApiResponse({
    status: 200,
    description: 'Employee soft-deleted',
    type: Employee,
  })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  softDelete(@Param('id') id: string) {
    return this.hrService.deleteEmployee(id);
  }

  @Patch(':id/fingerprints')
  @ApiOperation({ summary: 'Xodimga barmoq izi (AS608) qo‘shish' })
  @ApiBody({ type: PatchFingerprintDto })
  @ApiResponse({ status: 200, description: 'Fingerprint added' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  @ApiResponse({ status: 409, description: 'Fingerprint limit (10) exceeded' })
  addFingerprint(@Param('id') id: string, @Body() body: PatchFingerprintDto) {
    return this.hrService.addFingerprint(id, body.template);
  }

  @Get(':id/fingerprints')
  @ApiOperation({ summary: 'Xodimning barmoq izlari ro‘yxati (pagination)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'includeTemplate', required: false, type: Boolean })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'revoked'] })
  listFingerprints(
    @Param('id') id: string,
    @Query() query: GetFingerprintsQueryDto,
  ) {
    return this.hrService.listFingerprints(
      id,
      query.page ?? 1,
      query.limit ?? 20,
      query.includeTemplate ?? false,
      query.status,
    );
  }
}
