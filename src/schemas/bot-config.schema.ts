import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class BotConfig extends Document {
  @Prop({ required: true, unique: true, default: 'telegram_bot' })
  key: string;

  @Prop({ required: true })
  botToken: string;

  @Prop({ default: false })
  isActive: boolean;

  @Prop()
  description?: string;
}

export const BotConfigSchema = SchemaFactory.createForClass(BotConfig);
