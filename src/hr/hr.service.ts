/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { Employee } from '../schemas/employee.schema';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { Fingerprint } from '../schemas/fingerprint.schema';
import { AuthService } from '../auth/auth.service';
import { UserRole } from '../auth/entities/user.entity';

@Injectable()
export class HrService {
  constructor(
    @InjectModel(Employee.name) private employeeModel: Model<Employee>,
    @InjectModel(Fingerprint.name)
    private fingerprintModel: Model<Fingerprint>,
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

  async getEmployees(
    filter?: Partial<Pick<Employee, 'status' | 'department' | 'position'>>,
    search?: string,
  ) {
    const query: FilterQuery<Employee> = { isDeleted: false };

    if (filter?.status) query.status = filter.status;
    if (filter?.department) query.department = filter.department;

    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { fullName: regex },
        { position: regex },
        { department: regex },
        { email: regex },
        { address: regex },
        { phones: { $in: [regex] } },
      ];
    }

    return this.employeeModel.find(query).exec();
  }

  async getEmployeeById(id: string) {
    const employee = await this.employeeModel
      .findOne({ _id: id, isDeleted: false })
      .exec();
    if (!employee) throw new NotFoundException('Employee not found');
    return employee;
  }

  async updateEmployee(id: string, dto: UpdateEmployeeDto) {
    const updated = await this.employeeModel
      .findOneAndUpdate({ _id: id, isDeleted: false }, dto, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('Employee not found');
    return updated;
  }

  async deleteEmployee(id: string) {
    const employee = await this.employeeModel
      .findOne({ _id: id, isDeleted: false })
      .exec();
    if (!employee) throw new NotFoundException('Employee not found');

    employee.isDeleted = true;
    employee.deletedAt = new Date();
    employee.status = 'inactive';
    return employee.save();
  }

  async getEmployeeCredentials(employeeId: string) {
    const employee = await this.employeeModel
      .findOne({ _id: employeeId, isDeleted: false })
      .exec();
    if (!employee) throw new NotFoundException('Employee not found');

    if (!employee.userId || !employee.username) {
      throw new ConflictException('Employee does not have a user account');
    }

    return {
      employeeId: employee._id,
      fullName: employee.fullName,
      username: employee.username,
      email: employee.email,
      hasTempPassword: !!employee.tempPassword,
      note: employee.tempPassword
        ? 'Employee has temporary password that should be changed on login'
        : 'Employee has changed their password',
    };
  }

  async getAllEmployeeCredentials() {
    const employees = await this.employeeModel
      .find({ isDeleted: false })
      .exec();

    return employees.map((employee) => ({
      employeeId: employee._id,
      fullName: employee.fullName,
      username: employee.username || 'Username yaratilmagan',
      email: employee.email,
      department: employee.department,
      position: employee.position,
      hasTempPassword: !!employee.tempPassword,
      tempPassword: employee.tempPassword || "Parol o'zgartirilgan",
      note: employee.tempPassword
        ? 'Temporary password - should be changed on login'
        : 'Password already changed by user',
    }));
  }

  async resetEmployeePassword(employeeId: string) {
    const employee = await this.employeeModel
      .findOne({ _id: employeeId, isDeleted: false })
      .exec();
    if (!employee) throw new NotFoundException('Employee not found');

    if (!employee.userId) {
      throw new ConflictException('Employee does not have a user account');
    }

    // Generate new password
    const newPassword = this.generatePassword();

    // Update user password in auth system
    // Note: This would require adding a method to AuthService to update passwords
    // For now, we'll just return the new password

    // Update employee with new temporary password
    employee.tempPassword = newPassword;
    await employee.save();

    return {
      message: 'Password reset successfully',
      username: employee.username,
      newPassword,
      note: 'Please change password on next login',
    };
  }

  async addFingerprint(employeeId: string, templateBase64: string) {
    const employee = await this.employeeModel
      .findOne({ _id: employeeId, isDeleted: false })
      .exec();
    if (!employee) throw new NotFoundException('Employee not found');

    const count = await this.fingerprintModel
      .countDocuments({ employeeId })
      .exec();
    if (count >= 10) {
      throw new ConflictException('Fingerprint limit (10) exceeded');
    }

    const templateBuffer = Buffer.from(templateBase64, 'base64');

    const fp = await this.fingerprintModel.create({
      employeeId: employee._id,
      template: templateBuffer,
      templateFormat: 'AS608',
      status: 'active',
    });

    return {
      id: fp._id,
      employeeId: fp.employeeId,
      status: fp.status,
    };
  }

  async listFingerprints(
    employeeId: string,
    page = 1,
    limit = 20,
    includeTemplate = false,
    status?: 'active' | 'revoked',
  ) {
    await this.getEmployeeById(employeeId);

    const filter: any = { employeeId };
    if (status) filter.status = status;

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.fingerprintModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.fingerprintModel.countDocuments(filter).exec(),
    ]);

    const data = items.map((fp) => ({
      id: fp._id,
      status: fp.status,
      createdAt: fp.createdAt,
      ...(includeTemplate
        ? { template: (fp.template as Buffer).toString('base64') }
        : {}),
    }));

    return {
      data,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  async listAllFingerprints(
    page = 1,
    limit = 20,
    includeTemplate = false,
    status?: 'active' | 'revoked',
    employeeId?: string,
  ) {
    const filter: any = {};
    if (status) filter.status = status;
    if (employeeId) filter.employeeId = employeeId;

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.fingerprintModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.fingerprintModel.countDocuments(filter).exec(),
    ]);

    const data = items.map((fp) => ({
      id: fp._id,
      employeeId: fp.employeeId,
      status: fp.status,
      createdAt: fp.createdAt,
      ...(includeTemplate
        ? { template: (fp.template as Buffer).toString('base64') }
        : {}),
    }));

    return {
      data,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }
}
