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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBody } from '@nestjs/swagger';
import { WorkplacesService } from './workplaces.service';
import { Types } from 'mongoose';

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
export class WorkplacesController {
  constructor(private readonly workplacesService: WorkplacesService) {}

  @Post()
  @ApiOperation({ summary: 'Create workplace' })
  @ApiBody({ type: CreateWorkplaceDto })
  create(@Body() dto: CreateWorkplaceDto) {
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
  @ApiOperation({ summary: 'Update workplace by ID' })
  @ApiBody({ type: UpdateWorkplaceDto })
  update(@Param('id') id: string, @Body() dto: UpdateWorkplaceDto) {
    const payload: any = { ...dto };
    if (dto.parentId) payload.parentId = new Types.ObjectId(dto.parentId);
    return this.workplacesService.update(id, payload);
  }
}
