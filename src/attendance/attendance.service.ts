/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Attendance,
  AttendanceType,
  AttendanceStatus,
} from '../schemas/attendance.schema';
import { Employee } from '../schemas/employee.schema';
import {
  CheckInOutDto,
  AttendanceQueryDto,
  AttendanceStatisticsDto,
} from '../dto/attendance.dto';

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);

  constructor(
    @InjectModel(Attendance.name) private attendanceModel: Model<Attendance>,
    @InjectModel(Employee.name) private employeeModel: Model<Employee>,
  ) {}

  /**
   * Xodimning kirish yoki chiqishini qayd qilish
   * Birinchi marta = Kirish, ikkinchi marta = Chiqish, uchinchi marta = Kirish...
   */
  async checkInOut(checkInOutDto: CheckInOutDto) {
    const { employeeId, location, device, notes } = checkInOutDto;

    // Xodimni tekshirish
    const employee = await this.employeeModel.findById(employeeId);
    if (!employee) {
      throw new NotFoundException('Xodim topilmadi');
    }

    // Bugungi attendance recordlarini olish
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAttendances = await this.attendanceModel
      .find({
        employeeId: new Types.ObjectId(employeeId),
        timestamp: { $gte: today, $lt: tomorrow },
        isDeleted: false,
      })
      .sort({ timestamp: 1 });

    // Qaysi turda ekanligini aniqlash
    let type: AttendanceType;
    let status: AttendanceStatus = AttendanceStatus.NORMAL;

    if (todayAttendances.length === 0) {
      // Birinchi marta - Kirish
      type = AttendanceType.IN;

      // Kechikish tekshirish (9:00 dan keyin)
      const now = new Date();
      const workStartTime = new Date(today);
      workStartTime.setHours(9, 0, 0, 0);

      if (now > workStartTime) {
        status = AttendanceStatus.LATE;
      }
    } else {
      // Keyingi martalar - Kirish va Chiqish almashadi
      const lastAttendance = todayAttendances[todayAttendances.length - 1];
      type =
        lastAttendance.type === AttendanceType.IN
          ? AttendanceType.OUT
          : AttendanceType.IN;

      // Chiqish bo'lsa vaqt tekshirish
      if (type === AttendanceType.OUT) {
        const now = new Date();
        const workEndTime = new Date(today);
        workEndTime.setHours(18, 0, 0, 0);

        if (now < workEndTime) {
          status = AttendanceStatus.EARLY;
        } else if (now > workEndTime) {
          status = AttendanceStatus.OVERTIME;
        }
      }
    }

    // Yangi attendance yaratish
    const attendance = new this.attendanceModel({
      employeeId: new Types.ObjectId(employeeId),
      timestamp: new Date(),
      type,
      status,
      location,
      device,
      notes,
    });

    const savedAttendance = await attendance.save();

    this.logger.log(
      `Xodim ${employee.fullName} ${type === AttendanceType.IN ? 'kirdi' : 'chiqdi'} - ${status} status bilan`,
    );
    return {
      id: savedAttendance._id,
      employeeId: savedAttendance.employeeId,
      employeeName: employee.fullName,
      timestamp: savedAttendance.timestamp,
      type: savedAttendance.type,
      status: savedAttendance.status,
      location: savedAttendance.location,
      device: savedAttendance.device,
      notes: savedAttendance.notes,
      hasWarning: savedAttendance.hasWarning,
    };
  }

  /**
   * Xodimning bugungi attendance ma'lumotini olish
   */
  async getTodayAttendance(employeeId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendances = await this.attendanceModel
      .find({
        employeeId: new Types.ObjectId(employeeId),
        timestamp: { $gte: today, $lt: tomorrow },
        isDeleted: false,
      })
      .sort({ timestamp: 1 });

    if (attendances.length === 0) {
      return {
        employeeId,
        today: today.toISOString().split('T')[0],
        checkIns: 0,
        checkOuts: 0,
        totalWorkHours: 0,
        status: 'No attendance today',
        attendances: [],
      };
    }

    // Ish vaqtini hisoblash
    let totalWorkHours = 0;
    for (let i = 0; i < attendances.length - 1; i += 2) {
      if (
        attendances[i].type === AttendanceType.IN &&
        attendances[i + 1]?.type === AttendanceType.OUT
      ) {
        const checkIn = new Date(attendances[i].timestamp);
        const checkOut = new Date(attendances[i + 1].timestamp);
        const diffMs = checkOut.getTime() - checkIn.getTime();
        totalWorkHours += diffMs / (1000 * 60 * 60); // Soatga o'tkazish
      }
    }

    return {
      employeeId,
      today: today.toISOString().split('T')[0],
      checkIns: attendances.filter((a) => a.type === AttendanceType.IN).length,
      checkOuts: attendances.filter((a) => a.type === AttendanceType.OUT)
        .length,
      totalWorkHours: Math.round(totalWorkHours * 100) / 100,
      status:
        attendances[attendances.length - 1].type === AttendanceType.IN
          ? 'Currently at work'
          : 'Left work',
      attendances: attendances.map((a) => ({
        id: a._id,
        timestamp: a.timestamp,
        type: a.type,
        status: a.status,
        location: a.location,
        device: a.device,
        notes: a.notes,
      })),
    };
  }

  /**
   * Attendance ro'yxatini olish (filter va pagination bilan)
   */
  async getAttendances(query: AttendanceQueryDto) {
    const { employeeId, fromDate, toDate, type, page = 1, limit = 20 } = query;

    const filter: any = { isDeleted: false };

    if (employeeId) {
      filter.employeeId = new Types.ObjectId(employeeId);
    }

    if (type) {
      filter.type = type;
    }

    if (fromDate || toDate) {
      filter.timestamp = {};
      if (fromDate) {
        filter.timestamp.$gte = new Date(fromDate);
      }
      if (toDate) {
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);
        filter.timestamp.$lte = endDate;
      }
    }

    const skip = (page - 1) * limit;

    const [attendances, total] = await Promise.all([
      this.attendanceModel
        .find(filter)
        .populate('employeeId', 'fullName position department')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.attendanceModel.countDocuments(filter),
    ]);

    return {
      attendances,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Xodimning attendance statistikasini olish
   */
  async getEmployeeStatistics(
    employeeId: string,
    fromDate?: string,
    toDate?: string,
  ): Promise<AttendanceStatisticsDto> {
    const filter: any = {
      employeeId: new Types.ObjectId(employeeId),
      isDeleted: false,
    };

    if (fromDate || toDate) {
      filter.timestamp = {};
      if (fromDate) {
        filter.timestamp.$gte = new Date(fromDate);
      }
      if (toDate) {
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);
        filter.timestamp.$lte = endDate;
      }
    }

    const attendances = await this.attendanceModel
      .find(filter)
      .sort({ timestamp: 1 });

    let totalWorkHours = 0;
    let lateCount = 0;
    let earlyCount = 0;
    let overtimeCount = 0;
    let warningCount = 0;

    // Har bir kun uchun ish vaqtini hisoblash
    const dailyWorkHours = new Map<string, number>();

    for (let i = 0; i < attendances.length - 1; i += 2) {
      if (
        attendances[i].type === AttendanceType.IN &&
        attendances[i + 1]?.type === AttendanceType.OUT
      ) {
        const checkIn = new Date(attendances[i].timestamp);
        const checkOut = new Date(attendances[i + 1].timestamp);
        const diffMs = checkOut.getTime() - checkIn.getTime();
        const hours = diffMs / (1000 * 60 * 60);

        const dayKey = checkIn.toISOString().split('T')[0];
        dailyWorkHours.set(dayKey, (dailyWorkHours.get(dayKey) || 0) + hours);

        totalWorkHours += hours;
      }

      // Status statistikasi
      if (attendances[i].status === AttendanceStatus.LATE) lateCount++;
      if (attendances[i].status === AttendanceStatus.EARLY) earlyCount++;
      if (attendances[i].status === AttendanceStatus.OVERTIME) overtimeCount++;
      if (attendances[i].hasWarning) warningCount++;
    }

    const totalCheckIns = attendances.filter(
      (a) => a.type === AttendanceType.IN,
    ).length;
    const totalCheckOuts = attendances.filter(
      (a) => a.type === AttendanceType.OUT,
    ).length;
    const averageWorkHours =
      dailyWorkHours.size > 0 ? totalWorkHours / dailyWorkHours.size : 0;

    return {
      totalCheckIns,
      totalCheckOuts,
      totalWorkHours: Math.round(totalWorkHours * 100) / 100,
      averageWorkHours: Math.round(averageWorkHours * 100) / 100,
      lateCount,
      earlyCount,
      overtimeCount,
      warningCount,
    };
  }

  /**
   * 18:00 dan keyin chiqmagan xodimlarga warning qo'yish
   */
  async addWarningToLateEmployees() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Bugungi barcha attendance recordlarini olish
    const todayAttendances = await this.attendanceModel
      .find({
        timestamp: { $gte: today, $lt: tomorrow },
        isDeleted: false,
      })
      .populate('employeeId', 'fullName');

    // Har bir xodim uchun tekshirish
    const employeeAttendanceMap = new Map<string, any[]>();

    for (const attendance of todayAttendances) {
      const empId = attendance.employeeId.toString();
      if (!employeeAttendanceMap.has(empId)) {
        employeeAttendanceMap.set(empId, []);
      }
      employeeAttendanceMap.get(empId)!.push(attendance);
    }

    let warningCount = 0;

    for (const [employeeId, attendances] of employeeAttendanceMap) {
      // Xodimning oxirgi attendance recordini olish
      const sortedAttendances = attendances.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );

      const lastAttendance = sortedAttendances[0];

      // Agar oxirgi record IN bo'lsa va 18:00 dan keyin bo'lsa
      if (lastAttendance.type === AttendanceType.IN) {
        const lastCheckInTime = new Date(lastAttendance.timestamp);
        const workEndTime = new Date(today);
        workEndTime.setHours(18, 0, 0, 0);

        if (lastCheckInTime > workEndTime) {
          // Warning qo'shish
          await this.attendanceModel.findByIdAndUpdate(lastAttendance._id, {
            hasWarning: true,
            warningReason: '18:00 dan keyin ishda qolgan',
            warningTimestamp: new Date(),
          });

          warningCount++;
          this.logger.warn(
            `Xodim ${lastAttendance.employeeId.fullName} ga warning qo'yildi - 18:00 dan keyin ishda qolgan`,
          );
        }
      }
    }

    this.logger.log(`${warningCount} ta xodimga warning qo'yildi`);
    return warningCount;
  }
}
