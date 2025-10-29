import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Location, LocationDocument } from '../schemas/location.schema';
import {
  CreateLocationDto,
  UpdateLocationDto,
  LocationResponseDto,
  LocationQueryDto,
} from '../dto/location.dto';

@Injectable()
export class LocationService {
  private readonly logger = new Logger(LocationService.name);

  constructor(
    @InjectModel(Location.name) private locationModel: Model<LocationDocument>,
  ) {}

  // ==================== CREATE ====================

  async create(
    createLocationDto: CreateLocationDto,
  ): Promise<LocationResponseDto> {
    // Check if location name already exists
    const existingLocation = await this.locationModel.findOne({
      name: createLocationDto.name,
      isDeleted: false,
    });

    if (existingLocation) {
      throw new ConflictException('Bu nomdagi location allaqachon mavjud');
    }

    const location = new this.locationModel({
      ...createLocationDto,
      radius: createLocationDto.radius || 100,
      isActive:
        createLocationDto.isActive !== undefined
          ? createLocationDto.isActive
          : true,
    });

    const savedLocation = await location.save();

    this.logger.log(`Yangi location yaratildi: ${savedLocation.name}`);

    return this.mapToResponseDto(savedLocation);
  }

  // ==================== READ ====================

  async findAll(query: LocationQueryDto): Promise<{
    locations: LocationResponseDto[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const { isActive, page = 1, limit = 20, search } = query;

    const filter: any = { isDeleted: false };

    if (isActive !== undefined) {
      filter.isActive = isActive;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [locations, total] = await Promise.all([
      this.locationModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.locationModel.countDocuments(filter),
    ]);

    return {
      locations: locations.map((location) => this.mapToResponseDto(location)),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findAllPublic(query: any): Promise<LocationResponseDto[]> {
    const filter: any = { isDeleted: false, isActive: true };

    const locations = await this.locationModel
      .find(filter)
      .sort({ name: 1 })
      .lean();

    return locations.map((location) => this.mapToResponseDto(location));
  }

  async findOne(id: string): Promise<LocationResponseDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException("Noto'g'ri location ID");
    }

    const location = await this.locationModel.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!location) {
      throw new NotFoundException('Location topilmadi');
    }

    return this.mapToResponseDto(location);
  }

  async findByName(name: string): Promise<LocationResponseDto | null> {
    const location = await this.locationModel.findOne({
      name,
      isActive: true,
      isDeleted: false,
    });

    return location ? this.mapToResponseDto(location) : null;
  }

  async findActiveLocations(): Promise<LocationResponseDto[]> {
    const locations = await this.locationModel
      .find({
        isActive: true,
        isDeleted: false,
      })
      .sort({ name: 1 })
      .lean();

    return locations.map((location) => this.mapToResponseDto(location));
  }

  async findDetail(id: string): Promise<any> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException("Noto'g'ri location ID");
    }

    const location = await this.locationModel.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!location) {
      throw new NotFoundException('Location topilmadi');
    }

    // Mock data for now - in real implementation, you would fetch from other services
    const mockDetail = {
      location: this.mapToResponseDto(location),
      employees: [
        {
          id: '1',
          fullName: 'Sarvarbek Xazratov',
          position: 'Senior Developer',
          department: 'IT Department',
          tabRaqami: '001',
          status: 'active',
          assignedAt: new Date().toISOString(),
        },
        {
          id: '2',
          fullName: 'Malika Toshmatova',
          position: 'Project Manager',
          department: 'Management',
          tabRaqami: '002',
          status: 'active',
          assignedAt: new Date().toISOString(),
        },
      ],
      todayAttendance: {
        totalEmployees: 2,
        checkedIn: 1,
        checkedOut: 0,
        absent: 1,
        late: 0,
        early: 0,
      },
      weeklyAttendance: [
        { date: '2024-01-15', checkedIn: 2, checkedOut: 2, absent: 0 },
        { date: '2024-01-16', checkedIn: 1, checkedOut: 1, absent: 1 },
        { date: '2024-01-17', checkedIn: 2, checkedOut: 1, absent: 0 },
        { date: '2024-01-18', checkedIn: 1, checkedOut: 2, absent: 0 },
        { date: '2024-01-19', checkedIn: 2, checkedOut: 2, absent: 0 },
        { date: '2024-01-20', checkedIn: 1, checkedOut: 1, absent: 1 },
        { date: '2024-01-21', checkedIn: 2, checkedOut: 1, absent: 0 },
      ],
    };

    return mockDetail;
  }

  // ==================== UPDATE ====================

  async update(
    id: string,
    updateLocationDto: UpdateLocationDto,
  ): Promise<LocationResponseDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException("Noto'g'ri location ID");
    }

    const location = await this.locationModel.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!location) {
      throw new NotFoundException('Location topilmadi');
    }

    // Check if new name conflicts with existing location
    if (updateLocationDto.name && updateLocationDto.name !== location.name) {
      const existingLocation = await this.locationModel.findOne({
        name: updateLocationDto.name,
        _id: { $ne: id },
        isDeleted: false,
      });

      if (existingLocation) {
        throw new ConflictException('Bu nomdagi location allaqachon mavjud');
      }
    }

    const updatedLocation = await this.locationModel.findByIdAndUpdate(
      id,
      { ...updateLocationDto, updatedAt: new Date() },
      { new: true },
    );

    if (!updatedLocation) {
      throw new NotFoundException('Location yangilashda xatolik yuz berdi');
    }

    this.logger.log(`Location yangilandi: ${updatedLocation.name}`);

    return this.mapToResponseDto(updatedLocation);
  }

  // ==================== DELETE ====================

  async remove(id: string): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException("Noto'g'ri location ID");
    }

    const location = await this.locationModel.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!location) {
      throw new NotFoundException('Location topilmadi');
    }

    // Soft delete
    await this.locationModel.findByIdAndUpdate(id, {
      isDeleted: true,
      deletedAt: new Date(),
      updatedAt: new Date(),
    });

    this.logger.log(`Location o'chirildi: ${location.name}`);

    return { message: "Location muvaffaqiyatli o'chirildi" };
  }

  // ==================== HELPER METHODS ====================

  private mapToResponseDto(location: any): LocationResponseDto {
    return {
      id: location._id.toString(),
      name: location.name,
      address: location.address,
      latitude: location.latitude,
      longitude: location.longitude,
      radius: location.radius,
      isActive: location.isActive,
      description: location.description,
      hasWifi: location.hasWifi,
      wifiName: location.wifiName,
      wifiPassword: location.wifiPassword,
      responsiblePerson: location.responsiblePerson,
      responsiblePersonPhone: location.responsiblePersonPhone,
      responsiblePersonEmail: location.responsiblePersonEmail,
      workingHours: location.workingHours,
      contactInfo: location.contactInfo,
      images: location.images,
      facilities: location.facilities,
      createdAt: location.createdAt,
      updatedAt: location.updatedAt,
    };
  }

  // ==================== VALIDATION METHODS ====================

  async validateLocationName(name: string): Promise<boolean> {
    const location = await this.locationModel.findOne({
      name,
      isActive: true,
      isDeleted: false,
    });

    return !!location;
  }

  async getLocationByName(name: string): Promise<LocationResponseDto> {
    const location = await this.findByName(name);

    if (!location) {
      throw new NotFoundException(
        `'${name}' nomli location topilmadi yoki faol emas`,
      );
    }

    return location;
  }
}
