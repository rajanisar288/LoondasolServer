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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketingService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const regional_database_manager_1 = require("../../database/regional-database.manager");
const marketing_post_schema_1 = require("./schemas/marketing-post.schema");
let MarketingService = class MarketingService {
    constructor(regionalDbManager) {
        this.regionalDbManager = regionalDbManager;
    }
    async findAll(tenant) {
        const model = await this.regionalDbManager.getModel(tenant.region, marketing_post_schema_1.MarketingPost.name, marketing_post_schema_1.MarketingPostSchema);
        return model.find({ companyId: tenant.companyId }).sort({ createdAt: -1 }).lean();
    }
    async create(tenant, user, dto) {
        const model = await this.regionalDbManager.getModel(tenant.region, marketing_post_schema_1.MarketingPost.name, marketing_post_schema_1.MarketingPostSchema);
        const postId = `post_${(0, crypto_1.randomUUID)()}`;
        return model.create({
            postId,
            companyId: tenant.companyId,
            platform: dto.platform.toUpperCase().trim(),
            content: dto.content.trim(),
            hashtags: dto.hashtags || [],
            mediaUrl: dto.mediaUrl,
            status: dto.status || 'DRAFT',
            scheduledFor: dto.scheduledFor ? new Date(dto.scheduledFor) : undefined,
            createdBy: user.userId,
        });
    }
    async delete(tenant, postId) {
        const model = await this.regionalDbManager.getModel(tenant.region, marketing_post_schema_1.MarketingPost.name, marketing_post_schema_1.MarketingPostSchema);
        const result = await model.deleteOne({
            companyId: tenant.companyId,
            postId,
        });
        if (result.deletedCount === 0) {
            throw new common_1.NotFoundException('Post not found');
        }
        return { success: true };
    }
};
exports.MarketingService = MarketingService;
exports.MarketingService = MarketingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [regional_database_manager_1.RegionalDatabaseManager])
], MarketingService);
//# sourceMappingURL=marketing.service.js.map