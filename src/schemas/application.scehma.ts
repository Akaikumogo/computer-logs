import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Application extends Document {
  @Prop({ required: true, unique: true })
  name: string;
}

export const ApplicationSchema = SchemaFactory.createForClass(Application);

/* Index – tez qidirish uchun */
ApplicationSchema.index({ name: 1 });
