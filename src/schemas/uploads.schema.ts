import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class UploadFile extends Document {
  @Prop({ required: true })
  filename: string;

  @Prop({ required: true })
  originalname: string;

  @Prop()
  mimetype: string;

  @Prop()
  size: number;
}

export const UploadFileSchema = SchemaFactory.createForClass(UploadFile);
