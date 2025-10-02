import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { LocationService } from './location.service';
import {
  CreateLocationDto,
  UpdateLocationDto,
  LocationQueryDto,
} from '../dto/location.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';

@ApiTags('Location Management')
@Controller('locations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  // ==================== CREATE ====================

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiOperation({
    summary: 'Yangi location yaratish',
    description: 'Yangi location yaratish (ADMIN va HR uchun)',
  })
  @ApiBody({ type: CreateLocationDto })
  @ApiResponse({
    status: 201,
    description: 'Location muvaffaqiyatli yaratildi',
  })
  @ApiResponse({ status: 400, description: "Noto'g'ri ma'lumotlar" })
  @ApiResponse({
    status: 409,
    description: 'Bu nomdagi location allaqachon mavjud',
  })
  @ApiResponse({ status: 403, description: "Ruxsat yo'q - faqat ADMIN va HR" })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createLocationDto: CreateLocationDto) {
    return this.locationService.create(createLocationDto);
  }

  // ==================== READ ====================

  @Get()
  @ApiOperation({
    summary: "Locationlar ro'yxati",
    description: 'Barcha locationlarni olish (filter va pagination bilan)',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    description: 'Faol locationlar',
    type: Boolean,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Sahifa raqami',
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Sahifa hajmi',
    type: Number,
  })
  @ApiQuery({ name: 'search', required: false, description: 'Qidiruv matni' })
  @ApiResponse({ status: 200, description: "Locationlar ro'yxati" })
  async findAll(@Query() query: LocationQueryDto) {
    return this.locationService.findAll(query);
  }

  @Get('active')
  @ApiOperation({
    summary: 'Faol locationlar',
    description: 'Faqat faol locationlarni olish',
  })
  @ApiResponse({ status: 200, description: "Faol locationlar ro'yxati" })
  async findActiveLocations() {
    return this.locationService.findActiveLocations();
  }

  @Get(':id')
  @ApiOperation({
    summary: "Location ma'lumoti",
    description: "Belgilangan locationning to'liq ma'lumotini olish",
  })
  @ApiParam({ name: 'id', description: 'Location ID' })
  @ApiResponse({ status: 200, description: "Location ma'lumoti" })
  @ApiResponse({ status: 404, description: 'Location topilmadi' })
  async findOne(@Param('id') id: string) {
    return this.locationService.findOne(id);
  }

  @Get(':id/detail')
  @ApiOperation({
    summary: "Location to'liq ma'lumoti",
    description: 'Location, xodimlar va davomat statistikasi bilan',
  })
  @ApiParam({ name: 'id', description: 'Location ID' })
  @ApiResponse({ status: 200, description: "Location to'liq ma'lumoti" })
  @ApiResponse({ status: 404, description: 'Location topilmadi' })
  async findDetail(@Param('id') id: string) {
    return this.locationService.findDetail(id);
  }

  // ==================== UPDATE ====================

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiOperation({
    summary: 'Location yangilash',
    description: 'Mavjud locationni yangilash (ADMIN va HR uchun)',
  })
  @ApiParam({ name: 'id', description: 'Location ID' })
  @ApiBody({ type: UpdateLocationDto })
  @ApiResponse({
    status: 200,
    description: 'Location muvaffaqiyatli yangilandi',
  })
  @ApiResponse({ status: 404, description: 'Location topilmadi' })
  @ApiResponse({
    status: 409,
    description: 'Bu nomdagi location allaqachon mavjud',
  })
  @ApiResponse({ status: 403, description: "Ruxsat yo'q - faqat ADMIN va HR" })
  async update(
    @Param('id') id: string,
    @Body() updateLocationDto: UpdateLocationDto,
  ) {
    return this.locationService.update(id, updateLocationDto);
  }

  // ==================== DELETE ====================

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiOperation({
    summary: "Location o'chirish",
    description: 'Locationni soft delete qilish (ADMIN va HR uchun)',
  })
  @ApiParam({ name: 'id', description: 'Location ID' })
  @ApiResponse({
    status: 200,
    description: "Location muvaffaqiyatli o'chirildi",
  })
  @ApiResponse({ status: 404, description: 'Location topilmadi' })
  @ApiResponse({ status: 403, description: "Ruxsat yo'q - faqat ADMIN va HR" })
  async remove(@Param('id') id: string) {
    return this.locationService.remove(id);
  }

  // ==================== VALIDATION ====================

  @Get('validate/:name')
  @ApiOperation({
    summary: 'Location nomini tekshirish',
    description: 'Location nomi mavjud va faol ekanligini tekshirish',
  })
  @ApiParam({ name: 'name', description: 'Location nomi' })
  @ApiResponse({ status: 200, description: 'Location mavjud va faol' })
  @ApiResponse({
    status: 404,
    description: 'Location topilmadi yoki faol emas',
  })
  async validateLocationName(@Param('name') name: string) {
    const location = await this.locationService.getLocationByName(name);
    return {
      valid: true,
      location,
      message: 'Location mavjud va faol',
    };
  }
}
