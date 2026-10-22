import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnApplicationShutdown {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {
    this.initClient();
  }

  // Initializes Redis connection with graceful fallback
  private initClient(): void {
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = this.configService.get<number>('REDIS_PORT', 6379);
    const password = this.configService.get<string>('REDIS_PASSWORD');

    try {
      this.client = new Redis({
        host,
        port,
        password: password || undefined,
        lazyConnect: true,
        retryStrategy: (times) => {
          if (times > 3) {
            this.logger.warn(
              `Redis connection retry limit reached. Operating without cache.`,
            );
            return null;
          }
          return Math.min(times * 100, 2000);
        },
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        this.logger.log(`Redis connected to ${host}:${port}`);
      });

      this.client.on('error', (err: unknown) => {
        this.isConnected = false;
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(`Redis connection error: ${msg}`);
      });

      // Attempt non-blocking connection
      this.client.connect().catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `Redis initial connection failed: ${msg}. Cache features will operate in-memory/bypass.`,
        );
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Could not initialize Redis client: ${message}`);
    }
  }

  getClient(): Redis | null {
    return this.client;
  }

  // Get cached string value
  async get(key: string): Promise<string | null> {
    if (!this.client || !this.isConnected) return null;
    try {
      return await this.client.get(key);
    } catch {
      return null;
    }
  }

  // Set cached string with optional TTL seconds
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.client || !this.isConnected) return;
    try {
      if (ttlSeconds) {
        await this.client.set(key, value, 'EX', ttlSeconds);
      } else {
        await this.client.set(key, value);
      }
    } catch {
      // Non-critical cache failure
    }
  }

  // Delete key from cache
  async del(key: string): Promise<void> {
    if (!this.client || !this.isConnected) return;
    try {
      await this.client.del(key);
    } catch {
      // Non-critical cache failure
    }
  }

  // Generate Region-isolated Namespace Key
  getRegionalKey(region: string, key: string): string {
    const cleanRegion = (region || 'global').toLowerCase().trim();
    return `region:${cleanRegion}:${key}`;
  }

  // Get cached value within regional shard namespace
  async getRegional(region: string, key: string): Promise<string | null> {
    return this.get(this.getRegionalKey(region, key));
  }

  // Set cached value within regional shard namespace
  async setRegional(
    region: string,
    key: string,
    value: string,
    ttlSeconds?: number,
  ): Promise<void> {
    return this.set(this.getRegionalKey(region, key), value, ttlSeconds);
  }

  // Delete key from regional shard namespace
  async delRegional(region: string, key: string): Promise<void> {
    return this.del(this.getRegionalKey(region, key));
  }

  // Publish real-time events to distributed Redis channel
  async publish(channel: string, message: string): Promise<void> {
    if (!this.client || !this.isConnected) return;
    try {
      await this.client.publish(channel, message);
    } catch {
      // Non-critical broadcast failure
    }
  }

  isHealthy(): boolean {
    return this.isConnected;
  }

  async onApplicationShutdown(): Promise<void> {
    if (this.client) {
      await this.client.quit();
    }
  }
}
