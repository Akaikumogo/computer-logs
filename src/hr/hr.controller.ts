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
} from '@nestjs/common';
import { HrService } from './hr.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { Employee } from '../schemas/employee.schema';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { PatchFingerprintDto } from './dto/patch-fingerprint.dto';
import { GetFingerprintsQueryDto } from './dto/get-fingerprints-query.dto';
import { GetAllFingerprintsQueryDto } from './dto/get-all-fingerprints-query.dto';

@ApiTags('HR')
@Controller('hr')
export class HrController {
  constructor(private readonly hrService: HrService) {}

  @Post()
  @ApiBody({ type: CreateEmployeeDto })
  @ApiOperation({ summary: 'Create new employee' })
  @ApiResponse({ status: 201, description: 'Employee created', type: Employee })
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
