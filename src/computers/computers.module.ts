import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ComputersService } from './computers.service';
import { ComputersController } from './computers.controller';
import { Computer, ComputerSchema } from '../schemas/computer.schema';
import { Log, LogSchema } from '../schemas/log.schema';
import { Application, ApplicationSchema } from '../schemas/application.scehma';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Computer.name, schema: ComputerSchema },
      { name: Log.name, schema: LogSchema },
      { name: Application.name, schema: ApplicationSchema },
    ]),
  ],
  controllers: [ComputersController],
  providers: [ComputersService],
})
export class ComputersModule {}
