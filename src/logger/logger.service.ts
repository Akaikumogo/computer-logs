import { Injectable, LoggerService, LogLevel } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

@Injectable()
export class AppLoggerService implements LoggerService {
  private logger: winston.Logger;

  constructor(private configService: ConfigService) {
    this.logger = this.createLogger();
  }

  private createLogger(): winston.Logger {
    const logLevel = this.configService.get('LOG_LEVEL', 'info');
    const logDir = this.configService.get('LOG_DIR', './logs');

    return winston.createLogger({
      level: logLevel,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
        winston.format.printf(
          ({ timestamp, level, message, context, ...meta }) => {
            return JSON.stringify({
              timestamp,
              level,
              message,
              context,
              ...meta,
            });
          },
        ),
      ),
      transports: [
        // Console transport
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
          ),
        }),

        // File transport for all logs
        new winston.transports.DailyRotateFile({
          filename: `${logDir}/application-%DATE%.log`,
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
          zippedArchive: true,
        }),

        // Error file transport
        new winston.transports.DailyRotateFile({
          filename: `${logDir}/error-%DATE%.log`,
          datePattern: 'YYYY-MM-DD',
          level: 'error',
          maxSize: '20m',
          maxFiles: '30d',
          zippedArchive: true,
        }),

        // Security events file
        new winston.transports.DailyRotateFile({
          filename: `${logDir}/security-%DATE%.log`,
          datePattern: 'YYYY-MM-DD',
          level: 'warn',
          maxSize: '20m',
          maxFiles: '90d',
          zippedArchive: true,
        }),
      ],
    });
  }

  log(message: string, context?: string, meta?: any) {
    this.logger.info(message, { context, ...meta });
  }

  error(message: string, trace?: string, context?: string, meta?: any) {
    this.logger.error(message, { trace, context, ...meta });
  }

  warn(message: string, context?: string, meta?: any) {
    this.logger.warn(message, { context, ...meta });
  }

  debug(message: string, context?: string, meta?: any) {
    this.logger.debug(message, { context, ...meta });
  }

  verbose(message: string, context?: string, meta?: any) {
    this.logger.verbose(message, { context, ...meta });
  }

  // Custom logging methods
  logSecurityEvent(event: string, details: any, context?: string) {
    this.logger.warn(`SECURITY: ${event}`, {
      context: context || 'Security',
      event,
      details,
      timestamp: new Date().toISOString(),
    });
  }

  logPerformance(
    operation: string,
    duration: number,
    context?: string,
    meta?: any,
  ) {
    this.logger.info(`PERFORMANCE: ${operation}`, {
      context: context || 'Performance',
      operation,
      duration,
      ...meta,
    });
  }

  logUserActivity(
    userId: string,
    action: string,
    details?: any,
    context?: string,
  ) {
    this.logger.info(`USER_ACTIVITY: ${action}`, {
      context: context || 'UserActivity',
      userId,
      action,
      details,
      timestamp: new Date().toISOString(),
    });
  }

  logDatabaseQuery(query: string, duration: number, context?: string) {
    this.logger.debug(`DB_QUERY: ${query}`, {
      context: context || 'Database',
      query,
      duration,
    });
  }

  logApiRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    userAgent?: string,
  ) {
    this.logger.info(`API_REQUEST: ${method} ${url}`, {
      context: 'API',
      method,
      url,
      statusCode,
      duration,
      userAgent,
    });
  }
}
