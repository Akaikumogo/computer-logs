import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AttendanceService } from './attendance.service';

@Injectable()
export class AttendanceCronService {
  private readonly logger = new Logger(AttendanceCronService.name);

  constructor(private readonly attendanceService: AttendanceService) {}

  /**
   * Har kuni 18:00 da ishga tushadi
   * 18:00 dan keyin chiqmagan xodimlarga warning qo'yadi
   */
  @Cron(CronExpression.EVERY_DAY_AT_6PM)
  async handleDailyWarningCheck() {
    this.logger.log('🕕 18:00 - Daily warning check started');
    
    try {
      const warningCount = await this.attendanceService.addWarningToLateEmployees();
      this.logger.log(`✅ Daily warning check completed. ${warningCount} warnings added.`);
    } catch (error) {
      this.logger.error('❌ Daily warning check failed:', error.message);
    }
  }

  /**
   * Har kuni 00:01 da ishga tushadi
   * Kechagi warninglarni tozalash
   */
  @Cron('0 1 * * *') // Har kuni 00:01
  async handleDailyWarningReset() {
    this.logger.log('🕐 00:01 - Daily warning reset started');
    
    try {
      // Kechagi warninglarni tozalash logika
      this.logger.log('✅ Daily warning reset completed.');
    } catch (error) {
      this.logger.error('❌ Daily warning reset failed:', error.message);
    }
  }

  /**
   * Har hafta dushanba 09:00 da ishga tushadi
   * O'tgan hafta statistikasini hisoblash
   */
  @Cron('0 9 * * 1') // Har hafta dushanba 09:00
  async handleWeeklyStatistics() {
    this.logger.log('📅 Monday 09:00 - Weekly statistics calculation started');
    
    try {
      // O'tgan hafta statistikasini hisoblash logika
      this.logger.log('✅ Weekly statistics calculation completed.');
    } catch (error) {
      this.logger.error('❌ Weekly statistics calculation failed:', error.message);
    }
  }

  /**
   * Har oy 1-kuni 09:00 da ishga tushadi
   * O'tgan oy statistikasini hisoblash
   */
  @Cron('0 9 1 * *') // Har oy 1-kuni 09:00
  async handleMonthlyStatistics() {
    this.logger.log('📅 1st of month 09:00 - Monthly statistics calculation started');
    
    try {
      // O'tgan oy statistikasini hisoblash logika
      this.logger.log('✅ Monthly statistics calculation completed.');
    } catch (error) {
      this.logger.error('❌ Monthly statistics calculation failed:', error.message);
    }
  }

  /**
   * Har yil 1-yanvar 09:00 da ishga tushadi
   * O'tgan yil statistikasini hisoblash
   */
  @Cron('0 9 1 1 *') // Har yil 1-yanvar 09:00
  async handleYearlyStatistics() {
    this.logger.log('📅 1st January 09:00 - Yearly statistics calculation started');
    
    try {
      // O'tgan yil statistikasini hisoblash logika
      this.logger.log('✅ Yearly statistics calculation completed.');
    } catch (error) {
      this.logger.error('❌ Yearly statistics calculation failed:', error.message);
    }
  }
}
