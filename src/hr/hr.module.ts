import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HrController } from './hr.controller';
import { HrService } from './hr.service';
import { Employee, EmployeeSchema } from '../schemas/employee.schema';
import { Fingerprint, FingerprintSchema } from '../schemas/fingerprint.schema';
import { Position, PositionSchema } from '../schemas/position.schema';
import { Department, DepartmentSchema } from '../schemas/department.schema';
import { Location, LocationSchema } from '../schemas/location.schema';
import { Attendance, AttendanceSchema } from '../schemas/attendance.schema';
import { AuthModule } from '../auth/auth.module';
import { LocationModule } from '../location/location.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Employee.name, schema: EmployeeSchema },
      { name: Fingerprint.name, schema: FingerprintSchema },
      { name: Position.name, schema: PositionSchema },
      { name: Department.name, schema: DepartmentSchema },
      { name: Location.name, schema: LocationSchema },
      { name: Attendance.name, schema: AttendanceSchema },
    ]),
    AuthModule,
    LocationModule,
  ],
  controllers: [HrController],
  providers: [HrService],
  exports: [HrService],
})
export class HrModule {}
