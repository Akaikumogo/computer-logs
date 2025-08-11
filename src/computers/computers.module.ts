import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ComputersService } from './computers.service';
import { ComputersController } from './computers.controller';
import { Computer, ComputerSchema } from '../schemas/computer.schema';
import { Log, LogSchema } from '../schemas/log.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Computer.name, schema: ComputerSchema },
      { name: Log.name, schema: LogSchema },
    ]),
  ],
  controllers: [ComputersController],
  providers: [ComputersService],
})
export class ComputersModule {}
