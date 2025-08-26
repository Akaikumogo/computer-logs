import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Computer extends Document {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Employee',
    default: null,
    required: false,
    index: true,
  })
  assignedEmployeeId?: Types.ObjectId | null;

  @Prop({ required: false, default: null, type: String })
  deviceRealName?: string | null;
}

export const ComputerSchema = SchemaFactory.createForClass(Computer);
