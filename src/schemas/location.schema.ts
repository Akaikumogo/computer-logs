import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Location extends Document {
  @Prop({ required: true, type: Number })
  latitude: number;

  @Prop({ required: true, type: Number })
  longitude: number;

  @Prop({ required: false })
  address?: string;

  @Prop({ required: false })
  city?: string;

  @Prop({ required: false })
  country?: string;

  @Prop({ required: false })
  accuracy?: number;

  @Prop({ required: false })
  altitude?: number;

  @Prop({ required: false })
  speed?: number;

  @Prop({ required: false })
  heading?: number;

  @Prop({ required: false })
  deviceInfo?: string;

  // 🔹 Soft delete uchun
  @Prop({ default: false })
  isDeleted: boolean;

  @Prop()
  deletedAt?: Date;
}

export const LocationSchema = SchemaFactory.createForClass(Location);

/* Indexlar - tez qidirish uchun */
LocationSchema.index({ latitude: 1, longitude: 1 });
LocationSchema.index({ city: 1 });
LocationSchema.index({ country: 1 });
LocationSchema.index({ isDeleted: 1 });
