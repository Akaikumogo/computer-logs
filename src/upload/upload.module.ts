import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { UploadFile, UploadFileSchema } from 'src/schemas/uploads.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UploadFile.name, schema: UploadFileSchema },
    ]),
  ],
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule {}
