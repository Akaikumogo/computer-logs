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

@Injectable()
export class HrService {
  constructor(
    @InjectModel(Employee.name) private employeeModel: Model<Employee>,
    @InjectModel(Fingerprint.name)
    private fingerprintModel: Model<Fingerprint>,
  ) {}

  async createEmployee(dto: CreateEmployeeDto) {
    try {
      const employee = new this.employeeModel(dto);
      return await employee.save();
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
