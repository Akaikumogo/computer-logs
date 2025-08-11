import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ComputersService } from './computers.service';
import { AddLogDto } from '../dto/add-logs.dto';
import { ApiTags, ApiQuery } from '@nestjs/swagger';

@ApiTags('Computers')
@Controller()
export class ComputersController {
  constructor(private readonly computersService: ComputersService) {}

  @Post('add-log')
  addLog(@Body() body: AddLogDto) {
    return this.computersService.addLog(body);
  }

  @Get('computers')
  getComputers() {
    return this.computersService.getComputers();
  }

  @Get('computers/:device/logs')
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  getLogs(
    @Param('device') device: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.computersService.getLogs(device, from, to);
  }
}
