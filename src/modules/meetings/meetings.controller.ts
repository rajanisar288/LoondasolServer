import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MeetingsService } from './meetings.service';
import { CreateMeetingDto, UpdateMeetingDto } from './dto/meeting.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import {
  CurrentTenant,
  TenantContext,
} from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/jwt.strategy';

@ApiTags('Meetings & Video Conferencing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('meetings')
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  @Post()
  @ApiOperation({ summary: 'Schedule a new video meeting or team sync' })
  async createMeeting(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateMeetingDto,
  ) {
    return this.meetingsService.createMeeting(tenant, user, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List scheduled and active meetings' })
  async getMeetings(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: string,
    @Query('limit') limit?: number,
  ) {
    return this.meetingsService.getMeetings(tenant, user, {
      status,
      limit: limit ? Number(limit) : 50,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get meeting session and room details' })
  async getMeeting(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
  ) {
    return this.meetingsService.getMeeting(tenant, id);
  }

  @Post(':id/join')
  @ApiOperation({ summary: 'Validate eligibility and join meeting session' })
  async joinMeeting(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.meetingsService.joinMeeting(tenant, id, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update meeting schedule or status' })
  async updateMeeting(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body() dto: UpdateMeetingDto,
  ) {
    return this.meetingsService.updateMeeting(tenant, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel and delete scheduled meeting' })
  async deleteMeeting(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
  ) {
    return this.meetingsService.deleteMeeting(tenant, id);
  }
}
