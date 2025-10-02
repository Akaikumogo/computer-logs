import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly defaultTtl = 300; // 5 minutes

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private configService: ConfigService,
  ) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.cacheManager.get<T>(key);
      if (value) {
        this.logger.debug(`Cache hit for key: ${key}`);
      }
      return value || null;
    } catch (error) {
      this.logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const cacheTtl = ttl || this.defaultTtl;
      await this.cacheManager.set(key, value, cacheTtl * 1000);
      this.logger.debug(`Cache set for key: ${key}, TTL: ${cacheTtl}s`);
    } catch (error) {
      this.logger.error(`Cache set error for key ${key}:`, error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
      this.logger.debug(`Cache deleted for key: ${key}`);
    } catch (error) {
      this.logger.error(`Cache delete error for key ${key}:`, error);
    }
  }

  async reset(): Promise<void> {
    try {
      // Note: cache-manager v5 doesn't have reset method
      // We'll implement a custom reset by clearing all keys
      this.logger.debug('Cache reset - not implemented in cache-manager v5');
    } catch (error) {
      this.logger.error('Cache reset error:', error);
    }
  }

  // Cache key generators
  generateKey(prefix: string, ...parts: (string | number)[]): string {
    return `${prefix}:${parts.join(':')}`;
  }

  // Specific cache keys
  employeeKey(id: string): string {
    return this.generateKey('employee', id);
  }

  departmentKey(id: string): string {
    return this.generateKey('department', id);
  }

  statisticsKey(type: string, params: Record<string, any>): string {
    const paramString = Object.entries(params)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('&');
    return this.generateKey('statistics', type, paramString);
  }

  // Cache patterns
  async invalidatePattern(pattern: string): Promise<void> {
    try {
      // This would need to be implemented based on your cache store
      this.logger.debug(`Cache pattern invalidation: ${pattern}`);
    } catch (error) {
      this.logger.error(
        `Cache pattern invalidation error for ${pattern}:`,
        error,
      );
    }
  }
}
