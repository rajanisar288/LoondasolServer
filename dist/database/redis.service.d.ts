import { OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
export declare class RedisService implements OnApplicationShutdown {
    private readonly configService;
    private readonly logger;
    private client;
    private isConnected;
    constructor(configService: ConfigService);
    private initClient;
    getClient(): Redis | null;
    get(key: string): Promise<string | null>;
    set(key: string, value: string, ttlSeconds?: number): Promise<void>;
    del(key: string): Promise<void>;
    getRegionalKey(region: string, key: string): string;
    getRegional(region: string, key: string): Promise<string | null>;
    setRegional(region: string, key: string, value: string, ttlSeconds?: number): Promise<void>;
    delRegional(region: string, key: string): Promise<void>;
    publish(channel: string, message: string): Promise<void>;
    isHealthy(): boolean;
    onApplicationShutdown(): Promise<void>;
}
