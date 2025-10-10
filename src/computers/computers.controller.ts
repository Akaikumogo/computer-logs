/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable quotes */
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ComputersService } from './computers.service';

import { GetLogsQueryDto } from '../dto/get-logs-query.dto';
import {
  ApiTags,
  ApiQuery,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AssignEmployeeDto } from './dto/assign-employee.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Computers')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ComputersController {
  constructor(private readonly computersService: ComputersService) {}
  /* -------------------- COMPUTER LAR -------------------- */
  @Get('computers')
  @ApiOperation({ summary: 'Barcha computer (device) ro‘yxati' })
  getComputers() {
    return this.computersService.getComputers();
  }

  @Patch('computers/:device/employee')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiOperation({
    summary: 'Kompyuterga xodimni biriktirish yoki ajratish',
    description: 'Faqat ADMIN va HR xodimlar xodimlarni biriktira oladi',
  })
  @ApiBody({ type: AssignEmployeeDto })
  @ApiResponse({ status: 200, description: 'Biriktirildi yoki ajratildi' })
  @ApiResponse({ status: 403, description: "Ruxsat yo'q - faqat ADMIN va HR" })
  @ApiResponse({ status: 404, description: 'Device yoki Employee topilmadi' })
  assignEmployee(
    @Param('device') device: string,
    @Body() body: AssignEmployeeDto,
    @CurrentUser() user: any,
  ) {
    return this.computersService.assignEmployee(device, body);
  }

  /* -------------------- LOG LAR -------------------- */
  @Get('computers/:device/logs')
  @ApiOperation({ summary: 'Device bo‘yicha loglar, filter & pagination' })
  @ApiQuery({ name: 'application', required: false, type: String })
  @ApiQuery({ name: 'action', required: false, type: String })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['time', 'device', 'application', 'action'],
  })
  @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc'] })
  getLogs(@Param('device') device: string, @Query() query: GetLogsQueryDto) {
    return this.computersService.getLogs(device, query);
  }
  /* -------------------- ILOVALAR -------------------- (optional) */
  @Get('applications')
  @ApiOperation({
    summary: 'Barcha ilovalar (applications) ro‘yxati, pagination',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getApplications(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = page ? parseInt(page, 10) : 1;
    const l = limit ? parseInt(limit, 10) : 20;
    return this.computersService.getApplications(p, l);
  }
  @Get('applications/:name')
  @ApiOperation({
    summary: 'Get application by name',
    description: 'Get specific application details by name',
  })
  getApplicationByName(@Param('name') name: string) {
    return this.computersService.getApplicationByName(name);
  }

  @Patch('applications/:id')
  @ApiOperation({
    summary: 'Update application by ID',
    description: 'Update application tag and description',
  })
  @ApiParam({ name: 'id', description: 'Application MongoDB ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        tag: { type: 'string', enum: ['game', 'social', 'office', 'windows'] },
        description: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Application updated successfully' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  updateApplication(
    @Param('id') id: string,
    @Body() updateData: { tag?: string; description?: string },
  ) {
    return this.computersService.updateApplication(id, updateData);
  }
}
