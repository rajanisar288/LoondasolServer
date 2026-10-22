import { OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Connection, Model, Schema } from 'mongoose';
export declare class RegionalDatabaseManager implements OnApplicationShutdown {
    private readonly configService;
    private readonly logger;
    private readonly connections;
    private readonly models;
    constructor(configService: ConfigService);
    getConnection(regionOrShard?: string): Promise<Connection>;
    getModel<T>(regionOrShard: string, modelName: string, schema: Schema): Promise<Model<T>>;
    private resolveShardUri;
    private maskUri;
    onApplicationShutdown(): Promise<void>;
}
