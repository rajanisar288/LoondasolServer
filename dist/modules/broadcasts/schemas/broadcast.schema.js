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
exports.BroadcastLogSchema = exports.BroadcastLog = exports.BroadcastTemplateSchema = exports.BroadcastTemplate = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let BroadcastTemplate = class BroadcastTemplate {
};
exports.BroadcastTemplate = BroadcastTemplate;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true, index: true }),
    __metadata("design:type", String)
], BroadcastTemplate.prototype, "templateId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", String)
], BroadcastTemplate.prototype, "companyId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], BroadcastTemplate.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], BroadcastTemplate.prototype, "subject", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], BroadcastTemplate.prototype, "body", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: 'General' }),
    __metadata("design:type", String)
], BroadcastTemplate.prototype, "category", void 0);
exports.BroadcastTemplate = BroadcastTemplate = __decorate([
    (0, mongoose_1.Schema)({ collection: 'broadcast_templates', timestamps: true })
], BroadcastTemplate);
exports.BroadcastTemplateSchema = mongoose_1.SchemaFactory.createForClass(BroadcastTemplate);
exports.BroadcastTemplateSchema.index({ companyId: 1, name: 1 });
let BroadcastLog = class BroadcastLog {
};
exports.BroadcastLog = BroadcastLog;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true, index: true }),
    __metadata("design:type", String)
], BroadcastLog.prototype, "broadcastId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", String)
], BroadcastLog.prototype, "companyId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], BroadcastLog.prototype, "subject", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], BroadcastLog.prototype, "body", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        enum: ['all', 'department', 'selected'],
        default: 'all',
    }),
    __metadata("design:type", String)
], BroadcastLog.prototype, "targetType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], BroadcastLog.prototype, "targetDepartmentName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], BroadcastLog.prototype, "recipientCount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], BroadcastLog.prototype, "sentBy", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: Date.now }),
    __metadata("design:type", Date)
], BroadcastLog.prototype, "sentAt", void 0);
exports.BroadcastLog = BroadcastLog = __decorate([
    (0, mongoose_1.Schema)({ collection: 'broadcast_logs', timestamps: true })
], BroadcastLog);
exports.BroadcastLogSchema = mongoose_1.SchemaFactory.createForClass(BroadcastLog);
exports.BroadcastLogSchema.index({ companyId: 1, sentAt: -1 });
//# sourceMappingURL=broadcast.schema.js.map