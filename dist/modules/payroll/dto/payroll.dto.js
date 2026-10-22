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
exports.PreviewPayrollHtmlDto = exports.BulkEmailPayrollDto = exports.CustomizePayrollSlipDto = exports.UpdateSlipStatusDto = exports.GeneratePayrollDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const payroll_slip_schema_1 = require("../schemas/payroll-slip.schema");
class GeneratePayrollDto {
}
exports.GeneratePayrollDto = GeneratePayrollDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-09', description: 'Month in YYYY-MM format' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Matches)(/^\d{4}-(0[1-9]|1[0-2])$/, { message: 'month must be in YYYY-MM format' }),
    __metadata("design:type", String)
], GeneratePayrollDto.prototype, "month", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: ['emp_123'] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], GeneratePayrollDto.prototype, "employeeIds", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], GeneratePayrollDto.prototype, "sendEmails", void 0);
class UpdateSlipStatusDto {
}
exports.UpdateSlipStatusDto = UpdateSlipStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: payroll_slip_schema_1.PayrollSlipStatus, example: payroll_slip_schema_1.PayrollSlipStatus.PAID }),
    (0, class_validator_1.IsEnum)(payroll_slip_schema_1.PayrollSlipStatus),
    __metadata("design:type", String)
], UpdateSlipStatusDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Paid via direct bank deposit' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateSlipStatusDto.prototype, "notes", void 0);
class CustomizePayrollSlipDto {
}
exports.CustomizePayrollSlipDto = CustomizePayrollSlipDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CustomizePayrollSlipDto.prototype, "baseSalary", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CustomizePayrollSlipDto.prototype, "customBonus", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CustomizePayrollSlipDto.prototype, "fuelAllowance", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CustomizePayrollSlipDto.prototype, "otherAllowances", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CustomizePayrollSlipDto.prototype, "otherDeductions", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CustomizePayrollSlipDto.prototype, "overtimeBonus", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CustomizePayrollSlipDto.prototype, "lateDeductions", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CustomizePayrollSlipDto.prototype, "lopDeductions", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CustomizePayrollSlipDto.prototype, "taxDeductions", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], CustomizePayrollSlipDto.prototype, "earningsBreakdown", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], CustomizePayrollSlipDto.prototype, "deductionsBreakdown", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CustomizePayrollSlipDto.prototype, "notes", void 0);
class BulkEmailPayrollDto {
}
exports.BulkEmailPayrollDto = BulkEmailPayrollDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-09' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], BulkEmailPayrollDto.prototype, "month", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], BulkEmailPayrollDto.prototype, "slipIds", void 0);
class PreviewPayrollHtmlDto {
}
exports.PreviewPayrollHtmlDto = PreviewPayrollHtmlDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], PreviewPayrollHtmlDto.prototype, "templateConfig", void 0);
//# sourceMappingURL=payroll.dto.js.map