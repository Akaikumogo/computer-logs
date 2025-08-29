import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from './entities/user.entity';

@Injectable()
export class SeedSuperAdminService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async seedSuperAdmin() {
    try {
      // Check if super admin already exists
      const existingAdmin = await this.userModel.findOne({
        username: 'superadmin',
      });

      if (existingAdmin) {
        console.log('✅ Super admin already exists');
        return existingAdmin;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash('SuperAdmin2025!', 10);

      // Create super admin
      const superAdmin = new this.userModel({
        username: 'superadmin',
        email: 'superadmin@company.com',
        password: hashedPassword,
        role: UserRole.ADMIN,
        firstName: 'Super',
        lastName: 'Administrator',
        isActive: true,
      });

      const savedAdmin = await superAdmin.save();

      console.log('🎉 Super admin created successfully!');
      console.log('Username: superadmin');
      console.log('Password: SuperAdmin2025!');
      console.log('Role: ADMIN');

      return savedAdmin;
    } catch (error) {
      console.error('❌ Error creating super admin:', error);
      throw error;
    }
  }
}
