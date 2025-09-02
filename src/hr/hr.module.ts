import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HrController } from './hr.controller';
import { HrService } from './hr.service';
import { Employee, EmployeeSchema } from '../schemas/employee.schema';
import { Fingerprint, FingerprintSchema } from '../schemas/fingerprint.schema';
import { Position, PositionSchema } from '../schemas/position.schema';
import { Department, DepartmentSchema } from '../schemas/department.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Employee.name, schema: EmployeeSchema },
      { name: Fingerprint.name, schema: FingerprintSchema },
      { name: Position.name, schema: PositionSchema },
      { name: Department.name, schema: DepartmentSchema },
    ]),
    AuthModule,
  ],
  controllers: [HrController],
  providers: [HrService],
  exports: [HrService],
})
export class HrModule {}
