import { Injectable, Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  namespace: '/realtime',
  cors: {
    origin: '*',
    credentials: true,
  },
})
@Injectable()
export class ScheduleGateway implements OnGatewayInit {
  private readonly logger = new Logger(ScheduleGateway.name);

  @WebSocketServer()
  server!: Server;

  afterInit() {
    this.logger.log('Realtime gateway initialized at namespace /realtime');
  }

  emitAttendanceChanged(payload: {
    employeeId: string;
    dateISO: string; // YYYY-MM-DD
    event: 'checkin' | 'checkout' | 'update' | 'delete';
  }) {
    try {
      this.server.emit('attendance.changed', payload);
    } catch (err) {
      this.logger.error('Failed to emit attendance.changed', err as Error);
    }
  }

  emitScheduleChanged(payload: {
    dateISO: string; // YYYY-MM-DD
    scope?: 'daily' | 'monthly' | 'yearly';
  }) {
    try {
      this.server.emit('schedule.changed', payload);
    } catch (err) {
      this.logger.error('Failed to emit schedule.changed', err as Error);
    }
  }

  emitDailyScheduleChanged(payload: { dateISO: string }) {
    try {
      this.server.emit('schedule.daily.changed', payload);
    } catch (err) {
      this.logger.error('Failed to emit schedule.daily.changed', err as Error);
    }
  }
}
