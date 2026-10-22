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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeetingsService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const regional_database_manager_1 = require("../../database/regional-database.manager");
const meeting_schema_1 = require("./schemas/meeting.schema");
const notifications_service_1 = require("../notifications/notifications.service");
const notification_schema_1 = require("../notifications/schemas/notification.schema");
let MeetingsService = class MeetingsService {
    constructor(regionalDbManager, notificationsService) {
        this.regionalDbManager = regionalDbManager;
        this.notificationsService = notificationsService;
    }
    async createMeeting(tenant, user, dto) {
        const model = await this.regionalDbManager.getModel(tenant.region, meeting_schema_1.Meeting.name, meeting_schema_1.MeetingSchema);
        const meetingId = `meet_${(0, crypto_1.randomUUID)()}`;
        const roomId = `room_${(0, crypto_1.randomUUID)().replace(/-/g, '').slice(0, 10)}`;
        const meetingCode = dto.meetingCode?.trim().toUpperCase() ||
            Math.random().toString(36).substring(2, 8).toUpperCase();
        const meeting = await model.create({
            meetingId,
            companyId: tenant.companyId,
            title: dto.title.trim(),
            description: dto.description ? dto.description.trim() : '',
            hostId: user.userId,
            hostName: user.email.split('@')[0],
            startTime: new Date(dto.startTime),
            endTime: new Date(dto.endTime),
            meetingType: dto.meetingType,
            attendeeIds: dto.attendeeIds || [],
            departmentId: dto.departmentId,
            roomId,
            meetingCode,
            status: meeting_schema_1.MeetingStatus.SCHEDULED,
        });
        if (dto.attendeeIds && dto.attendeeIds.length > 0) {
            for (const attendeeId of dto.attendeeIds) {
                if (attendeeId !== user.userId) {
                    this.notificationsService
                        .createAndPush({
                        region: tenant.region,
                        companyId: tenant.companyId,
                        userId: attendeeId,
                        title: 'New Meeting Invitation',
                        message: `${user.email.split('@')[0]} invited you to "${dto.title}"`,
                        type: notification_schema_1.NotificationType.MEETING,
                        data: {
                            meetingId,
                            roomId,
                            startTime: dto.startTime,
                            title: dto.title,
                        },
                    })
                        .catch(() => { });
                }
            }
        }
        return meeting;
    }
    async getMeetings(tenant, user, query) {
        const model = await this.regionalDbManager.getModel(tenant.region, meeting_schema_1.Meeting.name, meeting_schema_1.MeetingSchema);
        const filter = { companyId: tenant.companyId };
        if (query?.status) {
            filter.status = query.status;
        }
        const limit = query?.limit ? Number(query.limit) : 50;
        return model.find(filter).sort({ startTime: 1 }).limit(limit).lean();
    }
    async getMeeting(tenant, identifier) {
        const model = await this.regionalDbManager.getModel(tenant.region, meeting_schema_1.Meeting.name, meeting_schema_1.MeetingSchema);
        const cleanIdentifier = identifier.trim();
        const meeting = await model
            .findOne({
            companyId: tenant.companyId,
            $or: [
                { meetingId: cleanIdentifier },
                { roomId: cleanIdentifier },
                { meetingCode: cleanIdentifier.toUpperCase() },
            ],
        })
            .lean();
        if (!meeting) {
            throw new common_1.NotFoundException('Meeting session not found');
        }
        return meeting;
    }
    async joinMeeting(tenant, identifier, user) {
        const meeting = await this.getMeeting(tenant, identifier);
        const isHost = meeting.hostId === user.userId;
        if (!isHost) {
            const now = Date.now();
            const startTime = new Date(meeting.startTime).getTime();
            const fifteenMinutesMs = 15 * 60 * 1000;
            if (startTime - now > fifteenMinutesMs) {
                const remainingMinutes = Math.ceil((startTime - now - fifteenMinutesMs) / 60000);
                throw new common_1.ForbiddenException(`Meeting is scheduled for ${new Date(meeting.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Attendees can join 15 minutes before start (in ${remainingMinutes} min).`);
            }
        }
        return meeting;
    }
    async updateMeeting(tenant, meetingId, dto) {
        const model = await this.regionalDbManager.getModel(tenant.region, meeting_schema_1.Meeting.name, meeting_schema_1.MeetingSchema);
        const updatePayload = {};
        if (dto.title)
            updatePayload.title = dto.title.trim();
        if (dto.description !== undefined)
            updatePayload.description = dto.description.trim();
        if (dto.startTime)
            updatePayload.startTime = new Date(dto.startTime);
        if (dto.endTime)
            updatePayload.endTime = new Date(dto.endTime);
        if (dto.status)
            updatePayload.status = dto.status;
        if (dto.attendeeIds)
            updatePayload.attendeeIds = dto.attendeeIds;
        const updated = await model.findOneAndUpdate({ companyId: tenant.companyId, meetingId }, { $set: updatePayload }, { new: true });
        if (!updated) {
            throw new common_1.NotFoundException('Meeting not found');
        }
        return updated;
    }
    async deleteMeeting(tenant, meetingId) {
        const model = await this.regionalDbManager.getModel(tenant.region, meeting_schema_1.Meeting.name, meeting_schema_1.MeetingSchema);
        const result = await model.deleteOne({
            companyId: tenant.companyId,
            meetingId,
        });
        if (result.deletedCount === 0) {
            throw new common_1.NotFoundException('Meeting not found');
        }
        return { success: true };
    }
};
exports.MeetingsService = MeetingsService;
exports.MeetingsService = MeetingsService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => notifications_service_1.NotificationsService))),
    __metadata("design:paramtypes", [regional_database_manager_1.RegionalDatabaseManager,
        notifications_service_1.NotificationsService])
], MeetingsService);
//# sourceMappingURL=meetings.service.js.map