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
exports.PayrollSlipSchema = exports.PayrollSlip = exports.PayrollSlipStatus = void 0;
const mongoose_1 = require("@nestjs/mongoose");
var PayrollSlipStatus;
(function (PayrollSlipStatus) {
    PayrollSlipStatus["GENERATED"] = "GENERATED";
    PayrollSlipStatus["PAID"] = "PAID";
    PayrollSlipStatus["CANCELLED"] = "CANCELLED";
})(PayrollSlipStatus || (exports.PayrollSlipStatus = PayrollSlipStatus = {}));
let PayrollSlip = class PayrollSlip {
};
exports.PayrollSlip = PayrollSlip;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true, index: true }),
    __metadata("design:type", String)
], PayrollSlip.prototype, "slipId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", String)
], PayrollSlip.prototype, "companyId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", String)
], PayrollSlip.prototype, "employeeId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], PayrollSlip.prototype, "employeeName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, lowercase: true, trim: true }),
    __metadata("design:type", String)
], PayrollSlip.prototype, "employeeEmail", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, trim: true }),
    __metadata("design:type", String)
], PayrollSlip.prototype, "designation", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, trim: true }),
    __metadata("design:type", String)
], PayrollSlip.prototype, "departmentName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, trim: true }),
    __metadata("design:type", String)
], PayrollSlip.prototype, "branchName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", String)
], PayrollSlip.prototype, "month", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], PayrollSlip.prototype, "baseSalary", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], PayrollSlip.prototype, "workingDays", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], PayrollSlip.prototype, "presentDays", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], PayrollSlip.prototype, "absentDays", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: 0 }),
    __metadata("design:type", Number)
], PayrollSlip.prototype, "paidLeaveDays", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: 0 }),
    __metadata("design:type", Number)
], PayrollSlip.prototype, "unpaidLeaveDays", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: 0 }),
    __metadata("design:type", Number)
], PayrollSlip.prototype, "lopDays", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: 0 }),
    __metadata("design:type", Number)
], PayrollSlip.prototype, "lopDeductions", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], PayrollSlip.prototype, "lateDays", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], PayrollSlip.prototype, "overtimeHours", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], PayrollSlip.prototype, "lateDeductions", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: 0 }),
    __metadata("design:type", Number)
], PayrollSlip.prototype, "taxPercentage", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: 0 }),
    __metadata("design:type", Number)
], PayrollSlip.prototype, "taxDeductions", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], PayrollSlip.prototype, "overtimeBonus", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: 0 }),
    __metadata("design:type", Number)
], PayrollSlip.prototype, "customBonus", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: 0 }),
    __metadata("design:type", Number)
], PayrollSlip.prototype, "fuelAllowance", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: 0 }),
    __metadata("design:type", Number)
], PayrollSlip.prototype, "otherAllowances", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: 0 }),
    __metadata("design:type", Number)
], PayrollSlip.prototype, "otherDeductions", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: 0 }),
    __metadata("design:type", Number)
], PayrollSlip.prototype, "grossEarnings", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: 0 }),
    __metadata("design:type", Number)
], PayrollSlip.prototype, "totalDeductions", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], PayrollSlip.prototype, "netSalary", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: '' }),
    __metadata("design:type", String)
], PayrollSlip.prototype, "netPayInWords", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [Object], required: false, default: [] }),
    __metadata("design:type", Array)
], PayrollSlip.prototype, "earningsBreakdown", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [Object], required: false, default: [] }),
    __metadata("design:type", Array)
], PayrollSlip.prototype, "deductionsBreakdown", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: 1 }),
    __metadata("design:type", Number)
], PayrollSlip.prototype, "templateVersion", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object, required: false }),
    __metadata("design:type", Object)
], PayrollSlip.prototype, "templateSnapshot", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: '' }),
    __metadata("design:type", String)
], PayrollSlip.prototype, "pdfUrl", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: false }),
    __metadata("design:type", Boolean)
], PayrollSlip.prototype, "isPasswordProtected", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: '' }),
    __metadata("design:type", String)
], PayrollSlip.prototype, "pdfPasswordHint", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: '' }),
    __metadata("design:type", String)
], PayrollSlip.prototype, "pdfPassword", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: '' }),
    __metadata("design:type", String)
], PayrollSlip.prototype, "eSignHash", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", Date)
], PayrollSlip.prototype, "eSignedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: false }),
    __metadata("design:type", Boolean)
], PayrollSlip.prototype, "emailSent", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", Date)
], PayrollSlip.prototype, "emailSentAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        enum: Object.values(PayrollSlipStatus),
        default: PayrollSlipStatus.GENERATED,
    }),
    __metadata("design:type", String)
], PayrollSlip.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object, required: false }),
    __metadata("design:type", Object)
], PayrollSlip.prototype, "bankDetails", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", Date)
], PayrollSlip.prototype, "paidAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], PayrollSlip.prototype, "notes", void 0);
exports.PayrollSlip = PayrollSlip = __decorate([
    (0, mongoose_1.Schema)({ collection: 'payroll_slips', timestamps: true })
], PayrollSlip);
exports.PayrollSlipSchema = mongoose_1.SchemaFactory.createForClass(PayrollSlip);
exports.PayrollSlipSchema.index({ companyId: 1, month: 1, employeeId: 1 }, { unique: true });
//# sourceMappingURL=payroll-slip.schema.js.map