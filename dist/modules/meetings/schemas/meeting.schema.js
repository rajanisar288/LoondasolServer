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
exports.MeetingSchema = exports.Meeting = exports.MeetingStatus = exports.MeetingType = void 0;
const mongoose_1 = require("@nestjs/mongoose");
var MeetingType;
(function (MeetingType) {
    MeetingType["VIDEO"] = "VIDEO";
    MeetingType["SYNC"] = "SYNC";
    MeetingType["STANDUP"] = "STANDUP";
    MeetingType["ONE_ON_ONE"] = "ONE_ON_ONE";
})(MeetingType || (exports.MeetingType = MeetingType = {}));
var MeetingStatus;
(function (MeetingStatus) {
    MeetingStatus["SCHEDULED"] = "SCHEDULED";
    MeetingStatus["IN_PROGRESS"] = "IN_PROGRESS";
    MeetingStatus["COMPLETED"] = "COMPLETED";
    MeetingStatus["CANCELLED"] = "CANCELLED";
})(MeetingStatus || (exports.MeetingStatus = MeetingStatus = {}));
let Meeting = class Meeting {
};
exports.Meeting = Meeting;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true, index: true }),
    __metadata("design:type", String)
], Meeting.prototype, "meetingId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", String)
], Meeting.prototype, "companyId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Meeting.prototype, "title", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, trim: true, default: '' }),
    __metadata("design:type", String)
], Meeting.prototype, "description", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", String)
], Meeting.prototype, "hostId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Meeting.prototype, "hostName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], Meeting.prototype, "startTime", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], Meeting.prototype, "endTime", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        enum: Object.values(MeetingType),
        default: MeetingType.VIDEO,
    }),
    __metadata("design:type", String)
], Meeting.prototype, "meetingType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], Meeting.prototype, "attendeeIds", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, index: true }),
    __metadata("design:type", String)
], Meeting.prototype, "departmentId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true, index: true }),
    __metadata("design:type", String)
], Meeting.prototype, "roomId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, index: true }),
    __metadata("design:type", String)
], Meeting.prototype, "meetingCode", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        enum: Object.values(MeetingStatus),
        default: MeetingStatus.SCHEDULED,
        index: true,
    }),
    __metadata("design:type", String)
], Meeting.prototype, "status", void 0);
exports.Meeting = Meeting = __decorate([
    (0, mongoose_1.Schema)({ collection: 'meetings', timestamps: true })
], Meeting);
exports.MeetingSchema = mongoose_1.SchemaFactory.createForClass(Meeting);
exports.MeetingSchema.index({ companyId: 1, startTime: -1 });
exports.MeetingSchema.index({ companyId: 1, status: 1 });
//# sourceMappingURL=meeting.schema.js.map