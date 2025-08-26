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

  @Prop({ required: false, default: null, type: String })
  path?: string | null;

  @Prop({ required: false, default: null, type: String })
  link?: string | null;
}

export const LogSchema = SchemaFactory.createForClass(Log);

/* Indexlar – filter tezligi uchun */
LogSchema.index({ device: 1 });
LogSchema.index({ application: 1 });
LogSchema.index({ action: 1 });
LogSchema.index({ time: -1 }); // date range query uchun
