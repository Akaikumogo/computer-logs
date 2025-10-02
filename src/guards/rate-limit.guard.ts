import {
  Injectable,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  ThrottlerGuard,
  ThrottlerStorageService,
  ThrottlerModuleOptions,
} from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

@Injectable()
export class CustomRateLimitGuard extends ThrottlerGuard {
  constructor(
    options: ThrottlerModuleOptions,
    storageService: ThrottlerStorageService,
    reflector: Reflector,
  ) {
    super(options, storageService, reflector);
  }

  protected async handleRequest(requestProps: any): Promise<boolean> {
    const { context, limit, ttl } = requestProps;
    const request = context.switchToHttp().getRequest() as Request;
    const key = this.generateKey(context, request.ip || 'unknown');

    try {
      const result = await this.storageService.increment(
        key,
        ttl,
        limit,
        0,
        'default',
      );

      if (result.totalHits > limit) {
        // Log suspicious activity
        console.warn(
          `Rate limit exceeded for IP: ${request.ip}, User-Agent: ${request.get('User-Agent')}`,
        );

        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: 'Too many requests, please try again later',
            retryAfter: Math.ceil(ttl / 1000),
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      return true;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      // If storage fails, allow request but log the error
      console.error('Rate limiting storage error:', error);
      return true;
    }
  }

  protected generateKey(context: ExecutionContext, ip: string): string {
    const request = context.switchToHttp().getRequest() as Request;
    const userAgent = request.get('User-Agent') || 'unknown';

    // Create a more specific key based on IP, user agent, and endpoint
    const endpoint = request.route?.path || request.url;
    return `rate_limit:${ip}:${Buffer.from(userAgent).toString('base64')}:${endpoint}`;
  }
}
