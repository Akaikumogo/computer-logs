import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Log extends Document {
  @Prop({ required: true })
  device: string;

  @Prop({ required: true })
  action: string;

  @Prop({ required: true })
  application: string;

  @Prop({ required: true })
  time: Date;
}

export const LogSchema = SchemaFactory.createForClass(Log);
