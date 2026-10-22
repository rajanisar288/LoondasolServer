import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { RegionalDatabaseManager } from '../../database/regional-database.manager';
import {
  Meeting,
  MeetingSchema,
  MeetingStatus,
} from './schemas/meeting.schema';
import { CreateMeetingDto, UpdateMeetingDto } from './dto/meeting.dto';
import { TenantContext } from '../../common/decorators/current-tenant.decorator';
import { JwtPayload } from '../auth/jwt.strategy';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/schemas/notification.schema';

@Injectable()
export class MeetingsService {
  constructor(
    private readonly regionalDbManager: RegionalDatabaseManager,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
  ) {}

  // Creates a scheduled or instant meeting and notifies invited attendees
  async createMeeting(
    tenant: TenantContext,
    user: JwtPayload,
    dto: CreateMeetingDto,
  ): Promise<Meeting> {
    const model = await this.regionalDbManager.getModel<Meeting>(
      tenant.region,
      Meeting.name,
      MeetingSchema,
    );

    const meetingId = `meet_${randomUUID()}`;
    const roomId = `room_${randomUUID().replace(/-/g, '').slice(0, 10)}`;
    const meetingCode =
      dto.meetingCode?.trim().toUpperCase() ||
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
      status: MeetingStatus.SCHEDULED,
    });

    // Notify attendees asynchronously
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
              type: NotificationType.MEETING,
              data: {
                meetingId,
                roomId,
                startTime: dto.startTime,
                title: dto.title,
              },
            })
            .catch(() => {});
        }
      }
    }

    return meeting;
  }

  // Lists meetings for tenant workspace with status and date ordering
  async getMeetings(
    tenant: TenantContext,
    user: JwtPayload,
    query?: { status?: string; limit?: number },
  ): Promise<Meeting[]> {
    const model = await this.regionalDbManager.getModel<Meeting>(
      tenant.region,
      Meeting.name,
      MeetingSchema,
    );

    const filter: Record<string, any> = { companyId: tenant.companyId };
    if (query?.status) {
      filter.status = query.status;
    }

    const limit = query?.limit ? Number(query.limit) : 50;

    return model.find(filter).sort({ startTime: 1 }).limit(limit).lean();
  }

  // Fetches meeting details by meetingId, roomId, or meetingCode
  async getMeeting(
    tenant: TenantContext,
    identifier: string,
  ): Promise<Meeting> {
    const model = await this.regionalDbManager.getModel<Meeting>(
      tenant.region,
      Meeting.name,
      MeetingSchema,
    );

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
      throw new NotFoundException('Meeting session not found');
    }

    return meeting;
  }

  // Validates if caller is eligible to join (host anytime, attendees within 15 minutes of startTime)
  async joinMeeting(
    tenant: TenantContext,
    identifier: string,
    user: JwtPayload,
  ): Promise<Meeting> {
    const meeting = await this.getMeeting(tenant, identifier);

    const isHost = meeting.hostId === user.userId;
    if (!isHost) {
      const now = Date.now();
      const startTime = new Date(meeting.startTime).getTime();
      const fifteenMinutesMs = 15 * 60 * 1000;
      if (startTime - now > fifteenMinutesMs) {
        const remainingMinutes = Math.ceil((startTime - now - fifteenMinutesMs) / 60000);
        throw new ForbiddenException(
          `Meeting is scheduled for ${new Date(meeting.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Attendees can join 15 minutes before start (in ${remainingMinutes} min).`,
        );
      }
    }

    return meeting;
  }

  // Updates meeting configuration, timing, or operational status
  async updateMeeting(
    tenant: TenantContext,
    meetingId: string,
    dto: UpdateMeetingDto,
  ): Promise<Meeting> {
    const model = await this.regionalDbManager.getModel<Meeting>(
      tenant.region,
      Meeting.name,
      MeetingSchema,
    );

    const updatePayload: Record<string, any> = {};
    if (dto.title) updatePayload.title = dto.title.trim();
    if (dto.description !== undefined)
      updatePayload.description = dto.description.trim();
    if (dto.startTime) updatePayload.startTime = new Date(dto.startTime);
    if (dto.endTime) updatePayload.endTime = new Date(dto.endTime);
    if (dto.status) updatePayload.status = dto.status;
    if (dto.attendeeIds) updatePayload.attendeeIds = dto.attendeeIds;

    const updated = await model.findOneAndUpdate(
      { companyId: tenant.companyId, meetingId },
      { $set: updatePayload },
      { new: true },
    );

    if (!updated) {
      throw new NotFoundException('Meeting not found');
    }

    return updated;
  }

  // Permanently cancels and deletes a scheduled meeting
  async deleteMeeting(
    tenant: TenantContext,
    meetingId: string,
  ): Promise<{ success: boolean }> {
    const model = await this.regionalDbManager.getModel<Meeting>(
      tenant.region,
      Meeting.name,
      MeetingSchema,
    );

    const result = await model.deleteOne({
      companyId: tenant.companyId,
      meetingId,
    });

    if (result.deletedCount === 0) {
      throw new NotFoundException('Meeting not found');
    }

    return { success: true };
  }
}
