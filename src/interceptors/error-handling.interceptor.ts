import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AppLoggerService } from '../logger/logger.service';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId: string;
    duration?: number;
  };
}

@Injectable()
export class ErrorHandlingInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  private readonly logger = new Logger(ErrorHandlingInterceptor.name);

  constructor(private readonly appLogger: AppLoggerService) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const startTime = Date.now();

    const requestId = this.generateRequestId();
    request.requestId = requestId;

    return next.handle().pipe(
      map((data) => {
        const duration = Date.now() - startTime;

        // Log successful requests
        this.appLogger.logApiRequest(
          request.method,
          request.url,
          response.statusCode,
          duration,
          request.get('User-Agent'),
        );

        return {
          success: true,
          data,
          meta: {
            timestamp: new Date().toISOString(),
            requestId,
            duration,
          },
        };
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;

        // Log error
        this.logger.error(
          `Request failed: ${request.method} ${request.url}`,
          error.stack,
          'ErrorHandlingInterceptor',
        );

        // Log security events
        if (this.isSecurityError(error)) {
          this.appLogger.logSecurityEvent('API_ERROR', {
            method: request.method,
            url: request.url,
            error: error.message,
            userAgent: request.get('User-Agent'),
            ip: request.ip,
          });
        }

        // Transform error to API response
        const apiError = this.transformError(error);

        return throwError(
          () =>
            new HttpException(
              {
                success: false,
                error: apiError,
                meta: {
                  timestamp: new Date().toISOString(),
                  requestId,
                  duration,
                },
              },
              apiError.statusCode,
            ),
        );
      }),
    );
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private isSecurityError(error: any): boolean {
    const securityStatusCodes = [401, 403, 429];
    return (
      securityStatusCodes.includes(error.status) ||
      error.message?.toLowerCase().includes('unauthorized') ||
      error.message?.toLowerCase().includes('forbidden')
    );
  }

  private transformError(error: any) {
    // Handle validation errors
    if (error.status === HttpStatus.BAD_REQUEST && error.response?.message) {
      return {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: Array.isArray(error.response.message)
          ? error.response.message
          : [error.response.message],
        statusCode: HttpStatus.BAD_REQUEST,
      };
    }

    // Handle HTTP exceptions
    if (error instanceof HttpException) {
      return {
        message: error.message || 'An error occurred',
        code: this.getErrorCode(error.getStatus()),
        statusCode: error.getStatus(),
      };
    }

    // Handle database errors
    if (error.name === 'ValidationError') {
      return {
        message: 'Database validation error',
        code: 'DATABASE_VALIDATION_ERROR',
        details: error.message,
        statusCode: HttpStatus.BAD_REQUEST,
      };
    }

    if (error.name === 'CastError') {
      return {
        message: 'Invalid data format',
        code: 'INVALID_DATA_FORMAT',
        details: error.message,
        statusCode: HttpStatus.BAD_REQUEST,
      };
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return {
        message: 'Duplicate entry found',
        code: 'DUPLICATE_ENTRY',
        details: error.message,
        statusCode: HttpStatus.CONFLICT,
      };
    }

    // Default error
    return {
      message: error.message || 'Internal server error',
      code: 'INTERNAL_SERVER_ERROR',
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    };
  }

  private getErrorCode(statusCode: number): string {
    const errorCodes = {
      [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
      [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
      [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
      [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
      [HttpStatus.CONFLICT]: 'CONFLICT',
      [HttpStatus.UNPROCESSABLE_ENTITY]: 'UNPROCESSABLE_ENTITY',
      [HttpStatus.TOO_MANY_REQUESTS]: 'TOO_MANY_REQUESTS',
      [HttpStatus.INTERNAL_SERVER_ERROR]: 'INTERNAL_SERVER_ERROR',
    };

    return errorCodes[statusCode] || 'UNKNOWN_ERROR';
  }
}
