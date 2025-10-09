import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleController } from './schedule.controller';
import { PublicScheduleController } from './public-schedule.controller';
import { WorkerScheduleController } from './worker-schedule.controller';
import { ScheduleService } from './schedule.service';
import { SnapshotService } from './snapshot.service';
import { Attendance, AttendanceSchema } from '../schemas/attendance.schema';
import { Employee, EmployeeSchema } from '../schemas/employee.schema';
import { Fingerprint, FingerprintSchema } from '../schemas/fingerprint.schema';
import { AuthModule } from '../auth/auth.module';
import { LocationModule } from '../location/location.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Attendance.name, schema: AttendanceSchema },
      { name: Employee.name, schema: EmployeeSchema },
      { name: Fingerprint.name, schema: FingerprintSchema },
    ]),
    AuthModule,
    LocationModule,
  ],
  controllers: [
    ScheduleController,
    PublicScheduleController,
    WorkerScheduleController,
  ],
  providers: [ScheduleService, SnapshotService],
  exports: [ScheduleService, SnapshotService],
})
export class ScheduleModule {}
