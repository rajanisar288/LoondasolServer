import { Connection } from 'mongoose';
import { RegionalDatabaseManager } from '../../database/regional-database.manager';
import { RedisService } from '../../database/redis.service';
export declare class HealthController {
    private readonly masterConnection;
    private readonly regionalDbManager;
    private readonly redisService;
    constructor(masterConnection: Connection, regionalDbManager: RegionalDatabaseManager, redisService: RedisService);
    check(): Promise<Record<string, unknown>>;
}
