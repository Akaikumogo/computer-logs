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
import { Fingerprint } from '../schemas/fingerprint.schema';
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
import * as XLSX from 'xlsx';

@Injectable()
export class ScheduleService {
  private readonly logger = new Logger(ScheduleService.name);

  constructor(
    @InjectModel(Attendance.name) private attendanceModel: Model<Attendance>,
    @InjectModel(Employee.name) private employeeModel: Model<Employee>,
    @InjectModel(Fingerprint.name) private fingerprintModel: Model<Fingerprint>,
    private locationService: LocationService,
    private snapshotService: SnapshotService,
  ) {}

  // ==================== CHECK IN/OUT OPERATIONS ====================

  async checkIn(checkInDto: CheckInDto) {
    const { employeeId, location, locationName, device, notes } = checkInDto;

    // Validate location name
    const locationData = await this.locationService.getLocationByName(
      locationName || 'default',
    );

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
    const { employeeId, location, locationName, device, notes } = checkOutDto;

    // Validate location name
    const locationData = await this.locationService.getLocationByName(
      locationName || 'default',
    );

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

    // Location ni topish
    const locationData = await this.locationService.getLocationByName(location);
    if (!locationData) {
      throw new NotFoundException('Location topilmadi');
    }

    // Barmoq raqami va location orqali xodimni topish
    const employee = await this.employeeModel.findOne({
      fingerNumber,
      primaryLocationId: locationData.id,
    });
    if (!employee) {
      throw new NotFoundException(
        'Barmoq raqami topilmadi yoki bu location ga biriktirilmagan',
      );
    }

    // Oxirgi davomat yozuvini tekshirish
    const lastAttendance = await this.attendanceModel
      .findOne({ employeeId: employee._id })
      .sort({ timestamp: -1 });

    const isLastCheckIn = lastAttendance?.type === AttendanceType.IN;

    if (isLastCheckIn) {
      // Oxirgi yozuv IN bo'lsa, hozir OUT qilamiz
      return this.checkOut({
        employeeId: (employee._id as Types.ObjectId).toString(),
        type: AttendanceType.OUT,
        locationName: location,
        device,
        notes,
      });
    } else {
      // Aks holda IN qilamiz
      return this.checkIn({
        employeeId: (employee._id as Types.ObjectId).toString(),
        type: AttendanceType.IN,
        locationName: location,
        device,
        notes,
      });
    }
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

  // ==================== NEW: DAILY/MONTHLY/YEARLY EXCEL EXPORTS ====================

  async exportDailyExcel(date: string): Promise<Buffer> {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const attendances = await this.attendanceModel
      .find({ timestamp: { $gte: targetDate, $lt: nextDay }, isDeleted: false })
      .populate('employeeId')
      .sort({ timestamp: 1 })
      .lean();

    // Group by employee
    const employeeIdToRows: Record<string, any[]> = {};
    const employeeIdToNames: Record<string, string> = {};

    for (const att of attendances) {
      const empId =
        (att.employeeId as any)._id?.toString() ||
        (att.employeeId as any).toString();
      const fullName = (att.employeeId as any).fullName || '';
      employeeIdToNames[empId] = fullName;
      if (!employeeIdToRows[empId]) employeeIdToRows[empId] = [];
      employeeIdToRows[empId].push(att);
    }

    // Build rows with Cyrillic headers
    const rows: any[] = [];
    for (const empId of Object.keys(employeeIdToRows)) {
      const logs = employeeIdToRows[empId];
      const firstIn = logs.find((l) => l.type === 'IN');
      const lastOut = [...logs].reverse().find((l) => l.type === 'OUT');
      const hasWarning = !!firstIn && !lastOut;

      for (const log of logs) {
        rows.push({
          ФИО: employeeIdToNames[empId],
          Дата: new Date(log.timestamp).toISOString().split('T')[0],
          Время: new Date(log.timestamp).toTimeString().substring(0, 5),
          Тип: log.type === 'IN' ? 'Вход' : 'Выход',
          Статус: log.status,
          Локация: log.location?.address || 'Неизвестно',
          Устройство: log.device || 'Неизвестно',
          Примечание: log.notes || '',
          Предупреждение: hasWarning ? 'Да' : 'Нет',
        });
      }
    }

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'День');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer as Buffer;
  }

  async exportMonthlyExcel(year: number, month: number): Promise<Buffer> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // Load active employees once
    const employees = await this.employeeModel
      .find({ status: 'active', isDeleted: false })
      .lean();

    const rows: any[] = [];

    for (const employee of employees) {
      for (let day = 1; day <= endDate.getDate(); day++) {
        const d0 = new Date(year, month - 1, day);
        const d1 = new Date(year, month - 1, day);
        d0.setHours(0, 0, 0, 0);
        d1.setHours(23, 59, 59, 999);

        const dayLogs = await this.attendanceModel
          .find({
            employeeId: employee._id,
            timestamp: { $gte: d0, $lte: d1 },
            isDeleted: false,
          })
          .sort({ timestamp: 1 })
          .lean();

        if (dayLogs.length === 0) {
          rows.push({
            ФИО: employee.fullName,
            Дата: d0.toISOString().split('T')[0],
            'Первый вход': '',
            'Последний выход': '',
            Предупреждение: '',
          });
          continue;
        }

        const firstIn = dayLogs.find((l) => l.type === 'IN');
        const lastOut = [...dayLogs].reverse().find((l) => l.type === 'OUT');
        const warning = firstIn && !lastOut ? 'Да' : '';

        rows.push({
          ФИО: employee.fullName,
          Дата: d0.toISOString().split('T')[0],
          'Первый вход': firstIn
            ? new Date(firstIn.timestamp).toTimeString().substring(0, 5)
            : '',
          'Последний выход': lastOut
            ? new Date(lastOut.timestamp).toTimeString().substring(0, 5)
            : '',
          Предупреждение: warning,
        });
      }
    }

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Месяц');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer as Buffer;
  }

  async exportYearlyExcel(year: number): Promise<Buffer> {
    const rows: any[] = [];

    for (let month = 1; month <= 12; month++) {
      const summary = await this.getMonthlyAttendanceSummary(year, month);
      rows.push({
        Год: year,
        Месяц: this.getMonthName(month),
        'Всего сотрудников': summary.totalEmployees,
        Пришли: summary.present,
        Опоздали: summary.late,
        Отсутствовали: summary.absent,
        'Процент посещаемости': summary.attendanceRate,
      });
    }

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Год');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer as Buffer;
  }

  // Yetishmayotgan method lar
  async fingerCheckInOut(fingerAttendanceDto: FingerAttendanceDto) {
    const { fingerNumber, location, device, notes } = fingerAttendanceDto;

    // Location ni topish
    const locationData = await this.locationService.getLocationByName(location);
    if (!locationData) {
      throw new NotFoundException('Location topilmadi');
    }

    // Barmoq raqami va location orqali xodimni topish
    const employee = await this.employeeModel.findOne({
      fingerNumber,
      primaryLocationId: locationData.id,
    });
    if (!employee) {
      throw new NotFoundException(
        'Barmoq raqami topilmadi yoki bu location ga biriktirilmagan',
      );
    }

    // Bugungi kundagi oxirgi davomat yozuvini tekshirish
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const lastTodayAttendance = await this.attendanceModel
      .findOne({
        employeeId: employee._id,
        timestamp: {
          $gte: today,
          $lt: tomorrow,
        },
      })
      .sort({ timestamp: -1 });

    if (lastTodayAttendance) {
      // Bugun allaqachon davomat qayd qilingan
      if (lastTodayAttendance.type === AttendanceType.IN) {
        // Oxirgi davomat IN bo'lsa, hozir OUT qilamiz
        return this.fingerCheckOut({
          employeeId: (employee._id as Types.ObjectId).toString(),
          locationName: location,
          device,
          notes,
        });
      } else {
        // Oxirgi davomat OUT bo'lsa, hozir IN qilamiz
        return this.fingerCheckIn({
          employeeId: (employee._id as Types.ObjectId).toString(),
          locationName: location,
          device,
          notes,
        });
      }
    } else {
      // Bugun hali davomat qayd qilinmagan, kirish qilamiz
      return this.fingerCheckIn({
        employeeId: (employee._id as Types.ObjectId).toString(),
        locationName: location,
        device,
        notes,
      });
    }
  }

  // Fingerprint uchun maxsus checkIn metodi (bugungi kundagi tekshiruvsiz)
  private async fingerCheckIn(data: {
    employeeId: string;
    locationName: string;
    device?: string;
    notes?: string;
  }) {
    const { employeeId, locationName, device, notes } = data;

    // Validate location name
    const locationData = await this.locationService.getLocationByName(
      locationName || 'default',
    );

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

    // Status aniqlash (8:00 dan keyin = late)
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
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
      id: savedAttendance._id?.toString(),
      employeeId: savedAttendance.employeeId?.toString(),
      employeeName: employee.fullName,
      timestamp: savedAttendance.timestamp,
      type: savedAttendance.type,
      status: savedAttendance.status,
      location: savedAttendance.location,
      device: savedAttendance.device,
      notes: savedAttendance.notes,
      hasWarning: status === AttendanceStatus.LATE,
    };
  }

  // Fingerprint uchun maxsus checkOut metodi (bugungi kundagi tekshiruvsiz)
  private async fingerCheckOut(data: {
    employeeId: string;
    locationName: string;
    device?: string;
    notes?: string;
  }) {
    const { employeeId, locationName, device, notes } = data;

    // Validate location name
    const locationData = await this.locationService.getLocationByName(
      locationName || 'default',
    );

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

    // Status aniqlash (17:00 dan oldin = early)
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const workEndTime = new Date(today);
    workEndTime.setHours(17, 0, 0, 0);

    let status = AttendanceStatus.NORMAL;
    if (now < workEndTime) {
      status = AttendanceStatus.EARLY;
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
    //secret
    return {
      id: (savedAttendance._id as Types.ObjectId).toString(),
      employeeId: (
        savedAttendance.employeeId as unknown as Types.ObjectId
      ).toString(),
      employeeName: employee.fullName,
      timestamp: savedAttendance.timestamp,
      type: savedAttendance.type,
      status: savedAttendance.status,
      location: savedAttendance.location,
      device: savedAttendance.device,
      notes: savedAttendance.notes,
      hasWarning: status === AttendanceStatus.EARLY,
    };
  }

  async updateAttendance(id: string, updateData: Partial<CheckInDto>) {
    const attendance = await this.attendanceModel.findById(id);
    if (!attendance) {
      throw new NotFoundException('Davomat topilmadi');
    }

    const updatedAttendance = await this.attendanceModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true },
    );

    return updatedAttendance;
  }

  async deleteAttendance(id: string) {
    const attendance = await this.attendanceModel.findById(id);
    if (!attendance) {
      throw new NotFoundException('Davomat topilmadi');
    }

    await this.attendanceModel.findByIdAndDelete(id);
    return { message: "Davomat o'chirildi" };
  }

  async getDashboardSummary(date?: string) {
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const summary = await this.attendanceModel.aggregate([
      {
        $match: {
          timestamp: { $gte: startOfDay, $lte: endOfDay },
        },
      },
      {
        $group: {
          _id: '$employeeId',
          totalLogs: { $sum: 1 },
          checkIns: {
            $sum: { $cond: [{ $eq: ['$type', 'IN'] }, 1, 0] },
          },
          checkOuts: {
            $sum: { $cond: [{ $eq: ['$type', 'OUT'] }, 1, 0] },
          },
        },
      },
    ]);

    return {
      date: targetDate.toISOString().split('T')[0],
      totalEmployees: summary.length,
      summary,
    };
  }

  async exportExcel(startDate?: string, endDate?: string) {
    const filter: AttendanceFilterDto = {};
    if (startDate) filter.startDate = startDate;
    if (endDate) filter.endDate = endDate;

    return this.exportAttendanceToExcel(filter);
  }

  async exportPdf(startDate?: string, endDate?: string) {
    const filter: AttendanceFilterDto = {};
    if (startDate) filter.startDate = startDate;
    if (endDate) filter.endDate = endDate;

    return this.exportAttendanceToPDF(filter);
  }
}
//secret2
