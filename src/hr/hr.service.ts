/* eslint-disable quotes */

/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { Employee } from '../schemas/employee.schema';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { Fingerprint } from '../schemas/fingerprint.schema';
import { Location } from '../schemas/location.schema';
import { LocationService } from '../location/location.service';
import { Position } from '../schemas/position.schema';
import { Department } from '../schemas/department.schema';
import { AuthService } from '../auth/auth.service';
// import { UserRole } from '../auth/entities/user.entity';
import { GetEmployeesQueryDto } from './dto/get-employees-query.dto';
import {
  BulkUpdateEmployeesDto,
  BulkDeleteEmployeesDto,
  BulkRestoreEmployeesDto,
  BulkPasswordResetDto,
} from './dto/bulk-employee-operations.dto';
import { HrStatisticsDto } from './dto/hr-statistics.dto';
import * as XLSX from 'xlsx';
import { ExcelUploadResponseDto } from './dto/upload-excel.dto';

@Injectable()
export class HrService {
  private readonly logger = new Logger(HrService.name);

  constructor(
    @InjectModel(Employee.name) private employeeModel: Model<Employee>,
    @InjectModel(Fingerprint.name)
    private fingerprintModel: Model<Fingerprint>,
    @InjectModel(Position.name) private positionModel: Model<Position>,
    @InjectModel(Department.name) private departmentModel: Model<Department>,
    @InjectModel(Location.name) private locationModel: Model<Location>,
    private authService: AuthService,
    private locationService: LocationService,
  ) {}

  private generateUsername(fullName: string): string {
    // Convert full name to username format (e.g., "Sarvarbek Xazratov" -> "sarvarbek.xazratov")
    const nameParts = fullName.toLowerCase().split(' ');
    const username = nameParts.join('.');

    // Add random number if username already exists
    const randomSuffix = Math.floor(Math.random() * 1000);
    return `${username}.${randomSuffix}`;
  }

  private generatePassword(): string {
    // Generate a random 8-character password
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  async createEmployee(dto: CreateEmployeeDto) {
    try {
      // Generate unique tabRaqami if it already exists
      let tabRaqami = dto.tabRaqami;
      let counter = 1;
      while (
        await this.employeeModel.findOne({ tabRaqami, isDeleted: false })
      ) {
        tabRaqami = `${dto.tabRaqami}_${counter}`;
        counter++;
      }

      // Generate unique passportId if it already exists and is provided
      let passportId = dto.passportId;
      if (passportId) {
        counter = 1;
        while (
          await this.employeeModel.findOne({ passportId, isDeleted: false })
        ) {
          passportId = `${dto.passportId}_${counter}`;
          counter++;
        }
      }

      // Create employee with unique values
      const employeeData = {
        ...dto,
        tabRaqami,
        passportId,
      };

      const employee = new this.employeeModel(employeeData);
      const savedEmployee = await employee.save();

      // Return employee without user account
      return {
        ...savedEmployee.toObject(),
        message: 'Employee created successfully. No user account created.',
        warnings: [
          ...(tabRaqami !== dto.tabRaqami
            ? [`Tab raqami o'zgartirildi: ${tabRaqami}`]
            : []),
          ...(passportId && passportId !== dto.passportId
            ? [`Passport ID o'zgartirildi: ${passportId}`]
            : []),
        ],
      };
    } catch (err) {
      throw new BadRequestException(
        `Employee yaratishda xatolik: ${err.message}`,
      );
    }
  }

  async getEmployees(query: GetEmployeesQueryDto) {
    const {
      search,
      status,
      department,
      position,
      hireDateFrom,
      hireDateTo,
      birthDateFrom,
      birthDateTo,
      salaryFrom,
      salaryTo,
      hasUserAccount,
      hasWorkplace,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      includeDeleted = false,
    } = query;

    // Build filter object
    const filter: FilterQuery<Employee> = {};

    // Soft delete filter
    if (!includeDeleted) {
      filter.isDeleted = false;
    }

    // Status filter
    if (status) {
      filter.status = status;
    }

    // Department filter
    if (department) {
      filter.department = { $regex: department, $options: 'i' };
    }

    // Position filter
    if (position) {
      filter.position = { $regex: position, $options: 'i' };
    }

    // Date range filters
    if (hireDateFrom || hireDateTo) {
      filter.hireDate = {};
      if (hireDateFrom) filter.hireDate.$gte = new Date(hireDateFrom);
      if (hireDateTo) filter.hireDate.$lte = new Date(hireDateTo);
    }

    if (birthDateFrom || birthDateTo) {
      filter.birthDate = {};
      if (birthDateFrom) filter.birthDate.$gte = new Date(birthDateFrom);
      if (birthDateTo) filter.birthDate.$lte = new Date(birthDateTo);
    }

    // Salary range filter
    if (salaryFrom || salaryTo) {
      filter.salary = {};
      if (salaryFrom) filter.salary.$gte = salaryFrom;
      if (salaryTo) filter.salary.$lte = salaryTo;
    }

    // User account filter
    if (hasUserAccount !== undefined) {
      if (hasUserAccount) {
        filter.userId = { $exists: true, $ne: null };
      } else {
        filter.$or = [{ userId: { $exists: false } }, { userId: null }];
      }
    }

    // Workplace filter
    if (hasWorkplace !== undefined) {
      if (hasWorkplace) {
        filter.primaryWorkplaceId = { $exists: true, $ne: null };
      } else {
        filter.$or = [
          { primaryWorkplaceId: { $exists: false } },
          { primaryWorkplaceId: null },
        ];
      }
    }

    // Search filter (full name, position, department, tab raqami, passport ID)
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { position: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
        { tabRaqami: { $regex: search, $options: 'i' } },
        { passportId: { $regex: search, $options: 'i' } },
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    // Execute queries
    const [employees, total] = await Promise.all([
      this.employeeModel
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.employeeModel.countDocuments(filter).exec(),
    ]);

    const pages = Math.ceil(total / limit);
    const hasNext = page < pages;
    const hasPrev = page > 1;

    // Build filters summary
    const filters = {
      ...(status && { status }),
      ...(department && { department }),
      ...(position && { position }),
      ...(search && { search }),
      ...(hireDateFrom && { hireDateFrom }),
      ...(hireDateTo && { hireDateTo }),
      ...(birthDateFrom && { birthDateFrom }),
      ...(birthDateTo && { birthDateTo }),
      ...(salaryFrom && { salaryFrom }),
      ...(salaryTo && { salaryTo }),
      ...(hasUserAccount !== undefined && { hasUserAccount }),
      ...(hasWorkplace !== undefined && { hasWorkplace }),
    };

    return {
      data: employees,
      meta: {
        total,
        page,
        limit,
        pages,
        count: employees.length,
        hasNext,
        hasPrev,
      },
      filters,
    };
  }

  async getEmployeeById(id: string) {
    try {
      const employee = await this.employeeModel
        .findOne({ _id: new Types.ObjectId(id), isDeleted: false })
        .lean()
        .exec();
      if (!employee) throw new NotFoundException('Employee topilmadi');
      return employee;
    } catch (error) {
      if (error.name === 'CastError') {
        throw new BadRequestException('Invalid employee ID format');
      }
      throw error;
    }
  }

  async updateEmployee(id: string, dto: UpdateEmployeeDto) {
    try {
      const employee = await this.employeeModel
        .findOne({ _id: new Types.ObjectId(id), isDeleted: false })
        .exec();
      if (!employee) throw new NotFoundException('Employee topilmadi');

      // Update only provided fields
      Object.assign(employee, dto);
      await employee.save();

      return employee.toObject();
    } catch (error) {
      if (error.name === 'CastError') {
        throw new BadRequestException('Invalid employee ID format');
      }
      throw error;
    }
  }

  async deleteEmployee(id: string) {
    try {
      const result = await this.employeeModel.updateOne(
        { _id: new Types.ObjectId(id), isDeleted: false },
        { $set: { isDeleted: true, deletedAt: new Date() } },
      );

      if (result.matchedCount === 0) {
        throw new NotFoundException('Employee topilmadi');
      }

      return { success: true };
    } catch (error) {
      if (error.name === 'CastError') {
        throw new BadRequestException('Invalid employee ID format');
      }
      throw error;
    }
  }

  async getEmployeeCredentials(employeeId: string) {
    const employee = await this.employeeModel
      .findOne({ _id: new Types.ObjectId(employeeId), isDeleted: false })
      .lean()
      .exec();
    if (!employee) throw new NotFoundException('Employee topilmadi');

    if (!employee.userId) {
      throw new ConflictException('Employee does not have a user account');
    }

    return {
      employeeId: employee._id,
      fullName: employee.fullName,
      username: employee.username,
      hasTempPassword: !!employee.tempPassword,
      note: employee.tempPassword
        ? 'Employee has temporary password'
        : 'Employee has changed password',
    };
  }

  async getAllEmployeeCredentials() {
    const employees = await this.employeeModel
      .find({ isDeleted: false, userId: { $exists: true, $ne: null } })
      .select('fullName username department position tabRaqami tempPassword')
      .lean()
      .exec();

    return employees.map((emp) => ({
      employeeId: emp._id,
      fullName: emp.fullName,
      username: emp.username,
      department: emp.department,
      position: emp.position,
      tabRaqami: emp.tabRaqami,
      hasTempPassword: !!emp.tempPassword,
      tempPassword: emp.tempPassword || null,
      note: emp.tempPassword
        ? 'Temporary password - change required'
        : 'Password changed by user',
    }));
  }

  async resetEmployeePassword(employeeId: string) {
    const employee = await this.employeeModel
      .findOne({ _id: new Types.ObjectId(employeeId), isDeleted: false })
      .exec();
    if (!employee) throw new NotFoundException('Employee topilmadi');

    if (!employee.userId) {
      throw new ConflictException('Employee does not have a user account');
    }

    const newPassword = this.generatePassword();
    employee.tempPassword = newPassword;
    await employee.save();

    return {
      message: 'Password reset successfully',
      username: employee.username,
      newPassword,
      note: 'Employee must change password on next login',
    };
  }

  async addFingerprint(employeeId: string, templateBase64: string) {
    const employee = await this.employeeModel
      .findOne({ _id: new Types.ObjectId(employeeId), isDeleted: false })
      .exec();
    if (!employee) throw new NotFoundException('Employee topilmadi');

    // Check fingerprint limit (max 10 per employee)
    const existingFingerprints = await this.fingerprintModel
      .countDocuments({
        employeeId: new Types.ObjectId(employeeId),
        status: 'active',
      })
      .exec();

    if (existingFingerprints >= 10) {
      throw new ConflictException('Fingerprint limit (10) exceeded');
    }

    const fingerprint = new this.fingerprintModel({
      employeeId: new Types.ObjectId(employeeId),
      template: templateBase64,
      status: 'active',
    });

    await fingerprint.save();
    return fingerprint.toObject();
  }

  async listFingerprints(
    employeeId: string,
    page = 1,
    limit = 20,
    includeTemplate = false,
    status?: 'active' | 'revoked',
  ) {
    const filter: FilterQuery<Fingerprint> = {
      employeeId: new Types.ObjectId(employeeId),
    };
    if (status) filter.status = status;

    const skip = (page - 1) * limit;
    const [fingerprints, total] = await Promise.all([
      this.fingerprintModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select(includeTemplate ? {} : { template: 0 })
        .lean()
        .exec(),
      this.fingerprintModel.countDocuments(filter).exec(),
    ]);

    const pages = Math.ceil(total / limit);
    return {
      data: fingerprints,
      meta: {
        total,
        page,
        limit,
        pages,
        count: fingerprints.length,
        hasNext: page < pages,
        hasPrev: page > 1,
      },
    };
  }

  async listAllFingerprints(
    page = 1,
    limit = 20,
    includeTemplate = false,
    status?: 'active' | 'revoked',
    employeeId?: string,
  ) {
    const filter: FilterQuery<Fingerprint> = {};
    if (status) filter.status = status;
    if (employeeId) filter.employeeId = new Types.ObjectId(employeeId);

    const skip = (page - 1) * limit;
    const [fingerprints, total] = await Promise.all([
      this.fingerprintModel
        .find(filter)
        .populate('employeeId', 'fullName department position')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select(includeTemplate ? {} : { template: 0 })
        .lean()
        .exec(),
      this.fingerprintModel.countDocuments(filter).exec(),
    ]);

    const pages = Math.ceil(total / limit);
    return {
      data: fingerprints,
      meta: {
        total,
        page,
        limit,
        pages,
        count: fingerprints.length,
        hasNext: page < pages,
        hasPrev: page > 1,
      },
    };
  }

  // 🔹 BULK OPERATIONS
  async bulkUpdateEmployees(dto: BulkUpdateEmployeesDto) {
    const { employeeIds, ...updateData } = dto;

    if (!updateData.status && !updateData.department && !updateData.position) {
      throw new BadRequestException(
        'At least one field must be provided for bulk update',
      );
    }

    const result = await this.employeeModel.updateMany(
      {
        _id: { $in: employeeIds.map((id) => new Types.ObjectId(id)) },
        isDeleted: false,
      },
      { $set: updateData },
    );

    return {
      message: `Successfully updated ${result.modifiedCount} employees`,
      updatedCount: result.modifiedCount,
      totalCount: employeeIds.length,
    };
  }

  async bulkDeleteEmployees(dto: BulkDeleteEmployeesDto) {
    const { employeeIds, reason } = dto;

    const result = await this.employeeModel.updateMany(
      {
        _id: { $in: employeeIds.map((id) => new Types.ObjectId(id)) },
        isDeleted: false,
      },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          ...(reason && { deleteReason: reason }),
        },
      },
    );

    return {
      message: `Successfully deleted ${result.modifiedCount} employees`,
      deletedCount: result.modifiedCount,
      totalCount: employeeIds.length,
      reason,
    };
  }

  async bulkRestoreEmployees(dto: BulkRestoreEmployeesDto) {
    const { employeeIds } = dto;

    const result = await this.employeeModel.updateMany(
      {
        _id: { $in: employeeIds.map((id) => new Types.ObjectId(id)) },
        isDeleted: true,
      },
      {
        $set: {
          isDeleted: false,
          deleteReason: undefined,
        },
        $unset: { deletedAt: 1 },
      },
    );

    return {
      message: `Successfully restored ${result.modifiedCount} employees`,
      restoredCount: result.modifiedCount,
      totalCount: employeeIds.length,
    };
  }

  async bulkPasswordReset(dto: BulkPasswordResetDto) {
    const { employeeIds, note } = dto;

    const employees = await this.employeeModel
      .find({
        _id: { $in: employeeIds.map((id) => new Types.ObjectId(id)) },
        isDeleted: false,
        userId: { $exists: true, $ne: null },
      })
      .exec();

    if (employees.length === 0) {
      throw new BadRequestException(
        'No valid employees found for password reset',
      );
    }

    const resetResults: Array<{
      employeeId: any;
      fullName: string;
      username: string | undefined;
      newPassword: string;
    }> = [];

    for (const employee of employees) {
      const newPassword = this.generatePassword();
      employee.tempPassword = newPassword;
      await employee.save();

      resetResults.push({
        employeeId: employee._id,
        fullName: employee.fullName,
        username: employee.username,
        newPassword,
      });
    }

    return {
      message: `Successfully reset passwords for ${resetResults.length} employees`,
      resetCount: resetResults.length,
      totalCount: employeeIds.length,
      results: resetResults,
      note,
    };
  }

  // 🔹 STATISTICS & ANALYTICS
  async getHrStatistics(): Promise<HrStatisticsDto> {
    const [
      totalEmployees,
      activeEmployees,
      inactiveEmployees,
      deletedEmployees,
      employeesWithAccounts,
      employeesWithWorkplaces,
      departmentStats,
      positionStats,
      recentHires,
      employeesWithTempPasswords,
      salaryStats,
    ] = await Promise.all([
      this.employeeModel.countDocuments({ isDeleted: false }),
      this.employeeModel.countDocuments({ status: 'active', isDeleted: false }),
      this.employeeModel.countDocuments({
        status: 'inactive',
        isDeleted: false,
      }),
      this.employeeModel.countDocuments({ isDeleted: true }),
      this.employeeModel.countDocuments({
        userId: { $exists: true, $ne: null },
        isDeleted: false,
      }),
      this.employeeModel.countDocuments({
        primaryWorkplaceId: { $exists: true, $ne: null },
        isDeleted: false,
      }),
      this.employeeModel.aggregate([
        { $match: { isDeleted: false } },
        {
          $group: {
            _id: '$department',
            totalEmployees: { $sum: 1 },
            activeEmployees: {
              $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] },
            },
            inactiveEmployees: {
              $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] },
            },
            totalSalary: { $sum: { $ifNull: ['$salary', 0] } },
          },
        },
        {
          $project: {
            department: '$_id',
            totalEmployees: 1,
            activeEmployees: 1,
            inactiveEmployees: 1,
            averageSalary: { $divide: ['$totalSalary', '$totalEmployees'] },
          },
        },
        { $sort: { totalEmployees: -1 } },
      ]),
      this.employeeModel.aggregate([
        { $match: { isDeleted: false } },
        {
          $group: {
            _id: '$position',
            count: { $sum: 1 },
            totalSalary: { $sum: { $ifNull: ['$salary', 0] } },
          },
        },
        {
          $project: {
            position: '$_id',
            count: 1,
            averageSalary: { $divide: ['$totalSalary', '$count'] },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      this.employeeModel.countDocuments({
        hireDate: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        isDeleted: false,
      }),
      this.employeeModel.countDocuments({
        tempPassword: { $exists: true, $ne: null },
        isDeleted: false,
      }),
      this.employeeModel.aggregate([
        { $match: { isDeleted: false, salary: { $exists: true, $ne: null } } },
        {
          $group: {
            _id: null,
            averageSalary: { $avg: '$salary' },
            totalSalary: { $sum: '$salary' },
          },
        },
      ]),
    ]);

    const avgSalary = salaryStats[0]?.averageSalary || 0;
    const totalSalaryBudget = salaryStats[0]?.totalSalary || 0;

    return {
      totalEmployees,
      activeEmployees,
      inactiveEmployees,
      deletedEmployees,
      employeesWithAccounts,
      employeesWithoutAccounts: totalEmployees - employeesWithAccounts,
      employeesWithWorkplaces,
      employeesWithoutWorkplaces: totalEmployees - employeesWithWorkplaces,
      totalDepartments: departmentStats.length,
      totalPositions: positionStats.length,
      averageSalary: Math.round(avgSalary),
      totalSalaryBudget: Math.round(totalSalaryBudget),
      departmentStats: departmentStats.map((stat) => ({
        ...stat,
        averageSalary: Math.round(stat.averageSalary),
      })),
      topPositions: positionStats.map((stat) => ({
        ...stat,
        averageSalary: Math.round(stat.averageSalary),
      })),
      recentHires,
      employeesWithTempPasswords,
    };
  }

  // 🔹 POSITION MANAGEMENT
  async createPosition(positionData: Partial<Position>) {
    try {
      const position = new this.positionModel(positionData);
      const savedPosition = await position.save();
      return savedPosition.toObject();
    } catch (err) {
      if (err.code === 11000) {
        throw new ConflictException('Position name allaqachon mavjud');
      }
      throw err;
    }
  }

  async getPositions(includeDeleted = false) {
    const filter: FilterQuery<Position> = {};
    if (!includeDeleted) {
      filter.isDeleted = false;
    }

    return this.positionModel.find(filter).sort({ name: 1 }).lean().exec();
  }

  async getPositionById(id: string) {
    const position = await this.positionModel
      .findOne({ _id: id, isDeleted: false })
      .lean()
      .exec();
    if (!position) throw new NotFoundException('Position topilmadi');
    return position;
  }

  async updatePosition(id: string, updateData: Partial<Position>) {
    const position = await this.positionModel
      .findOne({ _id: id, isDeleted: false })
      .exec();
    if (!position) throw new NotFoundException('Position topilmadi');

    Object.assign(position, updateData);
    await position.save();
    return position.toObject();
  }

  async deletePosition(id: string) {
    const position = await this.positionModel
      .findOne({ _id: id, isDeleted: false })
      .exec();
    if (!position) throw new NotFoundException('Position topilmadi');

    // Check if position is used by any employees
    const employeeCount = await this.employeeModel
      .countDocuments({ position: position.name, isDeleted: false })
      .exec();

    if (employeeCount > 0) {
      throw new BadRequestException(
        `Bu lavozim ${employeeCount} ta xodim tomonidan ishlatilmoqda. Avval xodimlarni boshqa lavozimga ko'chiring.`,
      );
    }

    position.isDeleted = true;
    position.deletedAt = new Date();
    await position.save();

    return position.toObject();
  }

  // 🔹 DEPARTMENT MANAGEMENT
  async createDepartment(departmentData: Partial<Department>) {
    try {
      const department = new this.departmentModel(departmentData);
      const savedDepartment = await department.save();
      return savedDepartment.toObject();
    } catch (err) {
      if (err.code === 11000) {
        throw new ConflictException('Department name allaqachon mavjud');
      }
      throw err;
    }
  }
  async getDepartments() {
    const departments = await this.departmentModel
      .distinct('name', { isDeleted: false })
      .exec();
    return departments.sort();
  }

  async getDepartmentById(id: string) {
    const department = await this.departmentModel
      .findOne({ _id: id, isDeleted: false })
      .lean()
      .exec();
    if (!department) throw new NotFoundException('Department topilmadi');
    return department;
  }

  async updateDepartment(id: string, updateData: Partial<Department>) {
    const department = await this.departmentModel
      .findOne({ _id: id, isDeleted: false })
      .exec();
    if (!department) throw new NotFoundException('Department topilmadi');

    Object.assign(department, updateData);
    await department.save();
    return department.toObject();
  }

  async deleteDepartment(id: string) {
    const department = await this.departmentModel
      .findOne({ _id: id, isDeleted: false })
      .exec();
    if (!department) throw new NotFoundException('Department topilmadi');

    // Check if department is used by any employees
    const employeeCount = await this.employeeModel
      .countDocuments({ department: department.name, isDeleted: false })
      .exec();

    if (employeeCount > 0) {
      throw new BadRequestException(
        `Bu bo'lim ${employeeCount} ta xodim tomonidan ishlatilmoqda. Avval xodimlarni boshqa bo'limga ko'chiring.`,
      );
    }

    department.isDeleted = true;
    department.deletedAt = new Date();
    await department.save();

    return department.toObject();
  }

  // 🔹 UTILITY METHODS (Updated)
  async getDepartmentNames() {
    const departments = await this.departmentModel
      .find({ isDeleted: false })
      .select('name');
    return departments;
  }

  async getPositionNames() {
    const positions = await this.positionModel
      .distinct('name', { isDeleted: false })
      .exec();
    return positions.sort();
  }

  async getEmployeesByDepartment(department: string) {
    return this.employeeModel
      .find({ department, isDeleted: false })
      .select('fullName position tabRaqami status')
      .sort({ fullName: 1 })
      .lean()
      .exec();
  }

  async getEmployeesByPosition(position: string) {
    return this.employeeModel
      .find({ position, isDeleted: false })
      .select('fullName department tabRaqami status')
      .sort({ fullName: 1 })
      .lean()
      .exec();
  }

  // 🔹 EXCEL UPLOAD & IMPORT
  async uploadExcelFile(
    file: Express.Multer.File,
  ): Promise<ExcelUploadResponseDto> {
    try {
      // Read Excel file
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (jsonData.length < 2) {
        throw new BadRequestException(
          'Excel file must contain at least a header row and one data row',
        );
      }

      // Find the actual header row (skip empty rows and title rows)
      let headerRowIndex = 0;
      for (let i = 0; i < Math.min(5, jsonData.length); i++) {
        const row = jsonData[i] as any[];
        if (row && row.some((cell) => cell && cell.toString().trim())) {
          // Check if this row looks like headers (contains common header keywords)
          const rowText = row.join(' ').toLowerCase();
          if (
            rowText.includes('f.i.o') ||
            rowText.includes('ism') ||
            rowText.includes('full name') ||
            rowText.includes('lavozim') ||
            rowText.includes('position') ||
            rowText.includes("bo'lim") ||
            rowText.includes('department') ||
            rowText.includes('tab') ||
            rowText.includes('telefon') ||
            rowText.includes('phone')
          ) {
            headerRowIndex = i;
            break;
          }
        }
      }

      // Extract headers and data
      const headers = jsonData[headerRowIndex] as string[];
      const dataRows = jsonData.slice(headerRowIndex + 1) as any[][];

      // Debug: Log the actual headers and first few rows
      console.log('Excel Headers:', headers);
      console.log('First 3 data rows:', dataRows.slice(0, 3));

      // Expected columns mapping (Uzbek/Russian to English)
      const columnMapping = {
        'F.I.O': 'fullName',
        'Ф.И.О': 'fullName',
        'Full Name': 'fullName',
        Ism: 'fullName',
        'Ism Familiya': 'fullName',
        "To'liq ism": 'fullName',
        'Полное имя': 'fullName',
        Имя: 'fullName',
        Фамилия: 'fullName',
        Name: 'fullName',
        'Employee Name': 'fullName',
        Lavozim: 'position',
        Должность: 'position',
        Position: 'position',
        "Bo'lim": 'department',
        Отдел: 'department',
        Department: 'department',
        'Tab raqami': 'tabRaqami',
        'Табельный номер': 'tabRaqami',
        'Employee ID': 'tabRaqami',
        'Xodim raqami': 'tabRaqami',
        ID: 'tabRaqami',
        '№': 'tabRaqami',
        Telefon: 'phone',
        Телефон: 'phone',
        Phone: 'phone',
        Tel: 'phone',
        Мобильный: 'phone',
        'Телефонный номер': 'phone',
        Manzil: 'address',
        Адрес: 'address',
        Address: 'address',
        Maosh: 'salary',
        Зарплата: 'salary',
        Salary: 'salary',
        'Ishga qabul qilingan sana': 'hireDate',
        'Дата приема': 'hireDate',
        'Hire Date': 'hireDate',
        "Tug'ilgan sana": 'birthDate',
        'Дата рождения': 'birthDate',
        'Birth Date': 'birthDate',
        Passport: 'passportId',
        Паспорт: 'passportId',
        'Passport ID': 'passportId',
      };

      // Map headers to our field names
      const mappedHeaders = headers.map((header) => {
        const cleanHeader = header?.toString().trim();
        return columnMapping[cleanHeader] || cleanHeader;
      });

      // Debug: Log the mapped headers
      console.log('Mapped Headers:', mappedHeaders);

      // Process data
      const departments = new Set<string>();
      const positions = new Set<string>();
      const employees: any[] = [];
      const errors: string[] = [];

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        if (!row || row.every((cell) => !cell)) continue; // Skip empty rows

        try {
          const employeeData: any = {};

          // Map row data to employee fields
          mappedHeaders.forEach((field, index) => {
            const value = row[index];
            if (value !== undefined && value !== null && value !== '') {
              switch (field) {
                case 'fullName':
                  employeeData.fullName = value.toString().trim();
                  break;
                case 'position':
                  employeeData.position = value.toString().trim();
                  positions.add(employeeData.position);
                  break;
                case 'department':
                  employeeData.department = value.toString().trim();
                  departments.add(employeeData.department);
                  break;
                case 'tabRaqami':
                  employeeData.tabRaqami = value.toString().trim();
                  break;
                case 'phone':
                  employeeData.phones = [value.toString().trim()];
                  break;
                case 'address':
                  employeeData.address = value.toString().trim();
                  break;
                case 'salary': {
                  const salary = parseFloat(value.toString());
                  if (!isNaN(salary)) employeeData.salary = salary;
                  break;
                }
                case 'hireDate': {
                  const hireDate = new Date(value);
                  if (!isNaN(hireDate.getTime()))
                    employeeData.hireDate = hireDate;
                  break;
                }
                case 'birthDate': {
                  const birthDate = new Date(value);
                  if (!isNaN(birthDate.getTime()))
                    employeeData.birthDate = birthDate;
                  break;
                }
                case 'passportId':
                  employeeData.passportId = value.toString().trim();
                  break;
              }
            }
          });

          // Validate required fields
          if (!employeeData.fullName) {
            errors.push(`Row ${i + 2}: Full name is required`);
            continue;
          }
          if (!employeeData.position) {
            errors.push(`Row ${i + 2}: Position is required`);
            continue;
          }
          if (!employeeData.department) {
            errors.push(`Row ${i + 2}: Department is required`);
            continue;
          }
          if (!employeeData.tabRaqami) {
            errors.push(`Row ${i + 2}: Tab raqami is required`);
            continue;
          }
          // Phone numbers are now optional, no validation needed

          // Set default values
          employeeData.status = 'active';
          employeeData.isDeleted = false;

          employees.push(employeeData);
        } catch (error) {
          errors.push(`Row ${i + 2}: ${error.message}`);
        }
      }

      // Create departments
      let departmentsCreated = 0;
      for (const deptName of departments) {
        try {
          await this.createDepartment({ name: deptName, status: 'active' });
          departmentsCreated++;
        } catch {
          // Department might already exist, that's okay
        }
      }

      // Create positions
      let positionsCreated = 0;
      for (const posName of positions) {
        try {
          await this.createPosition({ name: posName, status: 'active' });
          positionsCreated++;
        } catch {
          // Position might already exist, that's okay
        }
      }

      // Create employees
      let employeesCreated = 0;
      let employeesSkipped = 0;

      for (const employeeData of employees) {
        try {
          const result = await this.createEmployee(employeeData);
          employeesCreated++;

          // Add warnings to errors array if any
          if (result.warnings && result.warnings.length > 0) {
            errors.push(
              `Employee ${employeeData.fullName}: ${result.warnings.join(', ')}`,
            );
          }
        } catch (error) {
          employeesSkipped++;
          errors.push(`Employee ${employeeData.fullName}: ${error.message}`);
        }
      }

      return {
        status: 'success',
        departmentsCreated,
        positionsCreated,
        employeesCreated,
        employeesSkipped,
        errors,
        message: `Successfully imported ${employeesCreated} employees, ${departmentsCreated} departments, and ${positionsCreated} positions. ${employeesSkipped} employees were skipped due to duplicates.`,
      };
    } catch (error) {
      throw new BadRequestException(
        `Excel file processing failed: ${error.message}`,
      );
    }
  }

  // 🔹 MANAGEMENT OVERVIEW
  async getManagementOverview() {
    const [
      positionStats,
      departmentStats,
      positionsWithEmployees,
      departmentsWithEmployees,
      recentPositions,
      recentDepartments,
    ] = await Promise.all([
      // Position statistics
      this.positionModel.aggregate([
        { $match: { isDeleted: false } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
            inactive: {
              $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] },
            },
          },
        },
      ]),
      // Department statistics
      this.departmentModel.aggregate([
        { $match: { isDeleted: false } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
            inactive: {
              $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] },
            },
          },
        },
      ]),
      // Positions with employees
      this.employeeModel.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$position' } },
        { $count: 'count' },
      ]),
      // Departments with employees
      this.employeeModel.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$department' } },
        { $count: 'count' },
      ]),
      // Recent position changes
      this.positionModel
        .find({ isDeleted: false })
        .sort({ updatedAt: -1 })
        .limit(5)
        .select('name updatedAt')
        .lean()
        .exec(),
      // Recent department changes
      this.departmentModel
        .find({ isDeleted: false })
        .sort({ updatedAt: -1 })
        .limit(5)
        .select('name updatedAt')
        .lean()
        .exec(),
    ]);

    const positionsWithEmployeesCount = positionsWithEmployees[0]?.count || 0;
    const departmentsWithEmployeesCount =
      departmentsWithEmployees[0]?.count || 0;

    const positionData = positionStats[0] || {
      total: 0,
      active: 0,
      inactive: 0,
    };
    const departmentData = departmentStats[0] || {
      total: 0,
      active: 0,
      inactive: 0,
    };

    // Build recent changes
    const recentChanges = [
      ...recentPositions.map((pos: any) => ({
        type: 'position',
        name: pos.name,
        action: 'updated',
        timestamp: pos.updatedAt || pos.createdAt || new Date(),
      })),
      ...recentDepartments.map((dept: any) => ({
        type: 'department',
        name: dept.name,
        action: 'updated',
        timestamp: dept.updatedAt || dept.createdAt || new Date(),
      })),
    ]
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      .slice(0, 10);

    return {
      positions: {
        total: positionData.total,
        active: positionData.active,
        inactive: positionData.inactive,
        withEmployees: positionsWithEmployeesCount,
        withoutEmployees: positionData.total - positionsWithEmployeesCount,
      },
      departments: {
        total: departmentData.total,
        active: departmentData.active,
        inactive: departmentData.inactive,
        withEmployees: departmentsWithEmployeesCount,
        withoutEmployees: departmentData.total - departmentsWithEmployeesCount,
      },
      recentChanges,
    };
  }

  // ==================== LOCATION ASSIGNMENT ====================

  async assignEmployeeToLocation(
    employeeId: string,
    locationId: string,
  ): Promise<{ message: string }> {
    const employee = await this.employeeModel.findById(employeeId);
    if (!employee) {
      throw new NotFoundException('Xodim topilmadi');
    }

    // Location ni tekshirish
    const location = await this.locationService.findOne(locationId);
    if (!location) {
      throw new NotFoundException('Location topilmadi');
    }

    employee.primaryLocationId = locationId as any;
    employee.primaryLocationName = location.name;
    await employee.save();

    this.logger.log(`Xodim ${employee.fullName} location ga biriktirildi`);

    return { message: 'Xodim location ga muvaffaqiyatli biriktirildi' };
  }

  async removeEmployeeFromLocation(
    employeeId: string,
  ): Promise<{ message: string }> {
    const employee = await this.employeeModel.findById(employeeId);
    if (!employee) {
      throw new NotFoundException('Xodim topilmadi');
    }

    employee.primaryLocationId = null;
    employee.primaryLocationName = undefined;
    await employee.save();

    this.logger.log(`Xodim ${employee.fullName} location dan olib tashlandi`);

    return { message: 'Xodim location dan muvaffaqiyatli olib tashlandi' };
  }
}
