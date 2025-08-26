/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import { Workplace } from '../schemas/workplace.schema';

@Injectable()
export class WorkplacesService {
  constructor(
    @InjectModel(Workplace.name)
    private readonly workplaceModel: Model<Workplace>,
  ) {}

  async create(dto: Partial<Workplace>) {
    try {
      return await this.workplaceModel.create(dto);
    } catch (err: any) {
      if (err?.code === 11000) {
        throw new ConflictException('Name yoki code allaqachon mavjud');
      }
      throw err;
    }
  }

  async update(id: string, dto: Partial<Workplace>) {
    const updated = await this.workplaceModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('Workplace topilmadi');
    return updated;
  }

  async getAll(
    page = 1,
    limit = 20,
    search?: string,
    status?: 'active' | 'inactive',
    type?: 'department' | 'branch' | 'office' | 'team',
  ) {
    const filter: FilterQuery<Workplace> = {};
    if (status) filter.status = status;
    if (type) filter.type = type;

    const skip = (page - 1) * limit;

    let query = this.workplaceModel.find(filter);

    if (search) {
      const regex = new RegExp(search, 'i');
      query = query.find({
        $or: [{ name: regex }, { code: regex }, { address: regex }],
      });
    }

    const [items, total] = await Promise.all([
      query.sort({ name: 1 }).skip(skip).limit(limit).lean().exec(),
      this.workplaceModel
        .countDocuments(
          search
            ? {
                ...filter,
                $or: [
                  { name: new RegExp(search, 'i') },
                  { code: new RegExp(search, 'i') },
                  { address: new RegExp(search, 'i') },
                ],
              }
            : filter,
        )
        .exec(),
    ]);

    return {
      data: items,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  async getById(id: string) {
    const found = await this.workplaceModel.findById(id).lean().exec();
    if (!found) throw new NotFoundException('Workplace topilmadi');
    return found;
  }
}
