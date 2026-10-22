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
exports.OnboardingFormTemplateSchema = exports.OnboardingFormTemplate = exports.FormFieldDefinitionSchema = exports.FormFieldDefinition = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let FormFieldDefinition = class FormFieldDefinition {
};
exports.FormFieldDefinition = FormFieldDefinition;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], FormFieldDefinition.prototype, "id", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], FormFieldDefinition.prototype, "label", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 'text' }),
    __metadata("design:type", String)
], FormFieldDefinition.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: false }),
    __metadata("design:type", Boolean)
], FormFieldDefinition.prototype, "required", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], FormFieldDefinition.prototype, "options", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: '' }),
    __metadata("design:type", String)
], FormFieldDefinition.prototype, "placeholder", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: '' }),
    __metadata("design:type", String)
], FormFieldDefinition.prototype, "helperText", void 0);
exports.FormFieldDefinition = FormFieldDefinition = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], FormFieldDefinition);
exports.FormFieldDefinitionSchema = mongoose_1.SchemaFactory.createForClass(FormFieldDefinition);
let OnboardingFormTemplate = class OnboardingFormTemplate {
};
exports.OnboardingFormTemplate = OnboardingFormTemplate;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true, index: true }),
    __metadata("design:type", String)
], OnboardingFormTemplate.prototype, "templateId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", String)
], OnboardingFormTemplate.prototype, "companyId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], OnboardingFormTemplate.prototype, "title", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, index: true }),
    __metadata("design:type", String)
], OnboardingFormTemplate.prototype, "branchId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, trim: true }),
    __metadata("design:type", String)
], OnboardingFormTemplate.prototype, "branchName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, index: true }),
    __metadata("design:type", String)
], OnboardingFormTemplate.prototype, "departmentId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, trim: true }),
    __metadata("design:type", String)
], OnboardingFormTemplate.prototype, "departmentName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: false }),
    __metadata("design:type", Boolean)
], OnboardingFormTemplate.prototype, "isDefault", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [exports.FormFieldDefinitionSchema], default: [] }),
    __metadata("design:type", Array)
], OnboardingFormTemplate.prototype, "fields", void 0);
exports.OnboardingFormTemplate = OnboardingFormTemplate = __decorate([
    (0, mongoose_1.Schema)({ collection: 'onboarding_form_templates', timestamps: true })
], OnboardingFormTemplate);
exports.OnboardingFormTemplateSchema = mongoose_1.SchemaFactory.createForClass(OnboardingFormTemplate);
//# sourceMappingURL=onboarding-form.schema.js.map