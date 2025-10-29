import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  HR = 'hr',
  SUPER_ADMIN = 'super_admin',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true })
  password: string;

  @Prop({ type: String, enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  firstName?: string;

  @Prop()
  lastName?: string;

  @Prop()
  phone?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Email field'i uchun sparse unique index qo'shish
// Bu MongoDB'da null qiymatlar duplicate key error bermasligi uchun
// Agar email field'i mavjud bo'lsa, u unique bo'ladi, yo'q bo'lsa ham muammo bo'lmaydi
UserSchema.index({ email: 1 }, { unique: true, sparse: true });
