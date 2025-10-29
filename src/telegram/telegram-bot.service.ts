import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as TelegramBot from 'node-telegram-bot-api';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Employee } from '../schemas/employee.schema';
import { BotConfig } from '../schemas/bot-config.schema';
import { User } from '../auth/entities/user.entity';
import { ScheduleService } from '../schedule/schedule.service';
import { AttendanceType, AttendanceStatus } from '../schemas/attendance.schema';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class TelegramBotService implements OnModuleInit {
  private readonly logger = new Logger(TelegramBotService.name);
  private bot: TelegramBot | null = null;
  private botToken: string | null = null;
  private userSessions: Map<number, { employeeId: string; username: string }> =
    new Map();

  constructor(
    @InjectModel(Employee.name) private employeeModel: Model<Employee>,
    @InjectModel(BotConfig.name) private botConfigModel: Model<BotConfig>,
    @InjectModel(User.name) private userModel: Model<User>,
    private scheduleService: ScheduleService,
  ) {}

  async onModuleInit() {
    await this.initializeBot();
  }

  async initializeBot() {
    try {
      // Bot token ni DB dan olish
      const botConfig = await this.botConfigModel.findOne({
        key: 'telegram_bot',
        isActive: true,
      });

      if (!botConfig || !botConfig.botToken) {
        this.logger.warn(
          "⚠️  Telegram bot token topilmadi yoki o'chirilgan. Bot ishlamaydi.",
        );
        return;
      }

      this.botToken = botConfig.botToken;
      this.bot = new TelegramBot(this.botToken, { polling: true });

      this.setupBotHandlers();
      this.logger.log('✅ Telegram bot muvaffaqiyatli ishga tushdi');
    } catch (error) {
      this.logger.error('❌ Telegram bot ishga tushirishda xatolik:', error);
    }
  }

  private setupBotHandlers() {
    if (!this.bot) return;

    // /start command
    this.bot.onText(/\/start/, async (msg) => {
      const chatId = msg.chat.id;
      const welcomeMessage = `
👋 Salom! Davomat tizimiga xush kelibsiz!

📝 Avval login qilishingiz kerak:
/login <username> <password>

Masalan: /login john.doe.123 mypassword123

Yoki quyidagi tugmalardan foydalaning:
      `;
      await this.bot!.sendMessage(chatId, welcomeMessage, {
        reply_markup: {
          keyboard: [
            [{ text: '🔐 Login' }],
            [{ text: "📊 Bugungi ma'lumotim" }],
          ],
          resize_keyboard: true,
        },
      });
    });

    // /login command
    this.bot.onText(/\/login (.+) (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const username = match![1].trim();
      const password = match![2];

      await this.handleLogin(chatId, username, password);
    });

    // Login button
    this.bot.on('message', async (msg) => {
      const text = msg.text;
      const chatId = msg.chat.id;

      if (text === '🔐 Login') {
        await this.bot!.sendMessage(
          chatId,
          'Login qilish uchun quyidagi formatda yuboring:\n\n/login <username> <password>\n\nMasalan:\n/login john.doe.123 mypassword123',
        );
      } else if (text === "📊 Bugungi ma'lumotim") {
        await this.handleTodayInfo(chatId);
      }
    });
  }

  private async handleLogin(
    chatId: number,
    username: string,
    password: string,
  ) {
    try {
      // User ni topish
      const user = await this.userModel.findOne({ username: username.trim() });

      if (!user) {
        await this.bot!.sendMessage(
          chatId,
          '❌ Foydalanuvchi topilmadi. Username va parolni qayta tekshiring.',
        );
        return;
      }

      // Password tekshirish
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        await this.bot!.sendMessage(
          chatId,
          "❌ Noto'g'ri parol. Qayta urinib ko'ring.",
        );
        return;
      }

      // Employee ni topish
      const employee = await this.employeeModel.findOne({ userId: user._id });

      if (!employee) {
        await this.bot!.sendMessage(
          chatId,
          "❌ Xodim ma'lumotlari topilmadi. HR bo'limiga murojaat qiling.",
        );
        return;
      }

      // Telegram chat ID ni saqlash
      employee.telegramChatId = chatId;
      await employee.save();

      // Session saqlash
      this.userSessions.set(chatId, {
        employeeId: (employee._id as any).toString(),
        username: username,
      });

      await this.bot!.sendMessage(
        chatId,
        `✅ Muvaffaqiyatli login qildingiz!\n\n👤 Xodim: ${employee.fullName}\n📋 Bo'lim: ${employee.department}\n💼 Lavozim: ${employee.position}\n\nEndi quyidagi funksiyalardan foydalanishingiz mumkin:`,
        {
          reply_markup: {
            keyboard: [[{ text: "📊 Bugungi ma'lumotim" }]],
            resize_keyboard: true,
          },
        },
      );
    } catch (error) {
      this.logger.error('Login xatolik:', error);
      await this.bot!.sendMessage(
        chatId,
        "❌ Login qilishda xatolik yuz berdi. Qayta urinib ko'ring.",
      );
    }
  }

  private async handleTodayInfo(chatId: number) {
    try {
      const session = this.userSessions.get(chatId);
      if (!session) {
        await this.bot!.sendMessage(
          chatId,
          '❌ Avval login qilishingiz kerak. /start tugmasini bosing.',
        );
        return;
      }

      const attendance = await this.scheduleService.getTodayAttendance(
        session.employeeId,
      );

      const statusText =
        attendance.status === 'present'
          ? '✅ Vaqtida'
          : attendance.status === 'late'
            ? '⚠️ Kechikkan'
            : attendance.status === 'half-day'
              ? '🟡 Yarim kun'
              : '❌ Kelmagan';

      const message = `📊 Bugungi ma'lumotlarim:

${statusText}
⏰ Kirish: ${attendance.checkInTime || 'Kiritilmagan'}
🚪 Chiqish: ${attendance.checkOutTime || 'Chiqilmagan'}
⏱️ Ish vaqti: ${
        attendance.totalWorkHours
          ? `${Math.round(attendance.totalWorkHours * 100) / 100} soat`
          : 'Hisoblanmagan'
      }
📈 Jami soat: ${
        attendance.totalHours
          ? `${Math.round(attendance.totalHours * 100) / 100} soat`
          : 'Hisoblanmagan'
      }`;

      await this.bot!.sendMessage(chatId, message);
    } catch (error) {
      this.logger.error("Bugungi ma'lumot olish xatolik:", error);
      await this.bot!.sendMessage(
        chatId,
        "❌ Ma'lumot olishda xatolik yuz berdi.",
      );
    }
  }

  // Check-in va check-out uchun Telegram habar yuborish metodlari
  async sendCheckInNotification(employeeId: string) {
    try {
      if (!this.bot) return;

      const employee = await this.employeeModel.findById(employeeId);
      if (!employee || !employee.telegramChatId) return;

      const now = new Date();
      const message = `✅ Siz kirish qildingiz!\n\n📅 Sana: ${now.toLocaleDateString('uz-UZ')}\n⏰ Vaqt: ${now.toLocaleTimeString('uz-UZ')}`;

      await this.bot.sendMessage(employee.telegramChatId, message);
    } catch (error) {
      this.logger.error(
        `Check-in notification yuborishda xatolik (employeeId: ${employeeId}):`,
        error,
      );
    }
  }

  async sendCheckOutNotification(employeeId: string) {
    try {
      if (!this.bot) return;

      const employee = await this.employeeModel.findById(employeeId);
      if (!employee || !employee.telegramChatId) return;

      const now = new Date();
      const message = `✅ Siz chiqish qildingiz!\n\n📅 Sana: ${now.toLocaleDateString('uz-UZ')}\n⏰ Vaqt: ${now.toLocaleTimeString('uz-UZ')}`;

      await this.bot.sendMessage(employee.telegramChatId, message);
    } catch (error) {
      this.logger.error(
        `Check-out notification yuborishda xatolik (employeeId: ${employeeId}):`,
        error,
      );
    }
  }

  // Kun oxirida (12:00) ish vaqtini yuborish (cron job)
  @Cron('0 12 * * *', {
    name: 'send-daily-work-hours-cron',
    timeZone: 'Asia/Tashkent',
  })
  async sendDailyWorkHoursReportCron() {
    return this.sendDailyWorkHoursReport();
  }

  // Qo'lda chaqirish uchun metod
  async sendDailyWorkHoursReport() {
    try {
      this.logger.log('🔄 Kunlik ish vaqtini hisoblab yuborish boshlandi...');

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Barcha telegram chat ID si bo'lgan xodimlarni olish
      const employees = await this.employeeModel.find({
        telegramChatId: { $exists: true, $ne: null },
        status: 'active',
        isDeleted: false,
      });

      let sentCount = 0;
      let warningCount = 0;

      for (const employee of employees) {
        try {
          const attendance = await this.scheduleService.getTodayAttendance(
            (employee._id as any).toString(),
          );

          // Faqat kirish qilinganlar uchun
          if (attendance.isCheckedIn && employee.telegramChatId) {
            let message = `📊 Kunlik hisobot (${new Date().toLocaleDateString('uz-UZ')})\n\n`;
            message += `👤 Xodim: ${employee.fullName}\n`;
            message += `⏰ Kirish: ${attendance.checkInTime || 'Kiritilmagan'}\n`;
            message += `🚪 Chiqish: ${attendance.checkOutTime || 'Hali chiqilmagan'}\n\n`;

            if (attendance.checkOutTime && attendance.totalWorkHours) {
              // Chiqish qilingan bo'lsa
              message += `⏱️ Jami ish vaqti: ${Math.round(attendance.totalWorkHours * 100) / 100} soat\n`;
            } else if (attendance.checkInTime) {
              // Agar check-out qilinmagan bo'lsa, hozirgi vaqtgacha ishlagan vaqtni hisoblash
              warningCount++;
              const [hours, minutes] = attendance.checkInTime
                .split(':')
                .map(Number);
              const checkInDateTime = new Date(
                today.getFullYear(),
                today.getMonth(),
                today.getDate(),
                hours,
                minutes,
              );
              const now = new Date();
              const diffMs = now.getTime() - checkInDateTime.getTime();
              const workHours = Math.max(0, diffMs / (1000 * 60 * 60) - 1); // Tushlik vaqtini hisobga olish

              message += `⚠️ OGOHLANTIRISH: Siz hali chiqish qilmadingiz!\n`;
              message += `⏱️ Hozirgi vaqtgacha ishlagan vaqtingiz: ${Math.round(workHours * 100) / 100} soat\n\n`;
              message += `❌ Iltimos, chiqish qiling yoki HR bo'limiga murojaat qiling!`;
            }

            message += `\n\n📅 Status: ${
              attendance.status === 'present'
                ? '✅ Vaqtida'
                : attendance.status === 'late'
                  ? '⚠️ Kechikkan'
                  : attendance.status === 'half-day'
                    ? '🟡 Yarim kun'
                    : '❌ Kelmagan'
            }`;

            if (this.bot && employee.telegramChatId) {
              await this.bot.sendMessage(employee.telegramChatId, message);
              sentCount++;
            }
          }
        } catch (error) {
          this.logger.error(`Xatolik ${employee.fullName} uchun:`, error);
        }
      }

      this.logger.log(
        `✅ Kunlik hisobot yuborildi: ${sentCount} ta xodimga, ${warningCount} ta ogohlantirish`,
      );
    } catch (error) {
      this.logger.error('❌ Kunlik ish vaqti yuborishda xatolik:', error);
    }
  }

  // Bot token ni saqlash
  async setBotToken(botToken: string, description?: string) {
    try {
      const botConfig = await this.botConfigModel.findOneAndUpdate(
        { key: 'telegram_bot' },
        {
          botToken,
          isActive: true,
          description: description || 'Telegram bot token',
        },
        { upsert: true, new: true },
      );

      // Agar bot hali ishlamayotgan bo'lsa, yangilash
      this.botToken = botToken;
      if (!this.bot) {
        await this.initializeBot();
      } else {
        // Eski bot ni to'xtatish va yangisini yaratish
        this.bot.stopPolling();
        this.bot = new TelegramBot(botToken, { polling: true });
        this.setupBotHandlers();
      }

      this.logger.log('✅ Bot token muvaffaqiyatli yangilandi');
      return {
        success: true,
        message: 'Bot token muvaffaqiyatli saqlandi',
        isActive: botConfig.isActive,
      };
    } catch (error) {
      this.logger.error('Bot token saqlashda xatolik:', error);
      throw error;
    }
  }

  // Bot config ni olish (token ko'rsatilmaydi)
  async getBotConfig() {
    try {
      const botConfig = await this.botConfigModel.findOne({
        key: 'telegram_bot',
      });

      if (!botConfig) {
        return {
          success: false,
          message: 'Bot token hali sozlangan emas',
          isActive: false,
        };
      }

      return {
        success: true,
        isActive: botConfig.isActive,
        hasToken: !!botConfig.botToken,
        description: botConfig.description,
        createdAt: (botConfig as any).createdAt,
        updatedAt: (botConfig as any).updatedAt,
      };
    } catch (error) {
      this.logger.error('Bot config olishda xatolik:', error);
      throw error;
    }
  }
}
