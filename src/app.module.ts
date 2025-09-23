/* eslint-disable @typescript-eslint/require-await */
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ComputersModule } from './computers/computers.module';
import { HrModule } from './hr/hr.module';

import { UploadModule } from './upload/upload.module';
import { WorkplacesModule } from './workplaces/workplaces.module';
import { AuthModule } from './auth/auth.module';
import { ScheduleModule } from './schedule/schedule.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { LocationModule } from './location/location.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('database.uri'),
      }),
      inject: [ConfigService],
    }),
    ComputersModule,
    HrModule,

    UploadModule,
    WorkplacesModule,
    AuthModule,
    ScheduleModule,
    DashboardModule,
    LocationModule,
  ],
})
export class AppModule {}
