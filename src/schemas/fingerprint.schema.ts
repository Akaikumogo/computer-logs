import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class Fingerprint extends Document {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Employee',
    required: true,
    index: true,
  })
  employeeId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  template: Buffer;

  @Prop({ required: true, default: 'AS608' })
  templateFormat: string;

  @Prop({ required: true, default: 'active', enum: ['active', 'revoked'] })
  status: 'active' | 'revoked';

  // Timestamps (added by Mongoose when timestamps: true)
  createdAt?: Date;
  updatedAt?: Date;
}

export const FingerprintSchema = SchemaFactory.createForClass(Fingerprint);
