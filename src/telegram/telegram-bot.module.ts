import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TelegramBotService } from './telegram-bot.service';
import { TelegramBotController } from './telegram-bot.controller';
import { Employee, EmployeeSchema } from '../schemas/employee.schema';
import { BotConfig, BotConfigSchema } from '../schemas/bot-config.schema';
import { User, UserSchema } from '../auth/entities/user.entity';
import { ScheduleModule } from '../schedule/schedule.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Employee.name, schema: EmployeeSchema },
      { name: BotConfig.name, schema: BotConfigSchema },
      { name: User.name, schema: UserSchema },
    ]),
    ScheduleModule,
  ],
  controllers: [TelegramBotController],
  providers: [TelegramBotService],
  exports: [TelegramBotService],
})
export class TelegramBotModule {}
