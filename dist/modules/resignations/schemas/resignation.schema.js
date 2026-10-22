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
exports.ResignationSchema = exports.Resignation = exports.ExitClearanceChecklist = exports.ResignationStatus = void 0;
const mongoose_1 = require("@nestjs/mongoose");
var ResignationStatus;
(function (ResignationStatus) {
    ResignationStatus["SUBMITTED"] = "SUBMITTED";
    ResignationStatus["UNDER_REVIEW"] = "UNDER_REVIEW";
    ResignationStatus["APPROVED"] = "APPROVED";
    ResignationStatus["REJECTED"] = "REJECTED";
    ResignationStatus["COMPLETED"] = "COMPLETED";
})(ResignationStatus || (exports.ResignationStatus = ResignationStatus = {}));
let ExitClearanceChecklist = class ExitClearanceChecklist {
};
exports.ExitClearanceChecklist = ExitClearanceChecklist;
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: false }),
    __metadata("design:type", Boolean)
], ExitClearanceChecklist.prototype, "itAssetsReturned", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: false }),
    __metadata("design:type", Boolean)
], ExitClearanceChecklist.prototype, "accessRevoked", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: false }),
    __metadata("design:type", Boolean)
], ExitClearanceChecklist.prototype, "idBadgeReturned", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: false }),
    __metadata("design:type", Boolean)
], ExitClearanceChecklist.prototype, "financeDuesCleared", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: false }),
    __metadata("design:type", Boolean)
], ExitClearanceChecklist.prototype, "knowledgeTransferDone", void 0);
exports.ExitClearanceChecklist = ExitClearanceChecklist = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], ExitClearanceChecklist);
let Resignation = class Resignation {
};
exports.Resignation = Resignation;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true, index: true }),
    __metadata("design:type", String)
], Resignation.prototype, "resignationId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", String)
], Resignation.prototype, "companyId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", String)
], Resignation.prototype, "employeeId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", String)
], Resignation.prototype, "userId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Resignation.prototype, "employeeName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, lowercase: true, trim: true }),
    __metadata("design:type", String)
], Resignation.prototype, "employeeEmail", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, trim: true }),
    __metadata("design:type", String)
], Resignation.prototype, "departmentName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], Resignation.prototype, "submissionDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], Resignation.prototype, "intendedLastWorkingDay", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Resignation.prototype, "reason", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        enum: Object.values(ResignationStatus),
        default: ResignationStatus.SUBMITTED,
    }),
    __metadata("design:type", String)
], Resignation.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: ExitClearanceChecklist, default: () => ({}) }),
    __metadata("design:type", ExitClearanceChecklist)
], Resignation.prototype, "clearanceChecklist", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], Resignation.prototype, "reviewedBy", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", Date)
], Resignation.prototype, "reviewedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, trim: true }),
    __metadata("design:type", String)
], Resignation.prototype, "exitInterviewNotes", void 0);
exports.Resignation = Resignation = __decorate([
    (0, mongoose_1.Schema)({ collection: 'resignations', timestamps: true })
], Resignation);
exports.ResignationSchema = mongoose_1.SchemaFactory.createForClass(Resignation);
exports.ResignationSchema.index({ companyId: 1, employeeId: 1, status: 1 });
//# sourceMappingURL=resignation.schema.js.map