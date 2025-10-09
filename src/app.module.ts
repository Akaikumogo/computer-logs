/* eslint-disable @typescript-eslint/require-await */
import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { CacheInterceptor } from '@nestjs/cache-manager';
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
    CacheModule.register({
      isGlobal: true,
      ttl: 5 * 60 * 1000,
      max: 1000,
    }),
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
    ComputersModule,
    HrModule,

    UploadModule,
    WorkplacesModule,
    AuthModule,
    ScheduleModule,
    DashboardModule,
    LocationModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
  ],
})
export class AppModule {}
