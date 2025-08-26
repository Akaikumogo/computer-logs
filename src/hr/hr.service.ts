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

@Injectable()
export class HrService {
  constructor(
    @InjectModel(Employee.name) private employeeModel: Model<Employee>,
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
}
