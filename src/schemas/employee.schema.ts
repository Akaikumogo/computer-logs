import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class Employee extends Document {
  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true })
  position: string;

  @Prop({ required: true })
  department: string;

  @Prop()
  hireDate?: Date;

  @Prop()
  birthDate?: Date;

  @Prop({ unique: true, sparse: true })
  passportId?: string;

  @Prop({ type: [String], required: true })
  phones: string[];

  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  address?: string;

  @Prop()
  salary?: number;

  @Prop({ default: 'active', enum: ['active', 'inactive'] })
  status: 'active' | 'inactive';

  @Prop({ type: [String], default: [] })
  files?: string[];

  // 🔹 Soft delete uchun
  @Prop({ default: false })
  isDeleted: boolean;

  @Prop()
  deletedAt?: Date;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Workplace',
    required: false,
    index: true,
  })
  primaryWorkplaceId?: MongooseSchema.Types.ObjectId | null;
}

export const EmployeeSchema = SchemaFactory.createForClass(Employee);
