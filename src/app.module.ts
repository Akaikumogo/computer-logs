/* eslint-disable @typescript-eslint/require-await */
import { Module } from '@nestjs/common';
// Cache disabled per request: removed CacheModule and CacheInterceptor
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule as NestScheduleModule } from '@nestjs/schedule';
import { ComputersModule } from './computers/computers.module';
import { HrModule } from './hr/hr.module';

import { UploadModule } from './upload/upload.module';
import { WorkplacesModule } from './workplaces/workplaces.module';
import { AuthModule } from './auth/auth.module';
import { ScheduleModule } from './schedule/schedule.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { LocationModule } from './location/location.module';
import { TelegramBotModule } from './telegram/telegram-bot.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    // CacheModule removed to disable response caching
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('database.uri'),
        // tuned Mongoose connection options
        maxPoolSize: 20,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        autoIndex: false,
        retryWrites: true,
        readPreference: 'secondaryPreferred' as any,
      }),
      inject: [ConfigService],
    }),
    NestScheduleModule.forRoot(),
    ComputersModule,
    HrModule,

    UploadModule,
    WorkplacesModule,
    AuthModule,
    ScheduleModule,
    DashboardModule,
    LocationModule,
    TelegramBotModule,
  ],
  providers: [],
})
export class AppModule {}
