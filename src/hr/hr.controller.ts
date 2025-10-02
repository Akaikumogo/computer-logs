/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  NotFoundException,
  BadRequestException,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { HrService } from './hr.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
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
import { UploadExcelDto, ExcelUploadResponseDto } from './dto/upload-excel.dto';
import { UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('HR Management')
@Controller('hr')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiConsumes('application/json')
@ApiProduces('application/json')
export class HrController {
  constructor(private readonly hrService: HrService) {}

  // ==================== EXCEL UPLOAD & IMPORT ====================

  @Post('upload-excel')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.HR)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary:
      'Upload Excel file to import employees, departments, and positions',
    description:
      'Upload an Excel file containing employee data. The system will automatically create departments, positions, and employees based on the data. Supports multiple languages (Uzbek, Russian, English) for column headers.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Excel file upload with employee data',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Excel file (.xlsx, .xls) containing employee data',
        },
        note: {
          type: 'string',
          description: 'Optional note about the upload',
          example: 'Employee data import from HR system',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Excel file processed successfully',
    type: ExcelUploadResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file format or processing error',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions - requires ADMIN or HR role',
  })
  @HttpCode(HttpStatus.CREATED)
  async uploadExcel(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Excel file is required');
    }

    // Validate file type
    const allowedMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Only Excel files (.xlsx, .xls) are allowed',
      );
    }

    return this.hrService.uploadExcelFile(file);
  }

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
          tabRaqami: 'EMP001',
        },
      },
      complete: {
        summary: 'Complete employee creation',
        value: {
          fullName: 'Sarvarbek Xazratov',
          position: 'Frontend Developer',
          department: 'IT Department',
          tabRaqami: 'EMP001',
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
      withoutEmail: {
        summary: 'Employee creation without email',
        value: {
          fullName: 'Sarvarbek Xazratov',
          position: 'Frontend Developer',
          department: 'IT Department',
          tabRaqami: 'EMP001',
          address: 'Toshkent sh., Yunusobod tumani',
        },
      },
      minimal: {
        summary: 'Minimal employee creation (only required fields)',
        value: {
          fullName: 'Sarvarbek Xazratov',
          position: 'Frontend Developer',
          department: 'IT Department',
          tabRaqami: 'EMP001',
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
    status: 200,
    description:
      'Employee created successfully (duplicates handled automatically)',
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
    description:
      'Search in full name, position, department, email, tab raqami, or passport ID',
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
      'tabRaqami',
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
          tabRaqami: { type: 'string' },
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
          tabRaqami: { type: 'string' },
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

  // ==================== POSITION MANAGEMENT ====================

  @Post('positions')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiOperation({
    summary: 'Create new position',
    description: 'Create a new job position. Requires ADMIN or HR role.',
  })
  @ApiBody({
    description: 'Position data (all fields optional except name)',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Position name (required)' },
        status: {
          type: 'string',
          enum: ['active', 'inactive'],
          description: 'Position status',
        },
      },
      required: ['name'],
    },
    examples: {
      basic: {
        summary: 'Basic position',
        value: {
          name: 'Frontend Developer',
          status: 'active',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Position created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid position data',
  })
  @ApiResponse({
    status: 409,
    description: 'Position name already exists',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions',
  })
  @HttpCode(HttpStatus.CREATED)
  createPosition(@Body() positionData: any) {
    return this.hrService.createPosition(positionData);
  }

  @Get('positions')
  @ApiOperation({
    summary: 'Get all positions',
    description: 'Retrieve all job positions with optional filtering.',
  })
  @ApiQuery({
    name: 'includeDeleted',
    required: false,
    description: 'Include soft-deleted positions',
    example: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Positions retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string' },
          status: { type: 'string' },
          isDeleted: { type: 'boolean' },
          createdAt: { type: 'string' },
          updatedAt: { type: 'string' },
        },
      },
    },
  })
  getPositions(@Query('includeDeleted') includeDeleted?: boolean) {
    return this.hrService.getPositions(includeDeleted);
  }

  @Get('positions/simple')
  @ApiOperation({
    summary: 'Get position names for dropdowns',
    description:
      'Retrieve only position names and IDs for use in select dropdowns.',
  })
  @ApiResponse({
    status: 200,
    description: 'Position names retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string' },
        },
      },
    },
  })
  getPositionNames() {
    return this.hrService.getPositionNames();
  }

  // ==================== DEPARTMENT MANAGEMENT ====================

  @Get('departments/simple')
  @ApiOperation({
    summary: 'Get department names for dropdowns',
    description:
      'Retrieve only department names and IDs for use in select dropdowns.',
  })
  @ApiResponse({
    status: 200,
    description: 'Department names retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string' },
        },
      },
    },
  })
  getDepartmentNames() {
    return this.hrService.getDepartmentNames();
  }

  // ==================== EMPLOYEE CRUD OPERATIONS ====================

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
          tabRaqami: { type: 'string' },
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
      // eslint-disable-next-line quotes
      `Retrieve information about an employee's user account and password status.`,
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

  @Get('positions/:id')
  @ApiOperation({
    summary: 'Get position by ID',
    description: 'Retrieve detailed information about a specific position.',
  })
  @ApiParam({
    name: 'id',
    description: 'Position MongoDB ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Position found successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Position not found',
  })
  getPositionById(@Param('id') id: string) {
    return this.hrService.getPositionById(id);
  }

  @Patch('positions/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiOperation({
    summary: 'Update position by ID',
    description:
      'Update specific fields of a position. Requires ADMIN or HR role.',
  })
  @ApiParam({
    name: 'id',
    description: 'Position MongoDB ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiBody({
    description: 'Position fields to update (all optional)',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        status: { type: 'string', enum: ['active', 'inactive'] },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Position updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Position not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions',
  })
  updatePosition(@Param('id') id: string, @Body() updateData: any) {
    return this.hrService.updatePosition(id, updateData);
  }

  @Patch('positions/:id/delete')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Soft delete position by ID',
    description: 'Mark a position as deleted. Requires ADMIN role.',
  })
  @ApiParam({
    name: 'id',
    description: 'Position MongoDB ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Position soft-deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Position not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Position is in use by employees',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions',
  })
  deletePosition(@Param('id') id: string) {
    return this.hrService.deletePosition(id);
  }

  @Post('departments')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiOperation({
    summary: 'Create new department',
    description:
      'Create a new organizational department. Requires ADMIN or HR role.',
  })
  @ApiBody({
    description: 'Department information',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'IT Department' },
        status: {
          type: 'string',
          enum: ['active', 'inactive'],
          example: 'active',
        },
      },
      required: ['name'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Department created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 409,
    description: 'Department name already exists',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions',
  })
  @HttpCode(HttpStatus.CREATED)
  createDepartment(@Body() departmentData: any) {
    return this.hrService.createDepartment(departmentData);
  }

  @Get('departments')
  @ApiOperation({
    summary: 'Get all departments',
    description:
      'Retrieve all organizational departments with optional filtering.',
  })
  @ApiQuery({
    name: 'includeDeleted',
    required: false,
    description: 'Include soft-deleted departments',
    example: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Departments retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          code: { type: 'string' },
          parentDepartmentId: { type: 'string' },
          managerId: { type: 'string' },
          status: { type: 'string' },
          location: { type: 'string' },
          contactPerson: { type: 'string' },
          contactEmail: { type: 'string' },
          contactPhone: { type: 'string' },
          budget: { type: 'number' },
          color: { type: 'string' },
          createdAt: { type: 'string' },
        },
      },
    },
  })
  getDepartments(@Query('includeDeleted') includeDeleted?: boolean) {
    return this.hrService.getDepartments();
  }

  @Get('departments/:id')
  @ApiOperation({
    summary: 'Get department by ID',
    description: 'Retrieve detailed information about a specific department.',
  })
  @ApiParam({
    name: 'id',
    description: 'Department MongoDB ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Department found successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Department not found',
  })
  getDepartmentById(@Param('id') id: string) {
    return this.hrService.getDepartmentById(id);
  }

  @Patch('departments/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiOperation({
    summary: 'Update department by ID',
    description:
      'Update specific fields of a department. Requires ADMIN or HR role.',
  })
  @ApiParam({
    name: 'id',
    description: 'Department MongoDB ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiBody({
    description: 'Department fields to update (all optional)',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        status: { type: 'string', enum: ['active', 'inactive'] },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Department updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Department not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions',
  })
  updateDepartment(@Param('id') id: string, @Body() updateData: any) {
    return this.hrService.updateDepartment(id, updateData);
  }

  @Patch('departments/:id/delete')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Soft delete department by ID',
    description: 'Mark a department as deleted. Requires ADMIN role.',
  })
  @ApiParam({
    name: 'id',
    description: 'Department MongoDB ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Department soft-deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Department not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Department is in use by employees',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions',
  })
  deleteDepartment(@Param('id') id: string) {
    return this.hrService.deleteDepartment(id);
  }

  // ==================== MANAGEMENT PAGE ====================

  @Get('management/overview')
  @ApiOperation({
    summary: 'Get management overview',
    description:
      'Retrieve overview data for positions and departments management page.',
  })
  @ApiResponse({
    status: 200,
    description: 'Management overview retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        positions: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            active: { type: 'number' },
            inactive: { type: 'number' },
            withEmployees: { type: 'number' },
            withoutEmployees: { type: 'number' },
          },
        },
        departments: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            active: { type: 'number' },
            inactive: { type: 'number' },
            withEmployees: { type: 'number' },
            withoutEmployees: { type: 'number' },
          },
        },
        recentChanges: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              name: { type: 'string' },
              action: { type: 'string' },
              timestamp: { type: 'string' },
            },
          },
        },
      },
    },
  })
  getManagementOverview() {
    return this.hrService.getManagementOverview();
  }

  // ==================== LOCATION ASSIGNMENT ====================

  @Post('employees/:employeeId/assign-location')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiOperation({
    summary: 'Assign employee to location',
    description:
      'Assign an employee to a specific location. Requires ADMIN or HR role.',
  })
  @ApiParam({
    name: 'employeeId',
    description: 'Employee ID',
    example: '64f1a2b3c4d5e6f7g8h9i0j1',
  })
  @ApiBody({
    description: 'Location assignment data',
    schema: {
      type: 'object',
      properties: {
        locationId: {
          type: 'string',
          description: 'Location ID to assign',
          example: '64f1a2b3c4d5e6f7g8h9i0j2',
        },
      },
      required: ['locationId'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Employee assigned to location successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Employee not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied - ADMIN or HR role required',
  })
  assignEmployeeToLocation(
    @Param('employeeId') employeeId: string,
    @Body('locationId') locationId: string,
  ) {
    return this.hrService.assignEmployeeToLocation(employeeId, locationId);
  }

  @Delete('employees/:employeeId/remove-location')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiOperation({
    summary: 'Remove employee from location',
    description:
      'Remove an employee from their assigned location. Requires ADMIN or HR role.',
  })
  @ApiParam({
    name: 'employeeId',
    description: 'Employee ID',
    example: '64f1a2b3c4d5e6f7g8h9i0j1',
  })
  @ApiResponse({
    status: 200,
    description: 'Employee removed from location successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Employee not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied - ADMIN or HR role required',
  })
  removeEmployeeFromLocation(@Param('employeeId') employeeId: string) {
    return this.hrService.removeEmployeeFromLocation(employeeId);
  }
}
