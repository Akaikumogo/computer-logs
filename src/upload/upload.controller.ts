import {
  Controller,
  Post,
  Get,
  Param,
  Res,
  Delete,
  Query,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { Response } from 'express';
import * as path from 'path';
import { ApiTags, ApiBody, ApiConsumes } from '@nestjs/swagger';
import type { Express } from 'express';

@ApiTags('Upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('File required');
    return this.uploadService.create(file);
  }

  @Get()
  async getFiles(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
  ) {
    return this.uploadService.findAll(page, limit, search);
  }

  @Get(':id')
  async getFileById(@Param('id') id: string, @Res() res: Response) {
    const file = await this.uploadService.findById(id);
    return res.sendFile(path.resolve(`./uploads/${file.filename}`));
  }

  @Delete(':id')
  async deleteFile(@Param('id') id: string) {
    return this.uploadService.delete(id);
  }
}
