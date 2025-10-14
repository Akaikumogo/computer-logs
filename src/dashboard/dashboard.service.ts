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

    // Kechikkanlar (faqat har bir xodimning kun mobaynidagi eng birinchi kirishi bo'yicha)
    const firstInByEmployeeStats = new Map<string, Attendance>();
    for (const a of [...todayCheckIns].sort(
      (x, y) => x.timestamp.getTime() - y.timestamp.getTime(),
    )) {
      const key = a.employeeId.toString();
      if (!firstInByEmployeeStats.has(key)) firstInByEmployeeStats.set(key, a);
    }
    const lateToday = Array.from(firstInByEmployeeStats.values()).filter(
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

  async getDashboardOverview() {
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

    // Kechikkanlar (faqat har bir xodimning kun mobaynidagi eng birinchi kirishi bo'yicha)
    const firstInByEmployeeOverview = new Map<string, Attendance>();
    for (const a of [...todayCheckIns].sort(
      (x, y) => x.timestamp.getTime() - y.timestamp.getTime(),
    )) {
      const key = a.employeeId.toString();
      if (!firstInByEmployeeOverview.has(key))
        firstInByEmployeeOverview.set(key, a);
    }
    const lateToday = Array.from(firstInByEmployeeOverview.values()).filter(
      (a) => a.status === AttendanceStatus.LATE,
    ).length;

    // Kelmaganlar
    const absentToday = totalEmployees - presentToday;

    // Davomat foizi
    const attendanceRate =
      totalEmployees > 0
        ? Math.round((presentToday / totalEmployees) * 100)
        : 0;

    // Bugungi vazifalar (mock data - keyin real API qo'shamiz)
    const totalTasks = 200;
    const completedTasks = 15;
    const pendingTasks = totalTasks - completedTasks;

    // Haftalik statistika (oxirgi 7 kun)
    const weeklyStats = await this.getWeeklyStats();

    // Oylik statistika (oxirgi 30 kun)
    const monthlyStats = await this.getMonthlyStats();

    return {
      // Asosiy statistika
      totalEmployees,
      presentToday,
      lateToday,
      absentToday,
      attendanceRate,

      // Vazifalar
      totalTasks,
      completedTasks,
      pendingTasks,

      // Haftalik statistika
      weeklyStats,

      // Oylik statistika
      monthlyStats,

      // Bugungi ishchilar ro'yxati
      todayEmployees: await this.getTodayEmployees(),

      // Bugungi vazifalar ro'yxati
      todayTasks: await this.getTodayTasks(),
    };
  }

  private async getWeeklyStats() {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const totalEmployees = await this.employeeModel.countDocuments({
      status: 'active',
      isDeleted: false,
    });

    const weeklyAttendances = await this.attendanceModel
      .find({
        timestamp: { $gte: startDate, $lte: endDate },
        type: AttendanceType.IN,
        isDeleted: false,
      })
      .populate('employeeId');

    const presentEmployeeIds = new Set(
      weeklyAttendances.map((a) => a.employeeId.toString()),
    );
    const present = presentEmployeeIds.size;
    // Kechikishlar: har bir kun va xodim uchun faqat eng birinchi kirishga qarab
    const firstInByEmployeeDayWeekly = new Map<string, Attendance>();
    for (const a of [...weeklyAttendances].sort(
      (x, y) => x.timestamp.getTime() - y.timestamp.getTime(),
    )) {
      const d = new Date(a.timestamp);
      d.setHours(0, 0, 0, 0);
      const dayKey = d.toISOString();
      const key = `${a.employeeId.toString()}__${dayKey}`;
      if (!firstInByEmployeeDayWeekly.has(key))
        firstInByEmployeeDayWeekly.set(key, a);
    }
    const late = Array.from(firstInByEmployeeDayWeekly.values()).filter(
      (a) => a.status === AttendanceStatus.LATE,
    ).length;

    return {
      totalDays: 7,
      present,
      late,
      absent: totalEmployees * 7 - present,
      attendanceRate:
        totalEmployees > 0
          ? Math.round((present / (totalEmployees * 7)) * 100)
          : 0,
    };
  }

  private async getMonthlyStats() {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const totalEmployees = await this.employeeModel.countDocuments({
      status: 'active',
      isDeleted: false,
    });

    const monthlyAttendances = await this.attendanceModel
      .find({
        timestamp: { $gte: startDate, $lte: endDate },
        type: AttendanceType.IN,
        isDeleted: false,
      })
      .populate('employeeId');

    const presentEmployeeIds = new Set(
      monthlyAttendances.map((a) => a.employeeId.toString()),
    );
    const present = presentEmployeeIds.size;
    // Kechikishlar: har bir kun va xodim uchun faqat eng birinchi kirishga qarab
    const firstInByEmployeeDayMonthly = new Map<string, Attendance>();
    for (const a of [...monthlyAttendances].sort(
      (x, y) => x.timestamp.getTime() - y.timestamp.getTime(),
    )) {
      const d = new Date(a.timestamp);
      d.setHours(0, 0, 0, 0);
      const dayKey = d.toISOString();
      const key = `${a.employeeId.toString()}__${dayKey}`;
      if (!firstInByEmployeeDayMonthly.has(key))
        firstInByEmployeeDayMonthly.set(key, a);
    }
    const late = Array.from(firstInByEmployeeDayMonthly.values()).filter(
      (a) => a.status === AttendanceStatus.LATE,
    ).length;

    return {
      totalDays: 30,
      present,
      late,
      absent: totalEmployees * 30 - present,
      attendanceRate:
        totalEmployees > 0
          ? Math.round((present / (totalEmployees * 30)) * 100)
          : 0,
    };
  }

  private async getTodayEmployees() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Har bir xodim uchun eng birinchi kirish va eng oxirgi chiqishni olish
    const pipeline = [
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
          firstCheckIn: { $first: '$$ROOT' },
          lastCheckOut: { $last: '$$ROOT' },
        },
      },
      {
        $lookup: {
          from: 'employees',
          localField: '_id',
          foreignField: '_id',
          as: 'employee',
        },
      },
      {
        $unwind: '$employee',
      },
    ];

    const employees = await this.attendanceModel.aggregate(pipeline);

    const result: any[] = [];

    for (const item of employees) {
      const employee = item.employee;
      const firstCheckIn = item.firstCheckIn;

      // Eng oxirgi check-out ni topish
      const checkOut = await this.attendanceModel
        .findOne({
          employeeId: employee._id,
          timestamp: { $gte: today, $lt: tomorrow },
          type: AttendanceType.OUT,
          isDeleted: false,
        })
        .sort({ timestamp: -1 });

      // Bugungi oxirgi attendance yozuvi (IN yoki OUT)
      const lastTodayAttendance = await this.attendanceModel
        .findOne({
          employeeId: employee._id,
          timestamp: { $gte: today, $lt: tomorrow },
          isDeleted: false,
        })
        .sort({ timestamp: -1 });

      const inWork = lastTodayAttendance?.type === AttendanceType.IN;

      result.push({
        id: employee._id,
        name: employee.fullName,
        checkInTime: firstCheckIn.timestamp
          .toTimeString()
          .split(' ')[0]
          .substring(0, 5),
        checkOutTime: checkOut
          ? checkOut.timestamp.toTimeString().split(' ')[0].substring(0, 5)
          : null,
        inWork,
        status:
          firstCheckIn.status === AttendanceStatus.LATE ? 'late' : 'present',
        department: employee.department,
      });
    }

    return result;
  }

  private async getTodayTasks() {
    // Mock data - keyin real task API qo'shamiz
    return [
      {
        id: 1,
        title: 'Sistema yangilanishi',
        status: 'inProgress',
        assignedTo: 'IT Department',
        createdAt: '09:30',
      },
      {
        id: 2,
        title: 'Hisobot tayyorlash',
        status: 'completed',
        assignedTo: 'Buxgalteriya',
        createdAt: '08:15',
      },
      {
        id: 3,
        title: 'Mijoz bilan uchrashuv',
        status: 'pending',
        assignedTo: 'Moliya',
        createdAt: '10:00',
      },
      {
        id: 4,
        title: 'Dokumentatsiya tekshirish',
        status: 'inProgress',
        assignedTo: 'HR',
        createdAt: '11:30',
      },
      {
        id: 5,
        title: "Yig'ilish tashkillashtirish",
        status: 'pending',
        assignedTo: 'Boshqarma',
        createdAt: '14:00',
      },
    ];
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
    // Kechikishlar: faqat har bir xodimning KUN MOBAYNIDAGI ENG BIRINCHI KIRISHI bo'yicha
    const firstInByEmployeeSummary = new Map<string, Attendance>();
    for (const a of [...attendances].sort(
      (x, y) => x.timestamp.getTime() - y.timestamp.getTime(),
    )) {
      const key = a.employeeId.toString();
      if (!firstInByEmployeeSummary.has(key))
        firstInByEmployeeSummary.set(key, a);
    }
    const late = Array.from(firstInByEmployeeSummary.values()).filter(
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

  // Maintenance: normalize late statuses to only first IN per employee per day
  async fixLateStatus(startDateStr?: string, endDateStr?: string) {
    const start = startDateStr ? new Date(startDateStr) : new Date('2000-01-01');
    start.setHours(0, 0, 0, 0);
    const end = endDateStr ? new Date(endDateStr) : new Date();
    end.setHours(23, 59, 59, 999);

    // Fetch IN records in range
    const attendances = await this.attendanceModel
      .find({
        timestamp: { $gte: start, $lte: end },
        type: AttendanceType.IN,
        isDeleted: false,
      })
      .sort({ employeeId: 1, timestamp: 1 })
      .lean();

    const updates: { updateOne: { filter: any; update: any } }[] = [];
    let updatedCount = 0;

    // Map key: employeeId + day (local day start)
    const firstInMap = new Map<string, string>(); // key -> attendance _id of first IN

    for (const a of attendances) {
      const d = new Date(a.timestamp);
      d.setHours(0, 0, 0, 0);
      const dayKey = d.toISOString();
      const key = `${a.employeeId.toString()}__${dayKey}`;

      const workStart = new Date(d);
      workStart.setHours(8, 0, 0, 0); // 08:00 as start

      if (!firstInMap.has(key)) {
        // This is the first IN of the day for the employee
        firstInMap.set(key, (a as any)._id.toString());
        const desiredStatus = a.timestamp > workStart ? AttendanceStatus.LATE : AttendanceStatus.NORMAL;
        if (a.status !== desiredStatus) {
          updates.push({
            updateOne: {
              filter: { _id: (a as any)._id },
              update: { $set: { status: desiredStatus } },
            },
          });
          updatedCount++;
        }
      } else {
        // Subsequent INs of same day must never be LATE
        if (a.status === AttendanceStatus.LATE) {
          updates.push({
            updateOne: {
              filter: { _id: (a as any)._id },
              update: { $set: { status: AttendanceStatus.NORMAL } },
            },
          });
          updatedCount++;
        }
      }
    }

    if (updates.length > 0) {
      await this.attendanceModel.bulkWrite(updates, { ordered: false });
    }

    return { updated: updatedCount };
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
