/* eslint-disable @typescript-eslint/no-base-to-string */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable quotes */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Attendance,
  AttendanceType,
  AttendanceStatus,
} from '../schemas/attendance.schema';
import { Employee } from '../schemas/employee.schema';
import { AttendanceFilterDto } from '../dto/schedule.dto';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @InjectModel(Attendance.name) private attendanceModel: Model<Attendance>,
    @InjectModel(Employee.name) private employeeModel: Model<Employee>,
  ) {}

  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Jami xodimlar soni
    const totalEmployees = await this.employeeModel.countDocuments({
      status: 'active',
      isDeleted: false,
    });

    // Bugungi attendance ma'lumotlari
    const todayAttendances = await this.attendanceModel
      .find({
        timestamp: { $gte: today, $lt: tomorrow },
        isDeleted: false,
      })
      .populate('employeeId');

    const todayCheckIns = todayAttendances.filter(
      (a) => a.type === AttendanceType.IN,
    );
    const todayCheckOuts = todayAttendances.filter(
      (a) => a.type === AttendanceType.OUT,
    );

    // Bugun ishga kelgan xodimlar
    const presentEmployeeIds = new Set(
      todayCheckIns.map((a) => a.employeeId.toString()),
    );
    const presentToday = presentEmployeeIds.size;

    // Kechikkanlar
    const lateToday = todayCheckIns.filter(
      (a) => a.status === AttendanceStatus.LATE,
    ).length;

    // Kelmaganlar
    const absentToday = totalEmployees - presentToday;

    // O'rtacha kirish vaqti
    const checkInTimes = todayCheckIns.map(
      (a) => a.timestamp.getHours() * 60 + a.timestamp.getMinutes(),
    );
    const averageMinutes =
      checkInTimes.length > 0
        ? checkInTimes.reduce((sum, time) => sum + time, 0) /
          checkInTimes.length
        : 0;
    const averageHours = Math.floor(averageMinutes / 60);
    const averageMins = Math.floor(averageMinutes % 60);
    const averageCheckInTime = `${averageHours.toString().padStart(2, '0')}:${averageMins.toString().padStart(2, '0')}`;

    // Davomat foizi
    const attendanceRate =
      totalEmployees > 0
        ? Math.round((presentToday / totalEmployees) * 100)
        : 0;

    // Warninglar soni
    const warningsCount = await this.attendanceModel.countDocuments({
      hasWarning: true,
      timestamp: { $gte: today, $lt: tomorrow },
      isDeleted: false,
    });

    // Kechikishlar soni
    const lateCount = await this.attendanceModel.countDocuments({
      status: AttendanceStatus.LATE,
      timestamp: { $gte: today, $lt: tomorrow },
      isDeleted: false,
    });

    // Jami ish soatlari
    let totalWorkHours = 0;
    for (const employeeId of presentEmployeeIds) {
      const employeeAttendances = todayAttendances.filter(
        (a) => a.employeeId.toString() === employeeId,
      );
      const checkIns = employeeAttendances.filter(
        (a) => a.type === AttendanceType.IN,
      );
      const checkOuts = employeeAttendances.filter(
        (a) => a.type === AttendanceType.OUT,
      );

      if (checkIns.length > 0 && checkOuts.length > 0) {
        const checkInTime = checkIns[0].timestamp;
        const checkOutTime = checkOuts[0].timestamp;
        const diffMs = checkOutTime.getTime() - checkInTime.getTime();
        const hours = diffMs / (1000 * 60 * 60);
        totalWorkHours += Math.max(0, hours - 1); // Tushlik vaqtini hisobga olish
      }
    }

    return {
      totalEmployees,
      presentToday,
      lateToday,
      absentToday,
      averageCheckInTime,
      attendanceRate,
      todayCheckIns: todayCheckIns.length,
      todayCheckOuts: todayCheckOuts.length,
      warningsCount,
      lateCount,
      totalWorkHours: Math.round(totalWorkHours * 100) / 100,
    };
  }

  async getAttendanceSummary(date: string) {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const totalEmployees = await this.employeeModel.countDocuments({
      status: 'active',
      isDeleted: false,
    });

    const attendances = await this.attendanceModel.find({
      timestamp: { $gte: targetDate, $lt: nextDay },
      type: AttendanceType.IN,
      isDeleted: false,
    });

    const presentEmployeeIds = new Set(
      attendances.map((a) => a.employeeId.toString()),
    );
    const present = presentEmployeeIds.size;
    const late = attendances.filter(
      (a) => a.status === AttendanceStatus.LATE,
    ).length;
    const absent = totalEmployees - present;
    const attendanceRate =
      totalEmployees > 0 ? Math.round((present / totalEmployees) * 100) : 0;

    return {
      date,
      totalEmployees,
      present,
      late,
      absent,
      attendanceRate,
    };
  }

  async getDailyReport(date: string) {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Barcha xodimlarni olish
    const employees = await this.employeeModel.find({
      status: 'active',
      isDeleted: false,
    });

    const report = {
      date,
      summary: await this.getAttendanceSummary(date),
      employees: [] as any[],
    };

    for (const employee of employees) {
      const attendances = await this.attendanceModel
        .find({
          employeeId: employee._id,
          timestamp: { $gte: targetDate, $lt: nextDay },
          isDeleted: false,
        })
        .sort({ timestamp: 1 });

      const checkIns = attendances.filter((a) => a.type === AttendanceType.IN);
      const checkOuts = attendances.filter(
        (a) => a.type === AttendanceType.OUT,
      );

      let status = 'absent';
      let checkInTime: string | null = null;
      let checkOutTime: string | null = null;
      let workHours = 0;

      if (checkIns.length > 0) {
        checkInTime = checkIns[0].timestamp.toTimeString().substring(0, 5);

        if (checkOuts.length > 0) {
          checkOutTime = checkOuts[0].timestamp.toTimeString().substring(0, 5);

          // Ish vaqtini hisoblash
          const diffMs =
            checkOuts[0].timestamp.getTime() - checkIns[0].timestamp.getTime();
          workHours = Math.max(0, diffMs / (1000 * 60 * 60) - 1); // Tushlik vaqtini hisobga olish

          status = 'present';
        } else {
          status = 'half-day';
        }

        // Kechikish tekshirish
        const workStartTime = new Date(targetDate);
        workStartTime.setHours(8, 0, 0, 0);
        if (checkIns[0].timestamp > workStartTime) {
          status = 'late';
        }
      }

      report.employees.push({
        employeeId: employee._id,
        name: employee.fullName,
        department: employee.department,
        position: employee.position,
        status,
        checkInTime,
        checkOutTime,
        workHours: Math.round(workHours * 100) / 100,
        attendances: attendances.map((att) => ({
          time: att.timestamp.toTimeString().substring(0, 5),
          type: att.type,
          status: att.status,
          location: att.location?.address,
        })),
      });
    }

    return report;
  }

  async getMonthlyReport(year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const totalEmployees = await this.employeeModel.countDocuments({
      status: 'active',
      isDeleted: false,
    });

    const dailyReports: any[] = [];
    const monthSummary = {
      totalDays: endDate.getDate(),
      workingDays: 0,
      totalPresent: 0,
      totalLate: 0,
      totalAbsent: 0,
      averageAttendanceRate: 0,
    };

    for (let day = 1; day <= endDate.getDate(); day++) {
      const currentDate = new Date(year, month - 1, day);
      const dateStr = currentDate.toISOString().split('T')[0];

      // Hafta kunini tekshirish (shanba = 6, yakshanba = 0)
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // Ish kunlari
        monthSummary.workingDays++;

        const dailySummary = await this.getAttendanceSummary(dateStr);
        dailyReports.push(dailySummary);

        monthSummary.totalPresent += dailySummary.present;
        monthSummary.totalLate += dailySummary.late;
        monthSummary.totalAbsent += dailySummary.absent;
      }
    }

    monthSummary.averageAttendanceRate =
      monthSummary.workingDays > 0
        ? Math.round(
            (monthSummary.totalPresent /
              (monthSummary.workingDays * totalEmployees)) *
              100,
          )
        : 0;

    return {
      year,
      month,
      monthName: this.getMonthName(month),
      summary: monthSummary,
      dailyReports,
    };
  }

  async getYearlyReport(year: number) {
    const monthlyReports: any[] = [];
    const yearSummary = {
      totalMonths: 12,
      totalWorkingDays: 0,
      totalPresent: 0,
      totalLate: 0,
      totalAbsent: 0,
      averageAttendanceRate: 0,
    };

    for (let month = 1; month <= 12; month++) {
      const monthlyReport = await this.getMonthlyReport(year, month);
      monthlyReports.push(monthlyReport);

      yearSummary.totalWorkingDays += monthlyReport.summary.workingDays;
      yearSummary.totalPresent += monthlyReport.summary.totalPresent;
      yearSummary.totalLate += monthlyReport.summary.totalLate;
      yearSummary.totalAbsent += monthlyReport.summary.totalAbsent;
    }

    yearSummary.averageAttendanceRate =
      yearSummary.totalWorkingDays > 0
        ? Math.round(
            (yearSummary.totalPresent /
              (yearSummary.totalWorkingDays *
                (await this.employeeModel.countDocuments({
                  status: 'active',
                  isDeleted: false,
                })))) *
              100,
          )
        : 0;

    return {
      year,
      summary: yearSummary,
      monthlyReports,
    };
  }

  async exportAttendanceToExcel(filter?: AttendanceFilterDto) {
    const query: any = { isDeleted: false };

    if (filter?.startDate) {
      query.timestamp = {
        ...query.timestamp,
        $gte: new Date(filter.startDate),
      };
    }

    if (filter?.endDate) {
      query.timestamp = { ...query.timestamp, $lte: new Date(filter.endDate) };
    }

    if (filter?.employeeId) {
      query.employeeId = new Types.ObjectId(filter.employeeId);
    }

    if (filter?.status) {
      query.status = filter.status;
    }

    const attendances = await this.attendanceModel
      .find(query)
      .populate('employeeId')
      .sort({ timestamp: -1 });

    return attendances.map((att) => ({
      'Xodim ID': att.employeeId.toString(),
      'Xodim Ismi': (att.employeeId as any).fullName,
      Sana: att.timestamp.toISOString().split('T')[0],
      Vaqt: att.timestamp.toTimeString().substring(0, 5),
      Turi: att.type === AttendanceType.IN ? 'Kirish' : 'Chiqish',
      Status: att.status,
      Manzil: att.location?.address || "Noma'lum",
      Qurilma: att.device || "Noma'lum",
      Izohlar: att.notes || '',
    }));
  }

  async exportAttendanceToPDF(filter?: AttendanceFilterDto) {
    // PDF export uchun ma'lumotlarni tayyorlash
    return this.exportAttendanceToExcel(filter);
  }

  private getMonthName(month: number): string {
    const months = [
      'Yanvar',
      'Fevral',
      'Mart',
      'Aprel',
      'May',
      'Iyun',
      'Iyul',
      'Avgust',
      'Sentabr',
      'Oktabr',
      'Noyabr',
      'Dekabr',
    ];
    return months[month - 1];
  }
}
