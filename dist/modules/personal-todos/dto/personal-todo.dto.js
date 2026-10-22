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
exports.UpdatePersonalTodoDto = exports.CreatePersonalTodoDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const personal_todo_schema_1 = require("../schemas/personal-todo.schema");
class CreatePersonalTodoDto {
}
exports.CreatePersonalTodoDto = CreatePersonalTodoDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Review quarterly architecture design' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreatePersonalTodoDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Check database schema and redis sharding' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreatePersonalTodoDto.prototype, "description", void 0);
class UpdatePersonalTodoDto {
}
exports.UpdatePersonalTodoDto = UpdatePersonalTodoDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Review quarterly architecture design' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdatePersonalTodoDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Check database schema and redis sharding' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdatePersonalTodoDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: personal_todo_schema_1.PersonalTodoStatus }),
    (0, class_validator_1.IsEnum)(personal_todo_schema_1.PersonalTodoStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdatePersonalTodoDto.prototype, "status", void 0);
//# sourceMappingURL=personal-todo.dto.js.map