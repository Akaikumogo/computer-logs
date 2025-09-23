import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type LocationDocument = Location & Document;

@Schema({ timestamps: true })
export class Location {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true })
  address: string;

  @Prop({ required: true })
  latitude: number;

  @Prop({ required: true })
  longitude: number;

  @Prop({ default: 100 })
  radius: number; // Radius in meters

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop()
  description?: string;

  @Prop()
  deletedAt?: Date;
}

export const LocationSchema = SchemaFactory.createForClass(Location);

// Indexes for better performance
LocationSchema.index({ name: 1 });
LocationSchema.index({ isActive: 1, isDeleted: 1 });
LocationSchema.index({ latitude: 1, longitude: 1 });
