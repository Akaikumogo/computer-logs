import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export enum AttendanceType {
  IN = 'in',
  OUT = 'out',
}

export enum AttendanceStatus {
  NORMAL = 'normal',
  LATE = 'late',
  EARLY = 'early',
  OVERTIME = 'overtime',
  WARNING = 'warning',
}

@Schema({ timestamps: true })
export class Attendance extends Document {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Employee',
    required: true,
    index: true,
  })
  employeeId: Types.ObjectId;

  @Prop({ required: true, type: Date, index: true })
  timestamp: Date;

  @Prop({ required: true, enum: AttendanceType, index: true })
  type: AttendanceType;

  @Prop({ required: true, enum: AttendanceStatus, default: AttendanceStatus.NORMAL })
  status: AttendanceStatus;

  @Prop({
    type: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      address: { type: String, required: false },
      accuracy: { type: Number, required: false },
    },
    required: true,
  })
  location: {
    latitude: number;
    longitude: number;
    address?: string;
    accuracy?: number;
  };

  @Prop({ required: false })
  device?: string;

  @Prop({ required: false })
  notes?: string;

  // 🔹 Warning uchun
  @Prop({ default: false })
  hasWarning: boolean;

  @Prop()
  warningReason?: string;

  @Prop()
  warningTimestamp?: Date;

  // 🔹 Soft delete uchun
  @Prop({ default: false })
  isDeleted: boolean;

  @Prop()
  deletedAt?: Date;
}

export const AttendanceSchema = SchemaFactory.createForClass(Attendance);

/* Indexlar - tez qidirish uchun */
AttendanceSchema.index({ employeeId: 1, timestamp: -1 });
AttendanceSchema.index({ timestamp: -1 });
AttendanceSchema.index({ type: 1 });
AttendanceSchema.index({ status: 1 });
AttendanceSchema.index({ 'location.latitude': 1, 'location.longitude': 1 });
AttendanceSchema.index({ hasWarning: 1 });
