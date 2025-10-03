import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { CheckOutDto } from '../dto/schedule.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('Public Schedule Management')
@Controller('public/schedule')
export class PublicScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Post('attendance/checkout')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Xodimning chiqishini qayd qilish (Public)',
    description: 'Xodimning ishdan chiqishini qayd qiladi - autentifikatsiya talab qilinmaydi',
  })
  @ApiBody({ type: CheckOutDto })
  @ApiResponse({
    status: 201,
    description: 'Chiqish muvaffaqiyatli qayd qilindi',
  })
  @ApiResponse({ status: 404, description: 'Xodim topilmadi' })
  @ApiResponse({
    status: 400,
    description: 'Bugun kirish qayd qilinmagan',
  })
  async checkOut(@Body() checkOutDto: CheckOutDto) {
    return this.scheduleService.checkOut(checkOutDto);
  }
}
