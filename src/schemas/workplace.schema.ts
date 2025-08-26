import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class Workplace extends Document {
  @Prop({ required: true, unique: true, trim: true })
  name: string;

  @Prop({ required: false, unique: true, sparse: true, trim: true })
  code?: string;

  @Prop({
    required: false,
    enum: ['department', 'branch', 'office', 'team'],
  })
  type?: 'department' | 'branch' | 'office' | 'team';

  @Prop({ required: false })
  address?: string;

  @Prop({ required: true, default: 'active', enum: ['active', 'inactive'] })
  status: 'active' | 'inactive';

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Workplace',
    required: false,
  })
  parentId?: MongooseSchema.Types.ObjectId;

  createdAt?: Date;
  updatedAt?: Date;
}

export const WorkplaceSchema = SchemaFactory.createForClass(Workplace);

WorkplaceSchema.index({ name: 'text', code: 'text', address: 'text' });
WorkplaceSchema.index({ status: 1 });
WorkplaceSchema.index({ parentId: 1 });
