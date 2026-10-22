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
exports.PersonalTodoSchema = exports.PersonalTodo = exports.TimeInterval = exports.PersonalTodoStatus = void 0;
const mongoose_1 = require("@nestjs/mongoose");
var PersonalTodoStatus;
(function (PersonalTodoStatus) {
    PersonalTodoStatus["PENDING"] = "PENDING";
    PersonalTodoStatus["IN_PROGRESS"] = "IN_PROGRESS";
    PersonalTodoStatus["PAUSED"] = "PAUSED";
    PersonalTodoStatus["COMPLETED"] = "COMPLETED";
})(PersonalTodoStatus || (exports.PersonalTodoStatus = PersonalTodoStatus = {}));
let TimeInterval = class TimeInterval {
};
exports.TimeInterval = TimeInterval;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], TimeInterval.prototype, "intervalId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], TimeInterval.prototype, "start", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", Date)
], TimeInterval.prototype, "end", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], TimeInterval.prototype, "durationMinutes", void 0);
exports.TimeInterval = TimeInterval = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], TimeInterval);
let PersonalTodo = class PersonalTodo {
};
exports.PersonalTodo = PersonalTodo;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true, index: true }),
    __metadata("design:type", String)
], PersonalTodo.prototype, "todoId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", String)
], PersonalTodo.prototype, "companyId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", String)
], PersonalTodo.prototype, "userId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], PersonalTodo.prototype, "title", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, trim: true }),
    __metadata("design:type", String)
], PersonalTodo.prototype, "description", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        enum: Object.values(PersonalTodoStatus),
        default: PersonalTodoStatus.PENDING,
    }),
    __metadata("design:type", String)
], PersonalTodo.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: false }),
    __metadata("design:type", Boolean)
], PersonalTodo.prototype, "isRunning", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", Date)
], PersonalTodo.prototype, "currentIntervalStartedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [TimeInterval], default: [] }),
    __metadata("design:type", Array)
], PersonalTodo.prototype, "intervals", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], PersonalTodo.prototype, "totalDurationMinutes", void 0);
exports.PersonalTodo = PersonalTodo = __decorate([
    (0, mongoose_1.Schema)({ collection: 'personal_todos', timestamps: true })
], PersonalTodo);
exports.PersonalTodoSchema = mongoose_1.SchemaFactory.createForClass(PersonalTodo);
exports.PersonalTodoSchema.index({ companyId: 1, userId: 1, createdAt: -1 });
//# sourceMappingURL=personal-todo.schema.js.map