/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
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
import { Position } from '../schemas/position.schema';
import { Department } from '../schemas/department.schema';
import { AuthService } from '../auth/auth.service';
import { UserRole } from '../auth/entities/user.entity';
import { GetEmployeesQueryDto } from './dto/get-employees-query.dto';
import {
  BulkUpdateEmployeesDto,
  BulkDeleteEmployeesDto,
  BulkRestoreEmployeesDto,
  BulkPasswordResetDto,
} from './dto/bulk-employee-operations.dto';
import { HrStatisticsDto } from './dto/hr-statistics.dto';

@Injectable()
export class HrService {
  constructor(
    @InjectModel(Employee.name) private employeeModel: Model<Employee>,
    @InjectModel(Fingerprint.name)
    private fingerprintModel: Model<Fingerprint>,
    @InjectModel(Position.name) private positionModel: Model<Position>,
    @InjectModel(Department.name) private departmentModel: Model<Department>,
    private authService: AuthService,
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
      // Create employee first
      const employee = new this.employeeModel(dto);
      const savedEmployee = await employee.save();

      // Generate username and password for the employee
      const username = this.generateUsername(dto.fullName);
      const password = this.generatePassword();

      try {
        // Create user account for the employee
        const userAccount = await this.authService.register({
          username,
          email: dto.email,
          password,
          firstName: dto.fullName.split(' ')[0] || dto.fullName,
          lastName: dto.fullName.split(' ').slice(1).join(' ') || '',
          phone: dto.phones[0] || '',
        });

        // Update employee with user account info
        savedEmployee.userId = userAccount.user.id as any; // Convert string to ObjectId
        savedEmployee.username = username;
        savedEmployee.tempPassword = password;
        await savedEmployee.save();

        return {
          ...savedEmployee.toObject(),
          userAccount: {
            username,
            password,
            message:
              'Employee account created successfully. Please change password on first login.',
          },
        };
      } catch (userError) {
        // If user creation fails, delete the employee and throw error
        await this.employeeModel.findByIdAndDelete(savedEmployee._id);
        throw new ConflictException(
          `Employee created but user account creation failed: ${userError.message}`,
        );
      }
    } catch (err) {
      if (err.code === 11000) {
        throw new ConflictException('Email yoki Passport ID allaqachon mavjud');
      }
      throw err;
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

    // Search filter (full name, position, department, email)
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { position: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
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
    const employee = await this.employeeModel
      .findOne({ _id: id, isDeleted: false })
      .lean()
      .exec();
    if (!employee) throw new NotFoundException('Employee topilmadi');
    return employee;
  }

  async updateEmployee(id: string, dto: UpdateEmployeeDto) {
    const employee = await this.employeeModel
      .findOne({ _id: id, isDeleted: false })
      .exec();
    if (!employee) throw new NotFoundException('Employee topilmadi');

    // Update only provided fields
    Object.assign(employee, dto);
    await employee.save();

    return employee.toObject();
  }

  async deleteEmployee(id: string) {
    const employee = await this.employeeModel
      .findOne({ _id: id, isDeleted: false })
      .exec();
    if (!employee) throw new NotFoundException('Employee topilmadi');

    employee.isDeleted = true;
    employee.deletedAt = new Date();
    await employee.save();

    return employee.toObject();
  }

  async getEmployeeCredentials(employeeId: string) {
    const employee = await this.employeeModel
      .findOne({ _id: employeeId, isDeleted: false })
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
      email: employee.email,
      hasTempPassword: !!employee.tempPassword,
      note: employee.tempPassword
        ? 'Employee has temporary password'
        : 'Employee has changed password',
    };
  }

  async getAllEmployeeCredentials() {
    const employees = await this.employeeModel
      .find({ isDeleted: false, userId: { $exists: true, $ne: null } })
      .select('fullName username email department position tempPassword')
      .lean()
      .exec();

    return employees.map((emp) => ({
      employeeId: emp._id,
      fullName: emp.fullName,
      username: emp.username,
      email: emp.email,
      department: emp.department,
      position: emp.position,
      hasTempPassword: !!emp.tempPassword,
      tempPassword: emp.tempPassword || null,
      note: emp.tempPassword
        ? 'Temporary password - change required'
        : 'Password changed by user',
    }));
  }

  async resetEmployeePassword(employeeId: string) {
    const employee = await this.employeeModel
      .findOne({ _id: employeeId, isDeleted: false })
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
      .findOne({ _id: employeeId, isDeleted: false })
      .exec();
    if (!employee) throw new NotFoundException('Employee topilmadi');

    // Check fingerprint limit (max 10 per employee)
    const existingFingerprints = await this.fingerprintModel
      .countDocuments({ employeeId, status: 'active' })
      .exec();

    if (existingFingerprints >= 10) {
      throw new ConflictException('Fingerprint limit (10) exceeded');
    }

    const fingerprint = new this.fingerprintModel({
      employeeId,
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
    const filter: FilterQuery<Fingerprint> = { employeeId };
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
    if (employeeId) filter.employeeId = employeeId;

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
      { _id: { $in: employeeIds }, isDeleted: false },
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
      { _id: { $in: employeeIds }, isDeleted: false },
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
      { _id: { $in: employeeIds }, isDeleted: true },
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
        _id: { $in: employeeIds },
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

  async getDepartments(includeDeleted = false) {
    const filter: FilterQuery<Department> = {};
    if (!includeDeleted) {
      filter.isDeleted = false;
    }

    return this.departmentModel.find(filter).sort({ name: 1 }).lean().exec();
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
      .distinct('name', { isDeleted: false })
      .exec();
    return departments.sort();
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
      .select('fullName position email status')
      .sort({ fullName: 1 })
      .lean()
      .exec();
  }

  async getEmployeesByPosition(position: string) {
    return this.employeeModel
      .find({ position, isDeleted: false })
      .select('fullName department email status')
      .sort({ fullName: 1 })
      .lean()
      .exec();
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
}
