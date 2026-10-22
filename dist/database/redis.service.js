"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var RedisService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = __importDefault(require("ioredis"));
let RedisService = RedisService_1 = class RedisService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(RedisService_1.name);
        this.client = null;
        this.isConnected = false;
        this.initClient();
    }
    initClient() {
        const host = this.configService.get('REDIS_HOST', 'localhost');
        const port = this.configService.get('REDIS_PORT', 6379);
        const password = this.configService.get('REDIS_PASSWORD');
        try {
            this.client = new ioredis_1.default({
                host,
                port,
                password: password || undefined,
                lazyConnect: true,
                retryStrategy: (times) => {
                    if (times > 3) {
                        this.logger.warn(`Redis connection retry limit reached. Operating without cache.`);
                        return null;
                    }
                    return Math.min(times * 100, 2000);
                },
            });
            this.client.on('connect', () => {
                this.isConnected = true;
                this.logger.log(`Redis connected to ${host}:${port}`);
            });
            this.client.on('error', (err) => {
                this.isConnected = false;
                const msg = err instanceof Error ? err.message : String(err);
                this.logger.warn(`Redis connection error: ${msg}`);
            });
            this.client.connect().catch((err) => {
                const msg = err instanceof Error ? err.message : String(err);
                this.logger.warn(`Redis initial connection failed: ${msg}. Cache features will operate in-memory/bypass.`);
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.warn(`Could not initialize Redis client: ${message}`);
        }
    }
    getClient() {
        return this.client;
    }
    async get(key) {
        if (!this.client || !this.isConnected)
            return null;
        try {
            return await this.client.get(key);
        }
        catch {
            return null;
        }
    }
    async set(key, value, ttlSeconds) {
        if (!this.client || !this.isConnected)
            return;
        try {
            if (ttlSeconds) {
                await this.client.set(key, value, 'EX', ttlSeconds);
            }
            else {
                await this.client.set(key, value);
            }
        }
        catch {
        }
    }
    async del(key) {
        if (!this.client || !this.isConnected)
            return;
        try {
            await this.client.del(key);
        }
        catch {
        }
    }
    getRegionalKey(region, key) {
        const cleanRegion = (region || 'global').toLowerCase().trim();
        return `region:${cleanRegion}:${key}`;
    }
    async getRegional(region, key) {
        return this.get(this.getRegionalKey(region, key));
    }
    async setRegional(region, key, value, ttlSeconds) {
        return this.set(this.getRegionalKey(region, key), value, ttlSeconds);
    }
    async delRegional(region, key) {
        return this.del(this.getRegionalKey(region, key));
    }
    async publish(channel, message) {
        if (!this.client || !this.isConnected)
            return;
        try {
            await this.client.publish(channel, message);
        }
        catch {
        }
    }
    isHealthy() {
        return this.isConnected;
    }
    async onApplicationShutdown() {
        if (this.client) {
            await this.client.quit();
        }
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = RedisService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RedisService);
//# sourceMappingURL=redis.service.js.map