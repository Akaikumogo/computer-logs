import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HrService } from './hr.service';
import { HrController } from './hr.controller';
import { Employee, EmployeeSchema } from '../schemas/employee.schema';
import { Fingerprint, FingerprintSchema } from '../schemas/fingerprint.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Employee.name, schema: EmployeeSchema },
      { name: Fingerprint.name, schema: FingerprintSchema },
    ]),
  ],
  controllers: [HrController],
  providers: [HrService],
})
export class HrModule {}
