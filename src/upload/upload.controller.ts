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
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { Response } from 'express';
import * as path from 'path';
import {
  ApiTags,
  ApiBody,
  ApiConsumes,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import type { Express } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Upload')
@Controller('upload')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.HR)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Fayl yuklash',
    description: 'Faqat ADMIN va HR xodimlar fayl yuklaya oladi',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Fayl muvaffaqiyatli yuklandi' })
  @ApiResponse({ status: 403, description: "Ruxsat yo'q - faqat ADMIN va HR" })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
  ) {
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
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: "Faylni o'chirish",
    description: "Faqat ADMIN xodimlar faylni o'chira oladi",
  })
  @ApiResponse({ status: 200, description: "Fayl muvaffaqiyatli o'chirildi" })
  @ApiResponse({ status: 403, description: "Ruxsat yo'q - faqat ADMIN" })
  async deleteFile(@Param('id') id: string, @CurrentUser() user: any) {
    return this.uploadService.delete(id);
  }
}
