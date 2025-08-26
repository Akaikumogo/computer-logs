import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ComputersModule } from './computers/computers.module';
import { HrModule } from './hr/hr.module';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [
    MongooseModule.forRoot(
      'mongodb+srv://sarvarbekred147:s43ZsDNTkFBQhEOW@cluster0.b5jq0aw.mongodb.net/computer_logs?retryWrites=true&w=majority&appName=Cluster0',
    ),
    ComputersModule,
    HrModule,
    UploadModule,
  ],
})
export class AppModule {}
