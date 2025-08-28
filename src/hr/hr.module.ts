import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HrService } from './hr.service';
import { HrController } from './hr.controller';
import { Employee, EmployeeSchema } from '../schemas/employee.schema';
import { Fingerprint, FingerprintSchema } from '../schemas/fingerprint.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Employee.name, schema: EmployeeSchema },
      { name: Fingerprint.name, schema: FingerprintSchema },
    ]),
    AuthModule,
  ],
  controllers: [HrController],
  providers: [HrService],
})
export class HrModule {}
