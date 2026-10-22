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
var RegionalDatabaseManager_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegionalDatabaseManager = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("mongoose");
const sharding_config_1 = require("../config/sharding.config");
let RegionalDatabaseManager = RegionalDatabaseManager_1 = class RegionalDatabaseManager {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(RegionalDatabaseManager_1.name);
        this.connections = new Map();
        this.models = new Map();
    }
    async getConnection(regionOrShard) {
        const shard = sharding_config_1.shardingConfig.getShardForCountry(regionOrShard);
        const targetKey = shard.name;
        if (this.connections.has(targetKey)) {
            const existing = this.connections.get(targetKey);
            if (Number(existing.readyState) === 1) {
                return existing;
            }
        }
        const uri = this.resolveShardUri(shard);
        this.logger.log(`Connecting to database shard [${shard.name}] (resolved from '${regionOrShard || 'default'}', countries: ${shard.countries.slice(0, 5).join(',')}) at ${this.maskUri(uri)}`);
        try {
            const connection = (0, mongoose_1.createConnection)(uri, {
                maxPoolSize: 50,
                minPoolSize: 5,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
            });
            await connection.asPromise();
            connection.on('error', (err) => {
                const msg = err instanceof Error ? err.message : String(err);
                this.logger.error(`Database shard error on [${targetKey}]: ${msg}`);
            });
            connection.on('disconnected', () => {
                this.logger.warn(`Database shard [${targetKey}] disconnected`);
            });
            connection.on('reconnected', () => {
                this.logger.log(`Database shard [${targetKey}] reconnected`);
            });
            this.connections.set(targetKey, connection);
            return connection;
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.error(`Failed to connect to database shard [${targetKey}]: ${message}`);
            const defaultShard = sharding_config_1.shardingConfig.shards[sharding_config_1.shardingConfig.defaultShard];
            if (targetKey !== defaultShard.name &&
                this.connections.has(defaultShard.name)) {
                this.logger.warn(`Falling back to default shard [${defaultShard.name}] for [${targetKey}]`);
                return this.connections.get(defaultShard.name);
            }
            throw error;
        }
    }
    async getModel(regionOrShard, modelName, schema) {
        const shard = sharding_config_1.shardingConfig.getShardForCountry(regionOrShard);
        const cacheKey = `${shard.name}:${modelName}`;
        if (this.models.has(cacheKey)) {
            return this.models.get(cacheKey);
        }
        const connection = await this.getConnection(shard.name);
        const model = (connection.models[modelName] ||
            connection.model(modelName, schema));
        this.models.set(cacheKey, model);
        return model;
    }
    resolveShardUri(shard) {
        if (shard.name === 'shard-1') {
            const envUri = this.configService.get('MONGODB_SHARD1_URI') ||
                process.env.MONGODB_SHARD1_URI;
            if (envUri && envUri.trim().length > 0)
                return envUri;
        }
        if (shard.name === 'shard-2') {
            const envUri = this.configService.get('MONGODB_SHARD2_URI') ||
                process.env.MONGODB_SHARD2_URI;
            if (envUri && envUri.trim().length > 0)
                return envUri;
        }
        if (shard.uri && shard.uri.trim().length > 0) {
            return shard.uri;
        }
        const masterUri = this.configService.get('MONGODB_MASTER_URI') ||
            'mongodb+srv://ibsolangi444_db_user:jCX8cZ43BC30akBY@cluster0.rrpbdiu.mongodb.net/workivlab_master?retryWrites=true&w=majority';
        return masterUri.replace(/\/[^/?]+(\?|$)/, `/workivlab_${shard.name.replace('-', '_')}$1`);
    }
    maskUri(uri) {
        return uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
    }
    async onApplicationShutdown() {
        this.logger.log('Closing all sharded database connection pools...');
        for (const [shardKey, conn] of this.connections.entries()) {
            try {
                await conn.close();
                this.logger.log(`Closed database connection for [${shardKey}]`);
            }
            catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                this.logger.error(`Error closing database connection for [${shardKey}]: ${message}`);
            }
        }
        this.connections.clear();
        this.models.clear();
    }
};
exports.RegionalDatabaseManager = RegionalDatabaseManager;
exports.RegionalDatabaseManager = RegionalDatabaseManager = RegionalDatabaseManager_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RegionalDatabaseManager);
//# sourceMappingURL=regional-database.manager.js.map