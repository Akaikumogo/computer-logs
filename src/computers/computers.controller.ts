import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Patch,
} from '@nestjs/common';
import { ComputersService } from './computers.service';
import { AddLogDto } from '../dto/add-logs.dto';
import { GetLogsQueryDto } from '../dto/get-logs-query.dto';
import {
  ApiTags,
  ApiQuery,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { AssignEmployeeDto } from './dto/assign-employee.dto';

@ApiTags('Computers')
@Controller()
export class ComputersController {
  constructor(private readonly computersService: ComputersService) {}

  /* -------------------- LOG QO‘SHISH -------------------- */
  @Post('add-log')
  @ApiOperation({
    summary: 'Log qo‘shish (device va application avtomatik yaratish)',
  })
  @ApiResponse({ status: 201, description: 'Log yaratildi' })
  addLog(@Body() body: AddLogDto) {
    return this.computersService.addLog(body);
  }

  /* -------------------- COMPUTER LAR -------------------- */
  @Get('computers')
  @ApiOperation({ summary: 'Barcha computer (device) ro‘yxati' })
  getComputers() {
    return this.computersService.getComputers();
  }

  @Patch('computers/:device/employee')
  @ApiOperation({ summary: 'Kompyuterga xodimni biriktirish yoki ajratish' })
  @ApiBody({ type: AssignEmployeeDto })
  @ApiResponse({ status: 200, description: 'Biriktirildi yoki ajratildi' })
  @ApiResponse({ status: 404, description: 'Device yoki Employee topilmadi' })
  assignEmployee(
    @Param('device') device: string,
    @Body() body: AssignEmployeeDto,
  ) {
    return this.computersService.assignEmployee(
      device,
      body.employeeId ?? null,
      body.deviceRealName ?? null,
    );
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
  @ApiOperation({ summary: 'Ilova nomi orqali bitta yozuvni olish' })
  getApplication(@Param('name') name: string) {
    return this.computersService.getApplicationByName(name);
  }
}
