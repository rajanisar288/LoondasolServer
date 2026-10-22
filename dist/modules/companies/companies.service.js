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
exports.CompaniesService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("mongoose");
const mongoose_2 = require("@nestjs/mongoose");
const regional_database_manager_1 = require("../../database/regional-database.manager");
const company_schema_1 = require("./schemas/company.schema");
const user_schema_1 = require("../users/schemas/user.schema");
const employee_schema_1 = require("../employees/schemas/employee.schema");
const role_schema_1 = require("../roles/schemas/role.schema");
const department_schema_1 = require("../departments/schemas/department.schema");
const task_schema_1 = require("../tasks/schemas/task.schema");
const attendance_schema_1 = require("../attendance/schemas/attendance.schema");
const leave_schema_1 = require("../leave/schemas/leave.schema");
const channel_schema_1 = require("../chat/schemas/channel.schema");
const message_schema_1 = require("../chat/schemas/message.schema");
const meeting_schema_1 = require("../meetings/schemas/meeting.schema");
const notification_schema_1 = require("../notifications/schemas/notification.schema");
const master_schema_1 = require("../../database/master.schema");
let CompaniesService = class CompaniesService {
    constructor(regionalDbManager, masterIdentityModel) {
        this.regionalDbManager = regionalDbManager;
        this.masterIdentityModel = masterIdentityModel;
    }
    async getCompany(tenant) {
        const model = await this.regionalDbManager.getModel(tenant.region, company_schema_1.Company.name, company_schema_1.CompanySchema);
        const company = await model.findOne({ companyId: tenant.companyId }).lean();
        if (!company) {
            throw new common_1.NotFoundException('Company profile not found');
        }
        return company;
    }
    async updateCompany(tenant, dto) {
        const model = await this.regionalDbManager.getModel(tenant.region, company_schema_1.Company.name, company_schema_1.CompanySchema);
        const updated = await model
            .findOneAndUpdate({ companyId: tenant.companyId }, { $set: dto }, { new: true, runValidators: true })
            .lean();
        if (!updated) {
            throw new common_1.NotFoundException('Company profile not found');
        }
        return updated;
    }
    async deleteCompany(tenant, user) {
        if (!user.isOwner) {
            throw new common_1.ForbiddenException('Security Violation: Only the registered company owner can permanently delete this workspace.');
        }
        const companyId = tenant.companyId;
        const region = tenant.region;
        const companyModel = await this.regionalDbManager.getModel(region, company_schema_1.Company.name, company_schema_1.CompanySchema);
        const userModel = await this.regionalDbManager.getModel(region, user_schema_1.User.name, user_schema_1.UserSchema);
        const employeeModel = await this.regionalDbManager.getModel(region, employee_schema_1.Employee.name, employee_schema_1.EmployeeSchema);
        const roleModel = await this.regionalDbManager.getModel(region, role_schema_1.Role.name, role_schema_1.RoleSchema);
        const deptModel = await this.regionalDbManager.getModel(region, department_schema_1.Department.name, department_schema_1.DepartmentSchema);
        const taskModel = await this.regionalDbManager.getModel(region, task_schema_1.Task.name, task_schema_1.TaskSchema);
        const attendanceModel = await this.regionalDbManager.getModel(region, attendance_schema_1.Attendance.name, attendance_schema_1.AttendanceSchema);
        const leaveModel = await this.regionalDbManager.getModel(region, leave_schema_1.Leave.name, leave_schema_1.LeaveSchema);
        const channelModel = await this.regionalDbManager.getModel(region, channel_schema_1.Channel.name, channel_schema_1.ChannelSchema);
        const messageModel = await this.regionalDbManager.getModel(region, message_schema_1.Message.name, message_schema_1.MessageSchema);
        const meetingModel = await this.regionalDbManager.getModel(region, meeting_schema_1.Meeting.name, meeting_schema_1.MeetingSchema);
        const notifModel = await this.regionalDbManager.getModel(region, notification_schema_1.Notification.name, notification_schema_1.NotificationSchema);
        await Promise.all([
            companyModel.deleteOne({ companyId }),
            userModel.deleteMany({ companyId }),
            employeeModel.deleteMany({ companyId }),
            roleModel.deleteMany({ companyId }),
            deptModel.deleteMany({ companyId }),
            taskModel.deleteMany({ companyId }),
            attendanceModel.deleteMany({ companyId }),
            leaveModel.deleteMany({ companyId }),
            channelModel.deleteMany({ companyId }),
            messageModel.deleteMany({ companyId }),
            meetingModel.deleteMany({ companyId }),
            notifModel.deleteMany({ companyId }),
        ]);
        await this.masterIdentityModel.deleteMany({ companyId });
        return {
            message: 'Company workspace and all associated data permanently deleted.',
            success: true,
        };
    }
};
exports.CompaniesService = CompaniesService;
exports.CompaniesService = CompaniesService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, mongoose_2.InjectModel)(master_schema_1.MasterIdentity.name)),
    __metadata("design:paramtypes", [regional_database_manager_1.RegionalDatabaseManager,
        mongoose_1.Model])
], CompaniesService);
//# sourceMappingURL=companies.service.js.map