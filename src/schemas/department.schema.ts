import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Department extends Document {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({
    required: false,
    default: 'active',
    enum: ['active', 'inactive'],
  })
  status?: 'active' | 'inactive';

  // 🔹 Soft delete uchun
  @Prop({ default: false })
  isDeleted: boolean;

  @Prop()
  deletedAt?: Date;
}

export const DepartmentSchema = SchemaFactory.createForClass(Department);

/* Index – tez qidirish uchun */
DepartmentSchema.index({ name: 1 });
DepartmentSchema.index({ status: 1 });
DepartmentSchema.index({ isDeleted: 1 });
