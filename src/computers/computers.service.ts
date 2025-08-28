/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Computer } from '../schemas/computer.schema';
import { Log } from '../schemas/log.schema';
import type { SortOrder } from 'mongoose';
import { AddLogDto } from '../dto/add-logs.dto';
import { GetLogsQueryDto } from '../dto/get-logs-query.dto';
import { Application } from '../schemas/application.scehma';
import { Employee } from '../schemas/employee.schema';
import { AiService } from './ai.service';

@Injectable()
export class ComputersService {
  constructor(
    @InjectModel(Computer.name) private readonly computerModel: Model<Computer>,
    @InjectModel(Log.name) private readonly logModel: Model<Log>,
    @InjectModel(Application.name)
    private readonly applicationModel: Model<Application>,
    @InjectModel(Employee.name) private readonly employeeModel: Model<Employee>,
    private readonly aiService: AiService,
  ) {}

  /** LOG QO'SHISH */
  async addLog(dto: AddLogDto) {
    const compExists = await this.computerModel.findOne({ name: dto.device });
    if (!compExists) {
      await this.computerModel.create({ name: dto.device });
    }

    const appExists = await this.applicationModel.findOne({
      name: dto.application,
    });
    if (!appExists) {
      // Create application with basic info first
      const newApp = await this.applicationModel.create({
        name: dto.application,
      });

      // Enrich with AI in background (non-blocking)
      this.enrichApplicationWithAI(newApp._id, dto.application).catch(
        (error) => {
          console.error('Failed to enrich application with AI:', error);
        },
      );
    }

    return this.logModel.create({
      device: dto.device,
      action: dto.action,
      application: dto.application,
      time: new Date(dto.time),
      path: dto.path ?? null,
      link: dto.link ?? null,
    });
  }

  /** AI bilan application ni boyitish (background) */
  private async enrichApplicationWithAI(appId: any, appName: string) {
    try {
      const { tag, description } =
        await this.aiService.enrichApplication(appName);

      if (tag || description) {
        await this.applicationModel.findByIdAndUpdate(appId, {
          ...(tag && { tag }),
          ...(description && { description }),
        });
      }
    } catch (error) {
      console.error('AI enrichment failed for application:', appName, error);
    }
  }
  /** BARCHA APPLICATION LARNI AI BILAN BO'YITISH */
  async enrichAllApplications() {
    const applications = await this.applicationModel.find().lean().exec();

    for (const app of applications) {
      try {
        if (!app.tag || !app.description) {
          const enriched = await this.aiService.enrichApplication(app.name);

          if (enriched.tag || enriched.description) {
            await this.applicationModel.findByIdAndUpdate(app._id, {
              $set: {
                tag: enriched.tag,
                description: enriched.description,
              },
            });

            console.log(`✅ Updated ${app.name} with AI enrichment`);
          } else {
            console.warn(`⚠️ No enrichment returned for ${app.name}`);
          }
        }
      } catch (error) {
        console.error(`❌ Failed to enrich ${app.name}`, error);
      }
    }
  }

  /** BARCHA COMPUTER LAR RO'YXATINI QAYTARISH */
  async getComputers() {
    return this.computerModel.find().sort({ createdAt: -1 }).lean().exec();
  }

  /** KOMPYUTERGA XODIMNI BIRIKTIRISH/AJRATISH */
  async assignEmployee(device: string, employeeId: string | null) {
    const computer = await this.computerModel.findOne({ name: device }).exec();
    if (!computer) throw new NotFoundException('Device topilmadi');

    if (employeeId) {
      const employee = await this.employeeModel.findById(employeeId).exec();
      if (!employee) throw new NotFoundException('Employee topilmadi');
      computer.assignedEmployeeId = (employee as any)._id;
    } else {
      computer.assignedEmployeeId = null;
    }

    await computer.save();
    return computer.toObject();
  }

  /** LOG LARNI FILTER, PAGINATION, SORT bilan QAYTARISH */
  async getLogs(device: string, query: GetLogsQueryDto) {
    const filter: any = { device };

    if (query.application) filter.application = query.application;
    if (query.action) filter.action = query.action;
    if (query.from) filter.time = { $gte: new Date(query.from) };
    if (query.to) {
      filter.time = filter.time
        ? { ...filter.time, $lte: new Date(query.to) }
        : { $lte: new Date(query.to) };
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const sortField = query.sortBy ?? 'time';
    const sortOrder = query.order === 'asc' ? 1 : -1;

    const sort: Record<string, SortOrder> = { [sortField]: sortOrder };

    const [logs, total] = await Promise.all([
      this.logModel
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.logModel.countDocuments(filter).exec(),
    ]);

    return {
      data: logs,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /** OPTIONAL – ILOVALAR RO'YXATI */
  async getApplications(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [apps, total] = await Promise.all([
      this.applicationModel
        .find()
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.applicationModel.countDocuments().exec(),
    ]);
    return {
      data: apps,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }
  async getApplicationByName(name: string) {
    return this.applicationModel.findOne({ name }).lean().exec();
  }
}
