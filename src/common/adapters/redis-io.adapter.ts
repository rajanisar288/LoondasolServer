import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { Logger, INestApplicationContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export class RedisIoAdapter extends IoAdapter {
  private readonly logger = new Logger(RedisIoAdapter.name);
  private adapterConstructor: ReturnType<typeof createAdapter> | null = null;

  constructor(
    app: INestApplicationContext,
    private readonly configService: ConfigService,
  ) {
    super(app);
  }

  async connectToRedis(): Promise<void> {
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = this.configService.get<number>('REDIS_PORT', 6379);
    const password = this.configService.get<string>('REDIS_PASSWORD');

    const pubClient = new Redis({
      host,
      port,
      password: password || undefined,
      lazyConnect: true,
      connectTimeout: 1000,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null,
    });

    pubClient.on('error', () => {});

    try {
      await Promise.race([
        pubClient.connect(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout connecting to Redis')), 1000),
        ),
      ]);
      const subClient = pubClient.duplicate();
      subClient.on('error', () => {});
      await subClient.connect();
      this.adapterConstructor = createAdapter(pubClient, subClient);
      this.logger.log(
        `Socket.IO Redis adapter connected successfully to ${host}:${port}`,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `Redis adapter connection failed (${msg}). Operating with in-memory Socket.IO.`,
      );
      try {
        pubClient.disconnect();
      } catch {}
      this.adapterConstructor = null;
    }
  }

  override createIOServer(port: number, options?: ServerOptions) {
    const server = super.createIOServer(port, options);
    if (this.adapterConstructor) {
      server.adapter(this.adapterConstructor);
    }
    return server;
  }
}
