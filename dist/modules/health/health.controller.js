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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const regional_database_manager_1 = require("../../database/regional-database.manager");
const redis_service_1 = require("../../database/redis.service");
const regions_constant_1 = require("../../common/constants/regions.constant");
let HealthController = class HealthController {
    constructor(masterConnection, regionalDbManager, redisService) {
        this.masterConnection = masterConnection;
        this.regionalDbManager = regionalDbManager;
        this.redisService = redisService;
    }
    async check() {
        const masterStatus = Number(this.masterConnection.readyState) === 1
            ? 'connected'
            : 'disconnected';
        let pkStatus = 'unknown';
        try {
            const conn = await this.regionalDbManager.getConnection(regions_constant_1.REGIONS.PK);
            pkStatus = Number(conn.readyState) === 1 ? 'connected' : 'disconnected';
        }
        catch {
            pkStatus = 'failed';
        }
        const redisClient = this.redisService.getClient();
        const redisStatus = redisClient?.status === 'ready' || redisClient?.status === 'connect'
            ? 'connected'
            : 'bypassed';
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            databases: {
                master: masterStatus,
                regional_pk: pkStatus,
            },
            services: {
                redis: redisStatus,
            },
            uptime: process.uptime(),
        };
    }
};
exports.HealthController = HealthController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'System health check for databases and services' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "check", null);
exports.HealthController = HealthController = __decorate([
    (0, swagger_1.ApiTags)('Health'),
    (0, common_1.Controller)('health'),
    __param(0, (0, mongoose_1.InjectConnection)()),
    __metadata("design:paramtypes", [mongoose_2.Connection,
        regional_database_manager_1.RegionalDatabaseManager,
        redis_service_1.RedisService])
], HealthController);
//# sourceMappingURL=health.controller.js.map