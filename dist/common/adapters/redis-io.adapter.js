"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisIoAdapter = void 0;
const platform_socket_io_1 = require("@nestjs/platform-socket.io");
const redis_adapter_1 = require("@socket.io/redis-adapter");
const ioredis_1 = __importDefault(require("ioredis"));
const common_1 = require("@nestjs/common");
class RedisIoAdapter extends platform_socket_io_1.IoAdapter {
    constructor(app, configService) {
        super(app);
        this.configService = configService;
        this.logger = new common_1.Logger(RedisIoAdapter.name);
        this.adapterConstructor = null;
    }
    async connectToRedis() {
        const host = this.configService.get('REDIS_HOST', 'localhost');
        const port = this.configService.get('REDIS_PORT', 6379);
        const password = this.configService.get('REDIS_PASSWORD');
        const pubClient = new ioredis_1.default({
            host,
            port,
            password: password || undefined,
            lazyConnect: true,
            connectTimeout: 1000,
            maxRetriesPerRequest: 1,
            retryStrategy: () => null,
        });
        pubClient.on('error', () => { });
        try {
            await Promise.race([
                pubClient.connect(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout connecting to Redis')), 1000)),
            ]);
            const subClient = pubClient.duplicate();
            subClient.on('error', () => { });
            await subClient.connect();
            this.adapterConstructor = (0, redis_adapter_1.createAdapter)(pubClient, subClient);
            this.logger.log(`Socket.IO Redis adapter connected successfully to ${host}:${port}`);
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            this.logger.warn(`Redis adapter connection failed (${msg}). Operating with in-memory Socket.IO.`);
            try {
                pubClient.disconnect();
            }
            catch { }
            this.adapterConstructor = null;
        }
    }
    createIOServer(port, options) {
        const server = super.createIOServer(port, options);
        if (this.adapterConstructor) {
            server.adapter(this.adapterConstructor);
        }
        return server;
    }
}
exports.RedisIoAdapter = RedisIoAdapter;
//# sourceMappingURL=redis-io.adapter.js.map