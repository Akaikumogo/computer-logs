/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Computer } from '../schemas/computer.schema';
import { Log } from '../schemas/log.schema';

@Injectable()
export class ComputersService {
  constructor(
    @InjectModel(Computer.name) private computerModel: Model<Computer>,
    @InjectModel(Log.name) private logModel: Model<Log>,
  ) {}

  async addLog(dto: any) {
    // Agar computer yo'q bo'lsa, yaratamiz
    const exists = await this.computerModel.findOne({ name: dto.device });
    if (!exists) {
      await this.computerModel.create({ name: dto.device });
    }

    // Log qo'shamiz
    return this.logModel.create({
      device: dto.device,
      action: dto.action,
      application: dto.application,
      time: new Date(dto.time),
    });
  }

  async getComputers() {
    return this.computerModel.find().sort({ createdAt: -1 });
  }

  async getLogs(device: string, from?: string, to?: string) {
    const filter: any = { device };
    if (from) filter.time = { $gte: new Date(from) };
    if (to) {
      filter.time = filter.time
        ? { ...filter.time, $lte: new Date(to) }
        : { $lte: new Date(to) };
    }

    return this.logModel.find(filter).sort({ time: -1 });
  }
}
