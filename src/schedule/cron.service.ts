import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Attendance, AttendanceSchema } from '../schemas/attendance.schema';
import { Employee, EmployeeSchema } from '../schemas/employee.schema';
import { AttendanceType, AttendanceStatus } from '../dto/schedule.dto';
import { ScheduleGateway } from './schedule.gateway';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    @InjectModel(Attendance.name)
    private readonly attendanceModel: Model<Attendance>,
    @InjectModel(Employee.name)
    private readonly employeeModel: Model<Employee>,
    private readonly gateway: ScheduleGateway,
  ) {}

  // Har kuni 12:00 da ishlamoqda bo'lgan xodimlarga warning berish
  @Cron('0 12 * * *', {
    name: 'mark-active-employees-warning',
    timeZone: 'Asia/Tashkent',
  })
  async markActiveEmployeesWarning() {
    this.logger.log(
      '🔄 Starting cron job: Mark active employees with warning at 12:00 PM',
    );

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Bugun check-in qilgan lekin check-out qilmagan xodimlarni topish
      const activeEmployees = await this.attendanceModel.aggregate([
        {
          $match: {
            timestamp: { $gte: today, $lt: tomorrow },
            type: AttendanceType.IN,
            isDeleted: false,
          },
        },
        {
          $group: {
            _id: '$employeeId',
            checkIns: { $push: '$$ROOT' },
          },
        },
        {
          $lookup: {
            from: 'attendances',
            let: { empId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$employeeId', '$$empId'] },
                      { $gte: ['$timestamp', today] },
                      { $lt: ['$timestamp', tomorrow] },
                      { $eq: ['$type', AttendanceType.OUT] },
                      { $eq: ['$isDeleted', false] },
                    ],
                  },
                },
              },
            ],
            as: 'checkOuts',
          },
        },
        {
          $match: {
            $expr: { $eq: [{ $size: '$checkOuts' }, 0] }, // Check-out qilmaganlar
          },
        },
      ]);

      this.logger.log(
        `📊 Found ${activeEmployees.length} employees still active at 12:00 PM`,
      );

      let warningCount = 0;

      for (const employeeData of activeEmployees) {
        const employeeId = employeeData._id;
        const checkIns = employeeData.checkIns;

        // Eng oxirgi check-in ni olish
        const latestCheckIn = checkIns.sort(
          (a, b) => b.timestamp - a.timestamp,
        )[0];

        // Warning ma'lumotlarini yangilash
        await this.attendanceModel.updateOne(
          { _id: latestCheckIn._id },
          {
            $set: {
              hasWarning: true,
              warningReason: 'Ish vaqti tugaganidan keyin ham ishlamoqda',
              warningTimestamp: new Date(),
            },
          },
        );

        warningCount++;

        this.logger.log(
          `⚠️  Warning added for employee ${employeeId} - still active after 12:00 PM`,
        );

        // Real-time update yuborish
        this.gateway.emitWarningAdded({
          employeeId: employeeId.toString(),
          employeeName: 'Employee', // Xodim nomini olish kerak
          warningReason: 'Ish vaqti tugaganidan keyin ham ishlamoqda',
          timestamp: new Date(),
        });
      }

      this.logger.log(
        `✅ Cron job completed: ${warningCount} employees marked with warning`,
      );
    } catch (error) {
      this.logger.error(
        '❌ Error in markActiveEmployeesWarning cron job:',
        error,
      );
    }
  }

  // Har kuni 18:00 da hali ham ishlamoqda bo'lgan xodimlarga qo'shimcha warning
  @Cron('0 18 * * *', {
    name: 'mark-overtime-employees-warning',
    timeZone: 'Asia/Tashkent',
  })
  async markOvertimeEmployeesWarning() {
    this.logger.log(
      '🔄 Starting cron job: Mark overtime employees with warning at 18:00 PM',
    );

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Bugun check-in qilgan lekin check-out qilmagan xodimlarni topish
      const activeEmployees = await this.attendanceModel.aggregate([
        {
          $match: {
            timestamp: { $gte: today, $lt: tomorrow },
            type: AttendanceType.IN,
            isDeleted: false,
          },
        },
        {
          $group: {
            _id: '$employeeId',
            checkIns: { $push: '$$ROOT' },
          },
        },
        {
          $lookup: {
            from: 'attendances',
            let: { empId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$employeeId', '$$empId'] },
                      { $gte: ['$timestamp', today] },
                      { $lt: ['$timestamp', tomorrow] },
                      { $eq: ['$type', AttendanceType.OUT] },
                      { $eq: ['$isDeleted', false] },
                    ],
                  },
                },
              },
            ],
            as: 'checkOuts',
          },
        },
        {
          $match: {
            $expr: { $eq: [{ $size: '$checkOuts' }, 0] }, // Check-out qilmaganlar
          },
        },
      ]);

      this.logger.log(
        `📊 Found ${activeEmployees.length} employees still active at 18:00 PM`,
      );

      let overtimeWarningCount = 0;

      for (const employeeData of activeEmployees) {
        const employeeId = employeeData._id;
        const checkIns = employeeData.checkIns;

        // Eng oxirgi check-in ni olish
        const latestCheckIn = checkIns.sort(
          (a, b) => b.timestamp - a.timestamp,
        )[0];

        // Overtime warning ma'lumotlarini yangilash
        await this.attendanceModel.updateOne(
          { _id: latestCheckIn._id },
          {
            $set: {
              hasWarning: true,
              warningReason:
                'Overtime ishlamoqda - 18:00 dan keyin ham ishlamoqda',
              warningTimestamp: new Date(),
            },
          },
        );

        overtimeWarningCount++;

        this.logger.log(
          `⚠️  Overtime warning added for employee ${employeeId} - still active after 18:00 PM`,
        );
      }

      this.logger.log(
        `✅ Overtime cron job completed: ${overtimeWarningCount} employees marked with overtime warning`,
      );
    } catch (error) {
      this.logger.error(
        '❌ Error in markOvertimeEmployeesWarning cron job:',
        error,
      );
    }
  }

  // Har kuni 00:01 da o'tgan kunlardagi ishlamoqda bo'lgan xodimlarni warning bilan belgilash
  @Cron('1 0 * * *', {
    name: 'mark-past-active-employees-warning',
    timeZone: 'Asia/Tashkent',
  })
  async markPastActiveEmployeesWarning() {
    this.logger.log(
      '🔄 Starting cron job: Mark past active employees with warning at 00:01',
    );

    try {
      // Kecha va undan oldingi kunlarni tekshirish
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Kecha va undan oldingi kunlarda check-in qilgan lekin check-out qilmagan xodimlarni topish
      const pastActiveEmployees = await this.attendanceModel.aggregate([
        {
          $match: {
            timestamp: { $gte: yesterday, $lt: today },
            type: AttendanceType.IN,
            isDeleted: false,
            hasWarning: { $ne: true }, // Faqat warning berilmaganlar
          },
        },
        {
          $group: {
            _id: '$employeeId',
            checkIns: { $push: '$$ROOT' },
          },
        },
        {
          $lookup: {
            from: 'attendances',
            let: { empId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$employeeId', '$$empId'] },
                      { $gte: ['$timestamp', yesterday] },
                      { $lt: ['$timestamp', today] },
                      { $eq: ['$type', AttendanceType.OUT] },
                      { $eq: ['$isDeleted', false] },
                    ],
                  },
                },
              },
            ],
            as: 'checkOuts',
          },
        },
        {
          $match: {
            $expr: { $eq: [{ $size: '$checkOuts' }, 0] }, // Check-out qilmaganlar
          },
        },
      ]);

      this.logger.log(
        `📊 Found ${pastActiveEmployees.length} past employees still active`,
      );

      let pastWarningCount = 0;

      for (const employeeData of pastActiveEmployees) {
        const employeeId = employeeData._id;
        const checkIns = employeeData.checkIns;

        // Eng oxirgi check-in ni olish
        const latestCheckIn = checkIns.sort(
          (a, b) => b.timestamp - a.timestamp,
        )[0];

        // Past warning ma'lumotlarini yangilash
        await this.attendanceModel.updateOne(
          { _id: latestCheckIn._id },
          {
            $set: {
              hasWarning: true,
              warningReason:
                "O'tgan kunlarda ishlamoqda bo'lgan - avtomatik warning",
              warningTimestamp: new Date(),
            },
          },
        );

        pastWarningCount++;

        this.logger.log(
          `⚠️  Past warning added for employee ${employeeId} - was active in past days`,
        );
      }

      this.logger.log(
        `✅ Past warning cron job completed: ${pastWarningCount} employees marked with past warning`,
      );
    } catch (error) {
      this.logger.error(
        '❌ Error in markPastActiveEmployeesWarning cron job:',
        error,
      );
    }
  }

  // Har kuni 23:59 da hali ham ishlamoqda bo'lgan xodimlarni avtomatik checkout qilish
  @Cron('59 23 * * *', {
    name: 'auto-checkout-employees',
    timeZone: 'Asia/Tashkent',
  })
  async autoCheckoutEmployees() {
    this.logger.log('🔄 Starting cron job: Auto checkout employees at 23:59');

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Bugun check-in qilgan lekin check-out qilmagan xodimlarni topish
      const activeEmployees = await this.attendanceModel.aggregate([
        {
          $match: {
            timestamp: { $gte: today, $lt: tomorrow },
            type: AttendanceType.IN,
            isDeleted: false,
          },
        },
        {
          $group: {
            _id: '$employeeId',
            checkIns: { $push: '$$ROOT' },
          },
        },
        {
          $lookup: {
            from: 'attendances',
            let: { empId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$employeeId', '$$empId'] },
                      { $gte: ['$timestamp', today] },
                      { $lt: ['$timestamp', tomorrow] },
                      { $eq: ['$type', AttendanceType.OUT] },
                      { $eq: ['$isDeleted', false] },
                    ],
                  },
                },
              },
            ],
            as: 'checkOuts',
          },
        },
        {
          $match: {
            $expr: { $eq: [{ $size: '$checkOuts' }, 0] }, // Check-out qilmaganlar
          },
        },
      ]);

      this.logger.log(
        `📊 Found ${activeEmployees.length} employees to auto checkout`,
      );

      let autoCheckoutCount = 0;

      for (const employeeData of activeEmployees) {
        const employeeId = employeeData._id;
        const checkIns = employeeData.checkIns;

        // Eng oxirgi check-in ni olish
        const latestCheckIn = checkIns.sort(
          (a, b) => b.timestamp - a.timestamp,
        )[0];

        // Avtomatik checkout yaratish
        const autoCheckout = new this.attendanceModel({
          employeeId: new Types.ObjectId(employeeId),
          timestamp: new Date(),
          type: AttendanceType.OUT,
          status: AttendanceStatus.NORMAL,
          location: latestCheckIn.location,
          device: 'AUTO_SYSTEM',
          notes:
            'Avtomatik checkout - 23:59 da sistem tomonidan amalga oshirildi',
          hasWarning: true,
          warningReason:
            "Avtomatik checkout - xodim o'z-o'zidan chiqish qilmagan",
          warningTimestamp: new Date(),
        });

        await autoCheckout.save();
        autoCheckoutCount++;

        this.logger.log(
          `✅ Auto checkout created for employee ${employeeId} at 23:59`,
        );
      }

      this.logger.log(
        `✅ Auto checkout cron job completed: ${autoCheckoutCount} employees auto checked out`,
      );
    } catch (error) {
      this.logger.error('❌ Error in autoCheckoutEmployees cron job:', error);
    }
  }
}
