import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HrService } from './hr.service';
import { HrController } from './hr.controller';
import { Employee, EmployeeSchema } from '../schemas/employee.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Employee.name, schema: EmployeeSchema },
    ]),
  ],
  controllers: [HrController],
  providers: [HrService],
})
export class HrModule {}
