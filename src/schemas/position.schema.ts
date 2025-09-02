import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Position extends Document {
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

export const PositionSchema = SchemaFactory.createForClass(Position);

/* Index – tez qidirish uchun */
PositionSchema.index({ name: 1 });
PositionSchema.index({ status: 1 });
PositionSchema.index({ isDeleted: 1 });
