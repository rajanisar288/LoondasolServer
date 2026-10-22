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
exports.MarketingPostSchema = exports.MarketingPost = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let MarketingPost = class MarketingPost {
};
exports.MarketingPost = MarketingPost;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true, index: true }),
    __metadata("design:type", String)
], MarketingPost.prototype, "postId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", String)
], MarketingPost.prototype, "companyId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], MarketingPost.prototype, "platform", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], MarketingPost.prototype, "content", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], MarketingPost.prototype, "hashtags", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], MarketingPost.prototype, "mediaUrl", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 'DRAFT', enum: ['DRAFT', 'SCHEDULED', 'PUBLISHED'] }),
    __metadata("design:type", String)
], MarketingPost.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", Date)
], MarketingPost.prototype, "scheduledFor", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], MarketingPost.prototype, "createdBy", void 0);
exports.MarketingPost = MarketingPost = __decorate([
    (0, mongoose_1.Schema)({ collection: 'marketing_posts', timestamps: true })
], MarketingPost);
exports.MarketingPostSchema = mongoose_1.SchemaFactory.createForClass(MarketingPost);
exports.MarketingPostSchema.index({ companyId: 1, createdAt: -1 });
//# sourceMappingURL=marketing-post.schema.js.map