/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { UploadFile } from 'src/schemas/uploads.schema';

@Injectable()
export class UploadService {
  private uploadDir = './uploads';

  constructor(
    @InjectModel(UploadFile.name) private uploadModel: Model<UploadFile>,
  ) {
    if (!fs.existsSync(this.uploadDir))
      fs.mkdirSync(this.uploadDir, { recursive: true });
  }

  async create(file: Express.Multer.File) {
    const ext = file.originalname.split('.').pop() ?? '';
    const filename = `${uuidv4()}.${ext}`;
    const filepath = path.join(this.uploadDir, filename);
    fs.writeFileSync(filepath, file.buffer);

    const created = await this.uploadModel.create({
      filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    });

    return created;
  }

  async findAll(page = 1, limit = 10, search?: string) {
    const query = search
      ? { originalname: { $regex: search, $options: 'i' } }
      : {};
    const skip = (page - 1) * limit;
    const files = await this.uploadModel.find(query).skip(skip).limit(limit);
    const total = await this.uploadModel.countDocuments(query);
    return { total, page, limit, files };
  }

  async findById(id: string) {
    const file = await this.uploadModel.findById(id);
    if (!file) throw new NotFoundException('File not found');
    return file;
  }

  async delete(id: string) {
    const file = await this.findById(id);
    const filepath = path.join(this.uploadDir, file.filename);
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
    await this.uploadModel.findByIdAndDelete(id);
    return { message: 'File deleted' };
  }
}
