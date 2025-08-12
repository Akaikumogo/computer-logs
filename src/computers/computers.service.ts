/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Computer } from '../schemas/computer.schema';
import { Log } from '../schemas/log.schema';

import { AddLogDto } from '../dto/add-logs.dto';
import { GetLogsQueryDto } from '../dto/get-logs-query.dto';
import { Application } from '../schemas/application.scehma';

@Injectable()
export class ComputersService {
  constructor(
    @InjectModel(Computer.name) private readonly computerModel: Model<Computer>,
    @InjectModel(Log.name) private readonly logModel: Model<Log>,
    @InjectModel(Application.name)
    private readonly applicationModel: Model<Application>,
  ) {}

  /** LOG QO‘SHISH */
  async addLog(dto: AddLogDto) {
    const compExists = await this.computerModel.findOne({ name: dto.device });
    if (!compExists) {
      await this.computerModel.create({ name: dto.device });
    }

    const appExists = await this.applicationModel.findOne({
      name: dto.application,
    });
    if (!appExists) {
      await this.applicationModel.create({ name: dto.application });
    }

    return this.logModel.create({
      device: dto.device,
      action: dto.action,
      application: dto.application,
      time: new Date(dto.time),
    });
  }

  /** BARCHA COMPUTER LAR RO‘YXATINI QAYTARISH */
  async getComputers() {
    return this.computerModel.find().sort({ createdAt: -1 }).lean().exec();
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
    const sort = { [sortField]: sortOrder };

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

  /** OPTIONAL – ILOVALAR RO‘YXATI */
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
