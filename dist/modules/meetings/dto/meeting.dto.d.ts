import { MeetingType, MeetingStatus } from '../schemas/meeting.schema';
export declare class CreateMeetingDto {
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    meetingType?: MeetingType;
    attendeeIds?: string[];
    departmentId?: string;
    meetingCode?: string;
}
export declare class UpdateMeetingDto {
    title?: string;
    description?: string;
    startTime?: string;
    endTime?: string;
    status?: MeetingStatus;
    attendeeIds?: string[];
    meetingCode?: string;
}
