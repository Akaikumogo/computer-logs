import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { AttendanceCronService } from './attendance-cron.service';
import { Attendance, AttendanceSchema } from '../schemas/attendance.schema';
import { Location, LocationSchema } from '../schemas/location.schema';
import { Employee, EmployeeSchema } from '../schemas/employee.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Attendance.name, schema: AttendanceSchema },
      { name: Location.name, schema: LocationSchema },
      { name: Employee.name, schema: EmployeeSchema },
    ]),
    ScheduleModule.forRoot(),
    AuthModule,
  ],
  controllers: [AttendanceController],
  providers: [AttendanceService, AttendanceCronService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
