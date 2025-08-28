/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { WorkplacesService } from './workplaces.service';
import { Types } from 'mongoose';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

class CreateWorkplaceDto {
  name: string;
  code?: string;
  type?: 'department' | 'branch' | 'office' | 'team';
  address?: string;
  status?: 'active' | 'inactive';
  parentId?: string;
}

class UpdateWorkplaceDto {
  name?: string;
  code?: string;
  type?: 'department' | 'branch' | 'office' | 'team';
  address?: string;
  status?: 'active' | 'inactive';
  parentId?: string;
}

@ApiTags('Workplaces')
@Controller('workplaces')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WorkplacesController {
  constructor(private readonly workplacesService: WorkplacesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiOperation({
    summary: 'Create workplace',
    description: 'Faqat ADMIN va HR xodimlar workplace yarata oladi',
  })
  @ApiBody({ type: CreateWorkplaceDto })
  @ApiResponse({ status: 201, description: 'Workplace yaratildi' })
  @ApiResponse({ status: 403, description: "Ruxsat yo'q - faqat ADMIN va HR" })
  create(@Body() dto: CreateWorkplaceDto, @CurrentUser() user: any) {
    const payload: any = { ...dto };
    if (dto.parentId) payload.parentId = new Types.ObjectId(dto.parentId);
    return this.workplacesService.create(payload);
  }

  @Get()
  @ApiOperation({ summary: 'List workplaces (search + pagination)' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'inactive'] })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['department', 'branch', 'office', 'team'],
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: 'active' | 'inactive',
    @Query('type') type?: 'department' | 'branch' | 'office' | 'team',
  ) {
    const p = page ? parseInt(page, 10) : 1;
    const l = limit ? parseInt(limit, 10) : 20;
    return this.workplacesService.getAll(p, l, search, status, type);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get workplace by ID' })
  getOne(@Param('id') id: string) {
    return this.workplacesService.getById(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiOperation({
    summary: 'Update workplace by ID',
    description: "Faqat ADMIN va HR xodimlar workplace o'zgartira oladi",
  })
  @ApiBody({ type: UpdateWorkplaceDto })
  @ApiResponse({ status: 200, description: 'Workplace yangilandi' })
  @ApiResponse({ status: 403, description: "Ruxsat yo'q - faqat ADMIN va HR" })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateWorkplaceDto,
    @CurrentUser() user: any,
  ) {
    const payload: any = { ...dto };
    if (dto.parentId) payload.parentId = new Types.ObjectId(dto.parentId);
    return this.workplacesService.update(id, payload);
  }
}
