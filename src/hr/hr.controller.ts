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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { HrService } from './hr.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { Employee } from '../schemas/employee.schema';
import { EmployeeResponseDto } from './dto/employee-response.dto';
import { EmployeeListResponseDto } from './dto/employee-list-response.dto';
import { HrStatisticsDto } from './dto/hr-statistics.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
  ApiConsumes,
  ApiProduces,
} from '@nestjs/swagger';
import { PatchFingerprintDto } from './dto/patch-fingerprint.dto';
import { GetFingerprintsQueryDto } from './dto/get-fingerprints-query.dto';
import { GetAllFingerprintsQueryDto } from './dto/get-all-fingerprints-query.dto';
import { GetEmployeesQueryDto } from './dto/get-employees-query.dto';
import {
  BulkUpdateEmployeesDto,
  BulkDeleteEmployeesDto,
  BulkRestoreEmployeesDto,
  BulkPasswordResetDto,
} from './dto/bulk-employee-operations.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('HR Management')
@Controller('hr')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiConsumes('application/json')
@ApiProduces('application/json')
export class HrController {
  constructor(private readonly hrService: HrService) {}

  // ==================== EMPLOYEE CRUD OPERATIONS ====================

  @Post()
  @ApiOperation({
    summary: 'Create new employee with automatic user account',
    description:
      'Creates an employee and automatically generates a user account with username and password. All fields are validated and the system ensures unique email and passport ID.',
  })
  @ApiBody({
    type: CreateEmployeeDto,
    description: 'Employee information with required and optional fields',
    examples: {
      basic: {
        summary: 'Basic employee creation',
        value: {
          fullName: 'Sarvarbek Xazratov',
          position: 'Frontend Developer',
          department: 'IT Department',
          phones: ['+998901234567'],
          email: 'sarvarbek@example.com',
        },
      },
      complete: {
        summary: 'Complete employee creation',
        value: {
          fullName: 'Sarvarbek Xazratov',
          position: 'Frontend Developer',
          department: 'IT Department',
          hireDate: '2025-01-15',
          birthDate: '2005-09-18',
          passportId: 'AA1234567',
          phones: ['+998901234567', '+998933334455'],
          email: 'sarvarbek@example.com',
          address: 'Toshkent sh., Yunusobod tumani',
          salary: 1500,
          status: 'active',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Employee created successfully with user account',
    type: EmployeeResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data or validation errors',
  })
  @ApiResponse({
    status: 409,
    description: 'Email or Passport ID already exists',
  })
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateEmployeeDto) {
    return this.hrService.createEmployee(dto);
  }

  @Get()
  @ApiOperation({
    summary:
      'Get all employees with advanced filtering, search, and pagination',
    description:
      'Retrieve employees with comprehensive filtering options including status, department, position, date ranges, salary ranges, and search functionality. All filters are optional and can be combined.',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search in full name, position, department, or email',
    example: 'developer',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['active', 'inactive'],
    description: 'Filter by employee status',
    example: 'active',
  })
  @ApiQuery({
    name: 'department',
    required: false,
    description: 'Filter by department',
    example: 'IT Department',
  })
  @ApiQuery({
    name: 'position',
    required: false,
    description: 'Filter by position',
    example: 'Frontend Developer',
  })
  @ApiQuery({
    name: 'hireDateFrom',
    required: false,
    description: 'Hire date from (YYYY-MM-DD)',
    example: '2024-01-01',
  })
  @ApiQuery({
    name: 'hireDateTo',
    required: false,
    description: 'Hire date to (YYYY-MM-DD)',
    example: '2025-01-01',
  })
  @ApiQuery({
    name: 'birthDateFrom',
    required: false,
    description: 'Birth date from (YYYY-MM-DD)',
    example: '1980-01-01',
  })
  @ApiQuery({
    name: 'birthDateTo',
    required: false,
    description: 'Birth date to (YYYY-MM-DD)',
    example: '2000-01-01',
  })
  @ApiQuery({
    name: 'salaryFrom',
    required: false,
    description: 'Minimum salary',
    example: 1000,
  })
  @ApiQuery({
    name: 'salaryTo',
    required: false,
    description: 'Maximum salary',
    example: 5000,
  })
  @ApiQuery({
    name: 'hasUserAccount',
    required: false,
    description: 'Filter by user account status',
    example: true,
  })
  @ApiQuery({
    name: 'hasWorkplace',
    required: false,
    description: 'Filter by workplace assignment',
    example: true,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page (max 100)',
    example: 20,
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: [
      'fullName',
      'position',
      'department',
      'hireDate',
      'birthDate',
      'salary',
      'createdAt',
      'updatedAt',
    ],
    description: 'Sort field',
    example: 'fullName',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort order',
    example: 'desc',
  })
  @ApiQuery({
    name: 'includeDeleted',
    required: false,
    description: 'Include soft-deleted employees',
    example: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Employees retrieved successfully with pagination metadata',
    type: EmployeeListResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid query parameters',
  })
  getAll(@Query() query: GetEmployeesQueryDto) {
    return this.hrService.getEmployees(query);
  }

  @Get('statistics')
  @ApiOperation({
    summary: 'Get comprehensive HR statistics and analytics',
    description:
      'Retrieve detailed HR metrics including employee counts, department breakdowns, salary statistics, and recent activity. Perfect for dashboards and reporting.',
  })
  @ApiResponse({
    status: 200,
    description: 'HR statistics retrieved successfully',
    type: HrStatisticsDto,
  })
  getStatistics() {
    return this.hrService.getHrStatistics();
  }

  @Get('departments')
  @ApiOperation({
    summary: 'Get all unique departments',
    description:
      'Retrieve a list of all departments in the system, sorted alphabetically.',
  })
  @ApiResponse({
    status: 200,
    description: 'Departments retrieved successfully',
    schema: {
      type: 'array',
      items: { type: 'string' },
      example: ['IT Department', 'HR Department', 'Finance Department'],
    },
  })
  getDepartments() {
    return this.hrService.getDepartments();
  }

  @Get('positions')
  @ApiOperation({
    summary: 'Get all unique positions',
    description:
      'Retrieve a list of all positions in the system, sorted alphabetically.',
  })
  @ApiResponse({
    status: 200,
    description: 'Positions retrieved successfully',
    schema: {
      type: 'array',
      items: { type: 'string' },
      example: ['Frontend Developer', 'Backend Developer', 'HR Manager'],
    },
  })
  getPositions() {
    return this.hrService.getPositions();
  }

  @Get('departments/:department/employees')
  @ApiOperation({
    summary: 'Get employees by specific department',
    description:
      'Retrieve all employees working in a specific department with basic information.',
  })
  @ApiParam({
    name: 'department',
    description: 'Department name',
    example: 'IT Department',
  })
  @ApiResponse({
    status: 200,
    description: 'Employees in department retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          fullName: { type: 'string' },
          position: { type: 'string' },
          email: { type: 'string' },
          status: { type: 'string' },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Department not found',
  })
  getEmployeesByDepartment(@Param('department') department: string) {
    return this.hrService.getEmployeesByDepartment(department);
  }

  @Get('positions/:position/employees')
  @ApiOperation({
    summary: 'Get employees by specific position',
    description:
      'Retrieve all employees with a specific position across all departments.',
  })
  @ApiParam({
    name: 'position',
    description: 'Position title',
    example: 'Frontend Developer',
  })
  @ApiResponse({
    status: 200,
    description: 'Employees with position retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          fullName: { type: 'string' },
          department: { type: 'string' },
          email: { type: 'string' },
          status: { type: 'string' },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Position not found',
  })
  getEmployeesByPosition(@Param('position') position: string) {
    return this.hrService.getEmployeesByPosition(position);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get employee by ID',
    description:
      'Retrieve detailed information about a specific employee by their unique ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'Employee MongoDB ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Employee found successfully',
    type: EmployeeResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Employee not found',
  })
  async getOne(@Param('id') id: string) {
    const employee = await this.hrService.getEmployeeById(id);
    if (!employee) throw new NotFoundException('Employee topilmadi');
    return employee;
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update employee by ID',
    description:
      'Update specific fields of an employee. All fields are optional - only provided fields will be updated. Supports partial updates.',
  })
  @ApiParam({
    name: 'id',
    description: 'Employee MongoDB ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiBody({
    type: UpdateEmployeeDto,
    description: 'Employee fields to update (all optional)',
    examples: {
      basic: {
        summary: 'Update basic info',
        value: {
          fullName: 'Sarvarbek Xazratov Updated',
          position: 'Senior Frontend Developer',
        },
      },
      status: {
        summary: 'Update status only',
        value: {
          status: 'inactive',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Employee updated successfully',
    type: EmployeeResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid update data',
  })
  @ApiResponse({
    status: 404,
    description: 'Employee not found',
  })
  update(@Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    return this.hrService.updateEmployee(id, dto);
  }

  @Patch(':id/delete')
  @ApiOperation({
    summary: 'Soft delete employee by ID',
    description:
      'Mark an employee as deleted without permanently removing them from the database. The employee can be restored later.',
  })
  @ApiParam({
    name: 'id',
    description: 'Employee MongoDB ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Employee soft-deleted successfully',
    type: EmployeeResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Employee not found',
  })
  softDelete(@Param('id') id: string) {
    return this.hrService.deleteEmployee(id);
  }

  // ==================== BULK OPERATIONS ====================

  @Patch('bulk/update')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiOperation({
    summary: 'Bulk update multiple employees',
    description:
      'Update multiple employees simultaneously with the same changes. Useful for mass updates like department transfers or status changes. Requires ADMIN or HR role.',
  })
  @ApiBody({
    type: BulkUpdateEmployeesDto,
    description: 'Employee IDs and fields to update',
    examples: {
      status: {
        summary: 'Bulk status update',
        value: {
          employeeIds: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
          status: 'active',
        },
      },
      department: {
        summary: 'Bulk department transfer',
        value: {
          employeeIds: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
          department: 'New Department',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Bulk update completed successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        updatedCount: { type: 'number' },
        totalCount: { type: 'number' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid bulk update data',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions - requires ADMIN or HR role',
  })
  bulkUpdate(@Body() dto: BulkUpdateEmployeesDto) {
    return this.hrService.bulkUpdateEmployees(dto);
  }

  @Patch('bulk/delete')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Bulk soft delete multiple employees',
    description:
      'Soft delete multiple employees simultaneously. This is a destructive operation that requires ADMIN role. Employees can be restored later.',
  })
  @ApiBody({
    type: BulkDeleteEmployeesDto,
    description: 'Employee IDs to delete and optional reason',
    examples: {
      basic: {
        summary: 'Bulk delete with reason',
        value: {
          employeeIds: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
          reason: 'Company restructuring',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Bulk delete completed successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        deletedCount: { type: 'number' },
        totalCount: { type: 'number' },
        reason: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid bulk delete data',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions - requires ADMIN role',
  })
  bulkDelete(@Body() dto: BulkDeleteEmployeesDto) {
    return this.hrService.bulkDeleteEmployees(dto);
  }

  @Patch('bulk/restore')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Bulk restore soft-deleted employees',
    description:
      'Restore multiple soft-deleted employees simultaneously. This operation requires ADMIN role.',
  })
  @ApiBody({
    type: BulkRestoreEmployeesDto,
    description: 'Employee IDs to restore',
    examples: {
      basic: {
        summary: 'Bulk restore',
        value: {
          employeeIds: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Bulk restore completed successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        restoredCount: { type: 'number' },
        totalCount: { type: 'number' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid bulk restore data',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions - requires ADMIN role',
  })
  bulkRestore(@Body() dto: BulkRestoreEmployeesDto) {
    return this.hrService.bulkRestoreEmployees(dto);
  }

  @Patch('bulk/password-reset')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiOperation({
    summary: 'Bulk password reset for multiple employees',
    description:
      'Reset passwords for multiple employees simultaneously. Generates new temporary passwords for all selected employees. Requires ADMIN or HR role.',
  })
  @ApiBody({
    type: BulkPasswordResetDto,
    description: 'Employee IDs to reset passwords for and optional note',
    examples: {
      basic: {
        summary: 'Bulk password reset',
        value: {
          employeeIds: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
          note: 'Security policy update',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Bulk password reset completed successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        resetCount: { type: 'number' },
        totalCount: { type: 'number' },
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              employeeId: { type: 'string' },
              fullName: { type: 'string' },
              username: { type: 'string' },
              newPassword: { type: 'string' },
            },
          },
        },
        note: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid bulk password reset data',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions - requires ADMIN or HR role',
  })
  bulkPasswordReset(@Body() dto: BulkPasswordResetDto) {
    return this.hrService.bulkPasswordReset(dto);
  }

  // ==================== USER ACCOUNT MANAGEMENT ====================

  @Get('employees/credentials')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get all employee credentials information',
    description:
      'Retrieve login credentials for all employees with user accounts. This includes usernames, temporary passwords, and account status. Requires ADMIN role.',
  })
  @ApiResponse({
    status: 200,
    description: 'Employee credentials retrieved successfully',
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
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions - requires ADMIN role',
  })
  getAllEmployeeCredentials() {
    return this.hrService.getAllEmployeeCredentials();
  }

  @Get(':id/credentials')
  @ApiOperation({
    summary: 'Get employee credentials information',
    description:
      "Retrieve information about an employee's user account and password status.",
  })
  @ApiParam({
    name: 'id',
    description: 'Employee MongoDB ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Employee credentials retrieved successfully',
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
  @ApiResponse({
    status: 404,
    description: 'Employee not found',
  })
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
    description:
      'Generate a new temporary password for an employee. The employee will be required to change this password on their next login.',
  })
  @ApiParam({
    name: 'id',
    description: 'Employee MongoDB ID',
    example: '507f1f77bcf86cd799439011',
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
  @ApiResponse({
    status: 404,
    description: 'Employee not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Employee does not have a user account',
  })
  resetPassword(@Param('id') id: string) {
    return this.hrService.resetEmployeePassword(id);
  }

  // ==================== FINGERPRINT MANAGEMENT ====================

  @Get('fingerprints')
  @ApiOperation({
    summary: 'Get all fingerprints with pagination and filtering',
    description:
      'Retrieve a comprehensive list of all fingerprints in the system with optional filtering by status and employee ID. Includes pagination and employee information.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page',
    example: 20,
  })
  @ApiQuery({
    name: 'includeTemplate',
    required: false,
    description: 'Include fingerprint template data',
    example: false,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['active', 'revoked'],
    description: 'Filter by fingerprint status',
    example: 'active',
  })
  @ApiQuery({
    name: 'employeeId',
    required: false,
    description: 'Filter by specific employee ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Fingerprints retrieved successfully with pagination',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              employeeId: { type: 'object' },
              status: { type: 'string' },
              createdAt: { type: 'string' },
            },
          },
        },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            page: { type: 'number' },
            limit: { type: 'number' },
            pages: { type: 'number' },
            count: { type: 'number' },
            hasNext: { type: 'boolean' },
            hasPrev: { type: 'boolean' },
          },
        },
      },
    },
  })
  listAllFingerprints(@Query() query: GetAllFingerprintsQueryDto) {
    return this.hrService.listAllFingerprints(
      query.page ?? 1,
      query.limit ?? 20,
      query.includeTemplate ?? false,
      query.status,
      query.employeeId,
    );
  }

  @Patch(':id/fingerprints')
  @ApiOperation({
    summary: 'Add fingerprint to employee',
    description:
      'Add a new fingerprint template to an employee. Each employee can have up to 10 active fingerprints. The template should be provided in base64 format.',
  })
  @ApiParam({
    name: 'id',
    description: 'Employee MongoDB ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiBody({
    type: PatchFingerprintDto,
    description: 'Fingerprint template data',
    examples: {
      basic: {
        summary: 'Add fingerprint template',
        value: {
          template: 'base64EncodedFingerprintData...',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Fingerprint added successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        employeeId: { type: 'string' },
        template: { type: 'string' },
        status: { type: 'string' },
        createdAt: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Employee not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Fingerprint limit (10) exceeded',
  })
  addFingerprint(@Param('id') id: string, @Body() body: PatchFingerprintDto) {
    return this.hrService.addFingerprint(id, body.template);
  }

  @Get(':id/fingerprints')
  @ApiOperation({
    summary: 'Get employee fingerprints with pagination',
    description:
      'Retrieve all fingerprints for a specific employee with pagination and optional filtering by status.',
  })
  @ApiParam({
    name: 'id',
    description: 'Employee MongoDB ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page',
    example: 20,
  })
  @ApiQuery({
    name: 'includeTemplate',
    required: false,
    description: 'Include fingerprint template data',
    example: false,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['active', 'revoked'],
    description: 'Filter by fingerprint status',
    example: 'active',
  })
  @ApiResponse({
    status: 200,
    description: 'Employee fingerprints retrieved successfully with pagination',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              employeeId: { type: 'string' },
              status: { type: 'string' },
              createdAt: { type: 'string' },
            },
          },
        },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            page: { type: 'number' },
            limit: { type: 'number' },
            pages: { type: 'number' },
            count: { type: 'number' },
            hasNext: { type: 'boolean' },
            hasPrev: { type: 'boolean' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Employee not found',
  })
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
