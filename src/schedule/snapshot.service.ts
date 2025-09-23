/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface SnapshotResponse {
  success: boolean;
  message: string;
  source: string;
  data: {
    channel: number;
    time: string;
    filename: string;
    url: string;
    full_url: string;
    file_size: number;
  };
}

@Injectable()
export class SnapshotService {
  private readonly logger = new Logger(SnapshotService.name);
  private readonly snapshotApiUrl: string;

  constructor(private configService: ConfigService) {
    this.snapshotApiUrl =
      this.configService.get<string>('snapshot.apiUrl') ||
      'http://0.0.0.0:8000';
  }

  async getSnapshot(
    channel: number,
    time?: string,
    returnUrl: boolean = true,
  ): Promise<SnapshotResponse> {
    try {
      const params = new URLSearchParams({
        channel: '109'.toString(),
        return_url: returnUrl.toString(),
      });

      if (time) {
        params.append('time', time);
      }

      const response = await axios.get(
        `${this.snapshotApiUrl}/snapshot?${params.toString()}`,
        {
          timeout: 10000, // 10 second timeout
          headers: {
            Accept: 'application/json',
          },
        },
      );

      this.logger.log(
        `Snapshot olingan: channel ${channel}, time: ${time || 'current'}`,
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Snapshot olishda xatolik: ${error.message}`);
      throw new Error(`Snapshot olishda xatolik: ${error.message}`);
    }
  }

  async getCurrentSnapshot(channel: number): Promise<SnapshotResponse> {
    return this.getSnapshot(channel, undefined, true);
  }

  async getSnapshotAtTime(
    channel: number,
    time: string,
  ): Promise<SnapshotResponse> {
    return this.getSnapshot(channel, time, true);
  }
}
