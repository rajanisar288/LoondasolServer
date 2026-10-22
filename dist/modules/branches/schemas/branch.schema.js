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
exports.BranchSchema = exports.Branch = exports.BranchWorkingHours = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let BranchWorkingHours = class BranchWorkingHours {
};
exports.BranchWorkingHours = BranchWorkingHours;
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: true }),
    __metadata("design:type", Boolean)
], BranchWorkingHours.prototype, "enabled", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: '09:00' }),
    __metadata("design:type", String)
], BranchWorkingHours.prototype, "startTime", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: '18:00' }),
    __metadata("design:type", String)
], BranchWorkingHours.prototype, "endTime", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: [Number], default: [1, 2, 3, 4, 5] }),
    __metadata("design:type", Array)
], BranchWorkingHours.prototype, "workingDays", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: false }),
    __metadata("design:type", Boolean)
], BranchWorkingHours.prototype, "enforceLoginRestriction", void 0);
exports.BranchWorkingHours = BranchWorkingHours = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], BranchWorkingHours);
let Branch = class Branch {
};
exports.Branch = Branch;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true, index: true }),
    __metadata("design:type", String)
], Branch.prototype, "branchId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", String)
], Branch.prototype, "companyId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Branch.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Branch.prototype, "address", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, trim: true }),
    __metadata("design:type", String)
], Branch.prototype, "phone", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 'UTC' }),
    __metadata("design:type", String)
], Branch.prototype, "timezone", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, trim: true }),
    __metadata("design:type", String)
], Branch.prototype, "currency", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: BranchWorkingHours, default: () => ({}) }),
    __metadata("design:type", BranchWorkingHours)
], Branch.prototype, "workingHours", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: 0 }),
    __metadata("design:type", Number)
], Branch.prototype, "employeeCount", void 0);
exports.Branch = Branch = __decorate([
    (0, mongoose_1.Schema)({ collection: 'branches', timestamps: true })
], Branch);
exports.BranchSchema = mongoose_1.SchemaFactory.createForClass(Branch);
exports.BranchSchema.index({ companyId: 1, name: 1 });
//# sourceMappingURL=branch.schema.js.map