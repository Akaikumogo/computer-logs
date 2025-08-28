import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Application extends Document {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: false, default: null, type: String })
  description?: string | null;

  @Prop({
    required: false,
    default: null,
    type: String,
    enum: ['game', 'social', 'office', 'windows'],
  })
  tag?: 'game' | 'social' | 'office' | 'windows' | null;
}

export const ApplicationSchema = SchemaFactory.createForClass(Application);

/* Index – tez qidirish uchun */
ApplicationSchema.index({ name: 1 });
