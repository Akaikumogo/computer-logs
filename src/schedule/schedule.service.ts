/* eslint-disable @typescript-eslint/no-base-to-string */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable quotes */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Attendance,
  AttendanceType,
  AttendanceStatus,
} from '../schemas/attendance.schema';
import { Employee } from '../schemas/employee.schema';
import { LocationService } from '../location/location.service';
import { SnapshotService } from './snapshot.service';
import {
  CheckInDto,
  CheckOutDto,
  FingerAttendanceDto,
  TodayAttendanceDto,
  DashboardStatsDto,
  AttendanceSummaryDto,
  DailyScheduleDto,
  MonthlyScheduleDto,
  YearlyScheduleDto,
  AttendanceFilterDto,
  AttendanceStatus as ScheduleAttendanceStatus,
} from '../dto/schedule.dto';

@Injectable()
export class ScheduleService {
  private readonly logger = new Logger(ScheduleService.name);

  constructor(
    @InjectModel(Attendance.name) private attendanceModel: Model<Attendance>,
    @InjectModel(Employee.name) private employeeModel: Model<Employee>,
    private locationService: LocationService,
    private snapshotService: SnapshotService,
  ) {}

  // ==================== CHECK IN/OUT OPERATIONS ====================

  async checkIn(checkInDto: CheckInDto) {
    const { employeeId, location, device, notes } = checkInDto;

    // Validate location name
    const locationData = await this.locationService.getLocationByName(location);

    // Create location data for attendance record
    const attendanceLocationData = {
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      address: locationData.address,
      accuracy: 100, // Default accuracy
    };

    // Xodimni topish
    const employee = await this.employeeModel.findById(employeeId);
    if (!employee) {
      throw new NotFoundException('Xodim topilmadi');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Bugungi attendance ma'lumotlarini olish
    const todayAttendances = await this.attendanceModel
      .find({
        employeeId: new Types.ObjectId(employeeId),
        timestamp: { $gte: today },
        type: AttendanceType.IN,
        isDeleted: false,
      })
      .sort({ timestamp: -1 });

    // Agar bugun allaqachon check-in qilingan bo'lsa
    if (todayAttendances.length > 0) {
      throw new BadRequestException('Bugun allaqachon kirish qayd qilingan');
    }

    // Status aniqlash (8:00 dan keyin = late)
    const now = new Date();
    const workStartTime = new Date(today);
    workStartTime.setHours(8, 0, 0, 0);

    let status = AttendanceStatus.NORMAL;
    if (now > workStartTime) {
      status = AttendanceStatus.LATE;
    }

    // Yangi attendance yaratish
    const attendance = new this.attendanceModel({
      employeeId: new Types.ObjectId(employeeId),
      timestamp: now,
      type: AttendanceType.IN,
      status,
      location: attendanceLocationData,
      device,
      notes,
    });

    const savedAttendance = await attendance.save();

    this.logger.log(
      `Xodim ${employee.fullName} kirish qayd qildi - ${status} status bilan`,
    );

    return {
      id: savedAttendance._id,
      employeeId: savedAttendance.employeeId,
      employeeName: employee.fullName,
      timestamp: savedAttendance.timestamp,
      type: savedAttendance.type,
      status: savedAttendance.status,
      location: attendanceLocationData,
      device: savedAttendance.device,
      notes: savedAttendance.notes,
      hasWarning: savedAttendance.hasWarning,
    };
  }

  async checkOut(checkOutDto: CheckOutDto) {
    const { employeeId, location, device, notes } = checkOutDto;

    // Validate location name
    const locationData = await this.locationService.getLocationByName(location);

    // Create location data for attendance record
    const attendanceLocationData = {
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      address: locationData.address,
      accuracy: 100, // Default accuracy
    };

    // Xodimni topish
    const employee = await this.employeeModel.findById(employeeId);
    if (!employee) {
      throw new NotFoundException('Xodim topilmadi');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Bugungi check-in ma'lumotini topish
    const todayCheckIn = await this.attendanceModel
      .findOne({
        employeeId: new Types.ObjectId(employeeId),
        timestamp: { $gte: today },
        type: AttendanceType.IN,
        isDeleted: false,
      })
      .sort({ timestamp: -1 });

    if (!todayCheckIn) {
      throw new BadRequestException('Avval kirish qayd qilishingiz kerak');
    }

    // Bugungi check-out ma'lumotini tekshirish
    const todayCheckOut = await this.attendanceModel.findOne({
      employeeId: new Types.ObjectId(employeeId),
      timestamp: { $gte: today },
      type: AttendanceType.OUT,
      isDeleted: false,
    });

    if (todayCheckOut) {
      throw new BadRequestException('Bugun allaqachon chiqish qayd qilingan');
    }

    // Status aniqlash (17:00 dan oldin = early, keyin = normal)
    const now = new Date();
    const workEndTime = new Date(today);
    workEndTime.setHours(17, 0, 0, 0);

    let status = AttendanceStatus.NORMAL;
    if (now < workEndTime) {
      status = AttendanceStatus.EARLY;
    } else if (now > workEndTime) {
      status = AttendanceStatus.OVERTIME;
    }

    // Yangi attendance yaratish
    const attendance = new this.attendanceModel({
      employeeId: new Types.ObjectId(employeeId),
      timestamp: now,
      type: AttendanceType.OUT,
      status,
      location: attendanceLocationData,
      device,
      notes,
    });

    const savedAttendance = await attendance.save();

    this.logger.log(
      `Xodim ${employee.fullName} chiqish qayd qildi - ${status} status bilan`,
    );

    return {
      id: savedAttendance._id,
      employeeId: savedAttendance.employeeId,
      employeeName: employee.fullName,
      timestamp: savedAttendance.timestamp,
      type: savedAttendance.type,
      status: savedAttendance.status,
      location: attendanceLocationData,
      device: savedAttendance.device,
      notes: savedAttendance.notes,
      hasWarning: savedAttendance.hasWarning,
    };
  }

  async checkInOutByFinger(fingerAttendanceDto: FingerAttendanceDto) {
    const { fingerNumber, location, device, notes } = fingerAttendanceDto;

    // Barmoq raqami orqali xodimni topish
    const employee = await this.employeeModel.findOne({
      fingerNumber: fingerNumber,
      isDeleted: false,
    });

    if (!employee) {
      throw new NotFoundException('Barmoq raqami topilmadi');
    }

    // Validate location name
    const locationData = await this.locationService.getLocationByName(location);

    // Create location data for attendance record
    const attendanceLocationData = {
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      address: locationData.address,
      accuracy: 100, // Default accuracy
    };

    // Bugungi attendance recordlarini olish
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAttendances = await this.attendanceModel
      .find({
        employeeId: new Types.ObjectId(
          (employee._id as Types.ObjectId).toString(),
        ),
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

    // Snapshot olish (agar mavjud bo'lsa)
    let snapshotData: { image: string; imageUrl: string } | null = null;
    try {
      const snapshot = await this.snapshotService.getCurrentSnapshot(109); // Default channel 109
      if (snapshot.success) {
        snapshotData = {
          image: snapshot.data.filename,
          imageUrl: snapshot.data.full_url,
        };
        this.logger.log(`Snapshot olingan: ${snapshot.data.filename}`);
      }
    } catch (snapshotError) {
      this.logger.warn(`Snapshot olishda xatolik: ${snapshotError.message}`);
      // Snapshot olishda xatolik bo'lsa ham attendance yaratamiz
    }

    // Yangi attendance yaratish
    const attendance = new this.attendanceModel({
      employeeId: new Types.ObjectId(
        (employee._id as Types.ObjectId).toString(),
      ),
      timestamp: new Date(),
      type,
      status,
      location: attendanceLocationData,
      device,
      notes,
      ...(snapshotData
        ? {
            image: snapshotData.image,
            imageUrl: snapshotData.imageUrl,
          }
        : {}),
    });

    const savedAttendance = await attendance.save();

    this.logger.log(
      `Xodim ${employee.fullName} barmoq orqali ${type === AttendanceType.IN ? 'kirdi' : 'chiqdi'} - ${status} status bilan`,
    );

    return {
      id: savedAttendance._id,
      employeeId: savedAttendance.employeeId,
      employeeName: employee.fullName,
      timestamp: savedAttendance.timestamp,
      type: savedAttendance.type,
      status: savedAttendance.status,
      location: attendanceLocationData,
      device: savedAttendance.device,
      notes: savedAttendance.notes,
      hasWarning: savedAttendance.hasWarning,
      fingerNumber: fingerNumber,
      ...(snapshotData
        ? {
            image: snapshotData.image,
            imageUrl: snapshotData.imageUrl,
          }
        : {}),
    };
  }

  // ==================== ATTENDANCE RECORDS ====================

  async getTodayAttendance(employeeId: string): Promise<TodayAttendanceDto> {
    const employee = await this.employeeModel.findById(employeeId);
    if (!employee) {
      throw new NotFoundException('Xodim topilmadi');
    }

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

    const checkIns = todayAttendances.filter(
      (a) => a.type === AttendanceType.IN,
    );
    const checkOuts = todayAttendances.filter(
      (a) => a.type === AttendanceType.OUT,
    );

    let status: ScheduleAttendanceStatus = ScheduleAttendanceStatus.ABSENT;
    let checkInTime: string | undefined;
    let checkOutTime: string | undefined;
    let totalHours: number | undefined;
    let totalWorkHours: number | undefined;

    if (checkIns.length > 0) {
      checkInTime = checkIns[0].timestamp.toTimeString().substring(0, 5);

      if (checkOuts.length > 0) {
        checkOutTime = checkOuts[0].timestamp.toTimeString().substring(0, 5);

        // Ish vaqtini hisoblash
        const checkInDate = checkIns[0].timestamp;
        const checkOutDate = checkOuts[0].timestamp;
        const diffMs = checkOutDate.getTime() - checkInDate.getTime();
        totalHours = diffMs / (1000 * 60 * 60);

        // Tushlik vaqtini hisobga olish (1 soat)
        totalWorkHours = Math.max(0, totalHours - 1);

        status = ScheduleAttendanceStatus.PRESENT;
      } else {
        status = ScheduleAttendanceStatus.HALF_DAY;
      }

      // Kechikish tekshirish
      const workStartTime = new Date(today);
      workStartTime.setHours(8, 0, 0, 0);
      if (checkIns[0].timestamp > workStartTime) {
        status = ScheduleAttendanceStatus.LATE;
      }
    }

    return {
      id: employeeId,
      employeeId,
      date: today.toISOString().split('T')[0],
      checkInTime,
      checkOutTime,
      status,
      totalHours,
      totalWorkHours,
      isCheckedIn: checkIns.length > 0,
      isCheckedOut: checkOuts.length > 0,
      checkIns: checkIns.length,
      checkOuts: checkOuts.length,
      // 🆕 Rasm fieldlari qo'shildi
      // The following fields are commented out because they are not part of TodayAttendanceDto
      // checkInImage: checkIns.length > 0 ? checkIns[0].image : undefined,
      // checkInImageUrl: checkIns.length > 0 ? checkIns[0].imageUrl : undefined,
      // checkOutImage: checkOuts.length > 0 ? checkOuts[0].image : undefined,
      // checkOutImageUrl:
      //   checkOuts.length > 0 ? checkOuts[0].imageUrl : undefined,
    };
  }

  async getEmployeeAttendance(
    employeeId: string,
    filter?: AttendanceFilterDto,
  ) {
    const employee = await this.employeeModel.findById(employeeId);
    if (!employee) {
      throw new NotFoundException('Xodim topilmadi');
    }

    const query: any = {
      employeeId: new Types.ObjectId(employeeId),
      isDeleted: false,
    };

    if (filter?.startDate) {
      query.timestamp = {
        ...query.timestamp,
        $gte: new Date(filter.startDate),
      };
    }

    if (filter?.endDate) {
      query.timestamp = { ...query.timestamp, $lte: new Date(filter.endDate) };
    }

    if (filter?.status) {
      query.status = filter.status;
    }

    const attendances = await this.attendanceModel
      .find(query)
      .sort({ timestamp: -1 })
      .limit(filter?.limit || 50);

    return {
      employeeId,
      name: employee.fullName,
      department: employee.department,
      position: employee.position,
      attendance: attendances.map((att) => ({
        id: (att._id as any).toString(),
        date: att.timestamp.toISOString().split('T')[0],
        checkInTime:
          att.type === AttendanceType.IN
            ? att.timestamp.toTimeString().substring(0, 5)
            : undefined,
        checkOutTime:
          att.type === AttendanceType.OUT
            ? att.timestamp.toTimeString().substring(0, 5)
            : undefined,
        status: att.status,
        type: att.type,
        timestamp: att.timestamp.toISOString(),
        location: att.location,
        device: att.device,
        notes: att.notes,
        hasWarning: att.hasWarning,
        warningReason: att.warningReason,
        warningTimestamp: att.warningTimestamp?.toISOString(),
        createdAt: (att as any).createdAt.toISOString(),
        updatedAt: (att as any).updatedAt.toISOString(),
        // 🆕 Rasm fieldlari qo'shildi
        image: att.image,
        imageUrl: att.imageUrl,
      })),
    };
  }

  // ==================== SCHEDULE VIEWS ====================

  async getDailySchedule(
    date: string,
    locationName?: string,
  ): Promise<DailyScheduleDto> {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Barcha xodimlarni olish
    const employees = await this.employeeModel.find({
      status: 'active',
      isDeleted: false,
    });

    const result = {
      date: date,
      employees: [] as any[],
    };

    for (const employee of employees) {
      const attendanceFilter: any = {
        employeeId: employee._id,
        timestamp: { $gte: targetDate, $lt: nextDay },
        isDeleted: false,
      };

      // Location filter qo'shish
      if (locationName) {
        const location =
          await this.locationService.getLocationByName(locationName);
        attendanceFilter['location.address'] = location.address;
      }

      const attendances = await this.attendanceModel
        .find(attendanceFilter)
        .sort({ timestamp: 1 });

      const logs = attendances.map((att) => ({
        type: att.type,
        hour: att.timestamp.getHours(),
        minute: att.timestamp.getMinutes(),
        time: att.timestamp.toTimeString().substring(0, 5), // HH:MM formatida
        timestamp: att.timestamp.toISOString(),
        location: att.location, // GPS koordinatalari
        // 🆕 Rasm fieldlari qo'shildi
        image: att.image,
        imageUrl: att.imageUrl,
      }));

      result.employees.push({
        employeeId: (employee._id as any).toString(),
        name: employee.fullName,
        logs,
      });
    }

    return result;
  }

  async getMonthlySchedule(
    year: number,
    month: number,
    locationName?: string,
  ): Promise<MonthlyScheduleDto> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const dailyData: AttendanceSummaryDto[] = [];

    for (let day = 1; day <= endDate.getDate(); day++) {
      const currentDate = new Date(year, month - 1, day);
      const dateStr = currentDate.toISOString().split('T')[0];

      const summary = await this.getAttendanceSummary(dateStr, locationName);
      dailyData.push(summary);
    }

    return {
      year,
      month,
      dailyData,
    };
  }

  async getYearlySchedule(
    year: number,
    locationName?: string,
  ): Promise<YearlyScheduleDto> {
    const monthlyData: any[] = [];

    for (let month = 1; month <= 12; month++) {
      const monthSummary = await this.getMonthlyAttendanceSummary(
        year,
        month,
        locationName,
      );
      monthlyData.push({
        month,
        monthName: this.getMonthName(month),
        ...monthSummary,
      });
    }

    return {
      year,
      monthlyData,
    };
  }

  // ==================== DASHBOARD & STATISTICS ====================

  async getDashboardStats(): Promise<DashboardStatsDto> {
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

  async getAttendanceSummary(
    date: string,
    locationName?: string,
  ): Promise<AttendanceSummaryDto> {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const totalEmployees = await this.employeeModel.countDocuments({
      status: 'active',
      isDeleted: false,
    });

    const attendanceFilter: any = {
      timestamp: { $gte: targetDate, $lt: nextDay },
      type: AttendanceType.IN,
      isDeleted: false,
    };

    // Location filter qo'shish
    if (locationName) {
      const location =
        await this.locationService.getLocationByName(locationName);
      attendanceFilter['location.address'] = location.address;
    }

    const attendances = await this.attendanceModel.find(attendanceFilter);

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

  // ==================== HELPER METHODS ====================

  private async getMonthlyAttendanceSummary(
    year: number,
    month: number,
    locationName?: string,
  ) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const totalEmployees = await this.employeeModel.countDocuments({
      status: 'active',
      isDeleted: false,
    });

    const attendanceFilter: any = {
      timestamp: { $gte: startDate, $lte: endDate },
      type: AttendanceType.IN,
      isDeleted: false,
    };

    // Location filter qo'shish
    if (locationName) {
      const location =
        await this.locationService.getLocationByName(locationName);
      attendanceFilter['location.address'] = location.address;
    }

    const attendances = await this.attendanceModel.find(attendanceFilter);

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
      totalEmployees,
      present,
      late,
      absent,
      attendanceRate,
    };
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

  // ==================== EXPORT FUNCTIONALITY ====================

  async exportAttendanceToExcel(filter?: AttendanceFilterDto) {
    // Bu metod Excel export uchun ma'lumotlarni tayyorlaydi
    // Haqiqiy Excel fayl yaratish uchun xlsx kutubxonasi kerak bo'ladi
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
      // 🆕 Rasm fieldlari qo'shildi
      Rasm: att.image || "Noma'lum",
      'Rasm URL': att.imageUrl || "Noma'lum",
    }));
  }

  async exportAttendanceToPDF(filter?: AttendanceFilterDto) {
    // Bu metod PDF export uchun ma'lumotlarni tayyorlaydi
    // Haqiqiy PDF fayl yaratish uchun puppeteer yoki boshqa kutubxona kerak bo'ladi
    return this.exportAttendanceToExcel(filter);
  }
}
