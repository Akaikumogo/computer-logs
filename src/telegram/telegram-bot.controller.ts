import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';
import { TelegramBotService } from './telegram-bot.service';

@ApiTags('Telegram Bot')
@Controller('telegram')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TelegramBotController {
  constructor(private readonly telegramBotService: TelegramBotService) {}

  @Post('bot-config')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Telegram bot tokenini sozlash',
    description: 'Bot token ni database ga saqlash',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        botToken: {
          type: 'string',
          description: 'Telegram bot token',
        },
        description: {
          type: 'string',
          description: 'Tavsif (ixtiyoriy)',
        },
      },
      required: ['botToken'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Bot token muvaffaqiyatli saqlandi',
  })
  async setBotToken(@Body() body: { botToken: string; description?: string }) {
    return this.telegramBotService.setBotToken(body.botToken, body.description);
  }

  @Get('bot-config')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Telegram bot tokenini olish',
    description: "Bot token ni database dan olish (token ko'rsatilmaydi)",
  })
  @ApiResponse({ status: 200, description: "Bot token ma'lumotlari" })
  async getBotConfig() {
    return this.telegramBotService.getBotConfig();
  }

  @Post('send-daily-report')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Kunlik hisobotni qo'lda yuborish",
    description: 'Barcha login qilgan userlarga bugungi ish vaqtini yuborish',
  })
  @ApiResponse({
    status: 200,
    description: 'Hisobot yuborildi',
  })
  async sendDailyReport() {
    return this.telegramBotService.sendDailyWorkHoursReport();
  }
}
