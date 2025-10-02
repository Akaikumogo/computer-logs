import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export enum AttendanceType {
  IN = 'in',
  OUT = 'out',
}

export enum AttendanceStatus {
  NORMAL = 'normal',
  LATE = 'late',
  EARLY = 'early',
  OVERTIME = 'overtime',
  ABSENT = 'absent',
}

@Schema({ timestamps: true })
export class Attendance extends Document {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Employee',
    required: true,
    index: true,
  })
  employeeId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  timestamp: Date;

  @Prop({ required: true, enum: AttendanceType })
  type: AttendanceType;

  @Prop({ required: true, enum: AttendanceStatus })
  status: AttendanceStatus;

  @Prop({
    type: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      address: { type: String },
      accuracy: { type: Number },
    },
    required: true,
  })
  location: {
    latitude: number;
    longitude: number;
    address?: string;
    accuracy?: number;
  };

  // 🔹 Location-based attendance
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Location',
    required: false,
    index: true,
  })
  locationId?: MongooseSchema.Types.ObjectId;

  @Prop()
  locationName?: string;

  // 🔹 Fingerprint-based attendance
  @Prop()
  fingerprintId?: string;

  @Prop()
  fingerprintNumber?: string;

  @Prop()
  device?: string;

  @Prop()
  notes?: string;

  @Prop()
  image?: string;

  @Prop()
  imageUrl?: string;

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
