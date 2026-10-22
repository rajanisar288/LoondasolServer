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
exports.ReviewLeaveDto = exports.ApplyLeaveDto = void 0;
const class_validator_1 = require("class-validator");
const leave_schema_1 = require("../schemas/leave.schema");
class ApplyLeaveDto {
}
exports.ApplyLeaveDto = ApplyLeaveDto;
__decorate([
    (0, class_validator_1.IsEnum)(leave_schema_1.LeaveType),
    __metadata("design:type", String)
], ApplyLeaveDto.prototype, "leaveType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Start date is required' }),
    __metadata("design:type", String)
], ApplyLeaveDto.prototype, "startDate", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'End date is required' }),
    __metadata("design:type", String)
], ApplyLeaveDto.prototype, "endDate", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], ApplyLeaveDto.prototype, "daysCount", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Reason is required' }),
    __metadata("design:type", String)
], ApplyLeaveDto.prototype, "reason", void 0);
class ReviewLeaveDto {
}
exports.ReviewLeaveDto = ReviewLeaveDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReviewLeaveDto.prototype, "notes", void 0);
//# sourceMappingURL=leave.dto.js.map