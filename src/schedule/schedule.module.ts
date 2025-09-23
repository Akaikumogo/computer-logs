import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleController } from './schedule.controller';
import { ScheduleService } from './schedule.service';
import { SnapshotService } from './snapshot.service';
import { Attendance, AttendanceSchema } from '../schemas/attendance.schema';
import { Employee, EmployeeSchema } from '../schemas/employee.schema';
import { AuthModule } from '../auth/auth.module';
import { LocationModule } from '../location/location.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Attendance.name, schema: AttendanceSchema },
      { name: Employee.name, schema: EmployeeSchema },
    ]),
    AuthModule,
    LocationModule,
  ],
  controllers: [ScheduleController],
  providers: [ScheduleService, SnapshotService],
  exports: [ScheduleService, SnapshotService],
})
export class ScheduleModule {}
