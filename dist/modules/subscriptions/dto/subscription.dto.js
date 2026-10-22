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
exports.SwitchPlanDto = exports.CreateCheckoutSessionDto = void 0;
const class_validator_1 = require("class-validator");
const company_schema_1 = require("../../companies/schemas/company.schema");
class CreateCheckoutSessionDto {
}
exports.CreateCheckoutSessionDto = CreateCheckoutSessionDto;
__decorate([
    (0, class_validator_1.IsEnum)(company_schema_1.SubscriptionPlan),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateCheckoutSessionDto.prototype, "plan", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCheckoutSessionDto.prototype, "successUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCheckoutSessionDto.prototype, "cancelUrl", void 0);
class SwitchPlanDto {
}
exports.SwitchPlanDto = SwitchPlanDto;
__decorate([
    (0, class_validator_1.IsEnum)(company_schema_1.SubscriptionPlan),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SwitchPlanDto.prototype, "plan", void 0);
//# sourceMappingURL=subscription.dto.js.map