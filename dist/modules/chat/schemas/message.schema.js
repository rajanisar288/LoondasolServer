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
exports.MessageSchema = exports.Message = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let Message = class Message {
};
exports.Message = Message;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true, index: true }),
    __metadata("design:type", String)
], Message.prototype, "messageId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", String)
], Message.prototype, "companyId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 'general', index: true }),
    __metadata("design:type", String)
], Message.prototype, "channelId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", String)
], Message.prototype, "senderId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Message.prototype, "senderName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], Message.prototype, "senderAvatar", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, trim: true, default: '' }),
    __metadata("design:type", String)
], Message.prototype, "content", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: 'TEXT', enum: ['TEXT', 'VOICE', 'IMAGE', 'FILE'] }),
    __metadata("design:type", String)
], Message.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: 0 }),
    __metadata("design:type", Number)
], Message.prototype, "audioDurationSeconds", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, index: true }),
    __metadata("design:type", String)
], Message.prototype, "recipientId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: false, index: true }),
    __metadata("design:type", Boolean)
], Message.prototype, "isDirect", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: false }),
    __metadata("design:type", Boolean)
], Message.prototype, "isEdited", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: false }),
    __metadata("design:type", Boolean)
], Message.prototype, "isDeleted", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: false }),
    __metadata("design:type", Boolean)
], Message.prototype, "isPinned", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], Message.prototype, "pinnedBy", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", Date)
], Message.prototype, "pinnedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: [
            {
                url: String,
                fileName: String,
                fileType: String,
                fileSize: Number,
            },
        ],
        default: [],
    }),
    __metadata("design:type", Array)
], Message.prototype, "attachments", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: {
            messageId: String,
            senderId: String,
            senderName: String,
            content: String,
            attachmentName: String,
        },
        required: false,
    }),
    __metadata("design:type", Object)
], Message.prototype, "replyTo", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: [
            {
                emoji: String,
                userIds: [String],
            },
        ],
        default: [],
    }),
    __metadata("design:type", Array)
], Message.prototype, "reactions", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], Message.prototype, "mentions", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], Message.prototype, "readBy", void 0);
exports.Message = Message = __decorate([
    (0, mongoose_1.Schema)({ collection: 'messages', timestamps: true })
], Message);
exports.MessageSchema = mongoose_1.SchemaFactory.createForClass(Message);
exports.MessageSchema.index({ companyId: 1, channelId: 1, createdAt: 1 });
exports.MessageSchema.index({ companyId: 1, recipientId: 1 });
exports.MessageSchema.index({ companyId: 1, channelId: 1, isPinned: 1 });
//# sourceMappingURL=message.schema.js.map