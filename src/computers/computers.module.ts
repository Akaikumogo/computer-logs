import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { ComputersService } from './computers.service';
import { ComputersController } from './computers.controller';
import { PublicComputersController } from './public-computers.controller';
import { Computer, ComputerSchema } from '../schemas/computer.schema';
import { Log, LogSchema } from '../schemas/log.schema';
import { Application, ApplicationSchema } from '../schemas/application.scehma';
import { Employee, EmployeeSchema } from '../schemas/employee.schema';
import { AiService } from './ai.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Computer.name, schema: ComputerSchema },
      { name: Log.name, schema: LogSchema },
      { name: Application.name, schema: ApplicationSchema },
      { name: Employee.name, schema: EmployeeSchema },
    ]),
    HttpModule,
  ],
  controllers: [ComputersController, PublicComputersController],
  providers: [ComputersService, AiService],
  exports: [AiService],
})
export class ComputersModule {}
