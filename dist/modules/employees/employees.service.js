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
exports.EmployeesService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const regional_database_manager_1 = require("../../database/regional-database.manager");
const employee_schema_1 = require("./schemas/employee.schema");
const department_schema_1 = require("../departments/schemas/department.schema");
const branch_schema_1 = require("../branches/schemas/branch.schema");
const role_schema_1 = require("../roles/schemas/role.schema");
const onboarding_form_schema_1 = require("./schemas/onboarding-form.schema");
const permissions_constant_1 = require("../../common/constants/permissions.constant");
const password_service_1 = require("../auth/password.service");
const config_1 = require("@nestjs/config");
const mail_service_1 = require("../mail/mail.service");
const company_schema_1 = require("../companies/schemas/company.schema");
const user_schema_1 = require("../users/schemas/user.schema");
const mongoose_1 = require("mongoose");
const mongoose_2 = require("@nestjs/mongoose");
const master_schema_1 = require("../../database/master.schema");
let EmployeesService = class EmployeesService {
    constructor(regionalDbManager, passwordService, mailService, configService, masterIdentityModel) {
        this.regionalDbManager = regionalDbManager;
        this.passwordService = passwordService;
        this.mailService = mailService;
        this.configService = configService;
        this.masterIdentityModel = masterIdentityModel;
    }
    async findAll(tenant, user, query) {
        const model = await this.regionalDbManager.getModel(tenant.region, employee_schema_1.Employee.name, employee_schema_1.EmployeeSchema);
        const isPaginationDisabled = query.pagination === false ||
            query.pagination === 'false' ||
            query.paginate === false ||
            query.paginate === 'false';
        const page = isPaginationDisabled ? 1 : Math.max(1, Number(query.page) || 1);
        const limit = isPaginationDisabled
            ? 10000
            : Math.max(1, Math.min(100, Number(query.limit) || 20));
        const skip = (page - 1) * limit;
        const filter = { companyId: tenant.companyId };
        if (query.departmentId) {
            filter['departmentId'] = query.departmentId;
        }
        if (query.branchId) {
            filter['branchId'] = query.branchId;
        }
        if (query.status) {
            filter['status'] = query.status;
        }
        if (query.search) {
            const regex = new RegExp(query.search, 'i');
            filter['$or'] = [
                { firstName: regex },
                { lastName: regex },
                { email: regex },
                { designation: regex },
            ];
        }
        const [total, records] = await Promise.all([
            model.countDocuments(filter),
            model
                .find(filter)
                .sort({ createdAt: -1 })
                .skip(isPaginationDisabled ? 0 : skip)
                .limit(limit)
                .lean(),
        ]);
        const canViewSalary = user.isOwner ||
            (user.permissions &&
                user.permissions.includes(permissions_constant_1.PERMISSIONS.EMPLOYEES_SALARY_VIEW));
        const sanitizedData = records.map((emp) => {
            const record = { ...emp };
            if (!canViewSalary) {
                delete record.salary;
            }
            return record;
        });
        return {
            data: sanitizedData,
            total,
            page,
            limit: isPaginationDisabled ? total : limit,
        };
    }
    async findOne(tenant, user, employeeId) {
        const model = await this.regionalDbManager.getModel(tenant.region, employee_schema_1.Employee.name, employee_schema_1.EmployeeSchema);
        const employee = await model
            .findOne({ companyId: tenant.companyId, employeeId })
            .lean();
        if (!employee) {
            throw new common_1.NotFoundException('Employee not found');
        }
        const canViewSalary = user.isOwner ||
            (user.permissions &&
                user.permissions.includes(permissions_constant_1.PERMISSIONS.EMPLOYEES_SALARY_VIEW));
        if (!canViewSalary) {
            delete employee.salary;
        }
        return employee;
    }
    async create(tenant, dto) {
        const model = await this.regionalDbManager.getModel(tenant.region, employee_schema_1.Employee.name, employee_schema_1.EmployeeSchema);
        const companyModel = await this.regionalDbManager.getModel(tenant.region, company_schema_1.Company.name, company_schema_1.CompanySchema);
        const company = await companyModel
            .findOne({ companyId: tenant.companyId })
            .lean();
        const activeEmployees = await model.countDocuments({
            companyId: tenant.companyId,
            status: { $nin: ['TERMINATED', 'DEACTIVATED', 'INACTIVE'] },
        });
        const totalActiveSeats = activeEmployees + 1;
        const purchasedSeats = company?.subscription?.purchasedSeats ?? 5;
        if (totalActiveSeats >= purchasedSeats) {
            throw new common_1.BadRequestException(`You have reached your ${purchasedSeats} employee seats limit. To add more employees, please purchase additional seats in Settings.`);
        }
        const existing = await model
            .findOne({
            companyId: tenant.companyId,
            email: dto.email.toLowerCase().trim(),
        })
            .lean();
        if (existing) {
            throw new common_1.ConflictException(`An employee with email "${dto.email}" already exists`);
        }
        let departmentName;
        if (dto.departmentId) {
            const deptModel = await this.regionalDbManager.getModel(tenant.region, department_schema_1.Department.name, department_schema_1.DepartmentSchema);
            const dept = await deptModel
                .findOne({
                companyId: tenant.companyId,
                departmentId: dto.departmentId,
            })
                .lean();
            if (dept) {
                departmentName = dept.name;
                await deptModel.updateOne({ _id: dept._id }, { $inc: { employeeCount: 1 } });
            }
        }
        let branchName;
        if (dto.branchId) {
            const branchModel = await this.regionalDbManager.getModel(tenant.region, branch_schema_1.Branch.name, branch_schema_1.BranchSchema);
            const branch = await branchModel
                .findOne({
                companyId: tenant.companyId,
                branchId: dto.branchId,
            })
                .lean();
            if (branch) {
                branchName = branch.name;
                await branchModel.updateOne({ _id: branch._id }, { $inc: { employeeCount: 1 } });
            }
        }
        const employeeId = `emp_${(0, crypto_1.randomUUID)()}`;
        const rawInvitationToken = (0, crypto_1.randomBytes)(32).toString('hex');
        const invitationTokenHash = await this.passwordService.hash(rawInvitationToken);
        const invitationExpiresAt = new Date();
        invitationExpiresAt.setHours(invitationExpiresAt.getHours() + 48);
        let roleName = dto.roleName || 'EMPLOYEE';
        let rolePermissions = dto.permissions || [];
        let roleId = dto.roleId;
        if (dto.roleId || dto.roleName) {
            const roleModel = await this.regionalDbManager.getModel(tenant.region, role_schema_1.Role.name, role_schema_1.RoleSchema);
            let role = null;
            if (dto.roleId) {
                role = await roleModel
                    .findOne({ companyId: tenant.companyId, _id: dto.roleId })
                    .lean();
            }
            else if (dto.roleName) {
                role = await roleModel
                    .findOne({ companyId: tenant.companyId, name: dto.roleName })
                    .lean();
            }
            if (role) {
                roleId = role._id.toString();
                roleName = role.name;
                rolePermissions = role.permissions || [];
            }
        }
        const employee = await model.create({
            employeeId,
            companyId: tenant.companyId,
            firstName: dto.firstName.trim(),
            lastName: dto.lastName.trim(),
            email: dto.email.toLowerCase().trim(),
            phone: dto.phone,
            departmentId: dto.departmentId,
            departmentName,
            branchId: dto.branchId,
            branchName,
            designation: dto.designation.trim(),
            employmentType: dto.employmentType,
            salary: dto.salary || 0,
            taxPercentage: dto.taxPercentage,
            customFields: dto.customFields || {},
            documents: dto.documents || [],
            userLocationRegion: dto.userLocationRegion,
            joiningDate: dto.joiningDate ? new Date(dto.joiningDate) : new Date(),
            status: employee_schema_1.EmployeeStatus.INVITED,
            permissions: rolePermissions,
            roleName,
            roleId,
            invitationTokenHash,
            invitationExpiresAt,
        });
        const companyName = company?.name || 'WorkivLab';
        const appUrl = this.configService.get('APP_URL') || 'http://localhost:4200';
        const invitationLink = `${appUrl}/register?token=${rawInvitationToken}&email=${encodeURIComponent(employee.email)}&type=employee&region=${tenant.region}&companyId=${tenant.companyId}`;
        this.mailService
            .sendEmployeeInvitationEmail(employee.email, {
            employeeName: `${employee.firstName} ${employee.lastName}`,
            companyName,
            designation: employee.designation,
            departmentName,
            inviteLink: invitationLink,
            expiresInHours: 48,
        })
            .catch((err) => {
            console.error('Failed to send employee invitation email:', err?.message);
        });
        return { employee, invitationLink };
    }
    async update(tenant, employeeId, dto) {
        const model = await this.regionalDbManager.getModel(tenant.region, employee_schema_1.Employee.name, employee_schema_1.EmployeeSchema);
        let departmentName;
        if (dto.departmentId) {
            const deptModel = await this.regionalDbManager.getModel(tenant.region, department_schema_1.Department.name, department_schema_1.DepartmentSchema);
            const dept = await deptModel
                .findOne({
                companyId: tenant.companyId,
                departmentId: dto.departmentId,
            })
                .lean();
            if (dept) {
                departmentName = dept.name;
            }
        }
        const updatePayload = { ...dto };
        if (departmentName) {
            updatePayload['departmentName'] = departmentName;
        }
        if (dto.branchId) {
            const branchModel = await this.regionalDbManager.getModel(tenant.region, branch_schema_1.Branch.name, branch_schema_1.BranchSchema);
            const branch = await branchModel
                .findOne({
                companyId: tenant.companyId,
                branchId: dto.branchId,
            })
                .lean();
            if (branch) {
                updatePayload['branchId'] = branch.branchId;
                updatePayload['branchName'] = branch.name;
            }
        }
        else if (dto.branchId === '' || dto.branchId === null) {
            updatePayload['branchId'] = null;
            updatePayload['branchName'] = null;
        }
        if (dto.roleId || dto.roleName) {
            const roleModel = await this.regionalDbManager.getModel(tenant.region, role_schema_1.Role.name, role_schema_1.RoleSchema);
            let role = null;
            if (dto.roleId) {
                role = await roleModel
                    .findOne({ companyId: tenant.companyId, _id: dto.roleId })
                    .lean();
            }
            else if (dto.roleName) {
                role = await roleModel
                    .findOne({ companyId: tenant.companyId, name: dto.roleName })
                    .lean();
            }
            if (role) {
                updatePayload['roleId'] = role._id.toString();
                updatePayload['roleName'] = role.name;
                updatePayload['permissions'] = role.permissions || [];
                dto.permissions = role.permissions || [];
                dto.roleName = role.name;
            }
        }
        const updated = await model
            .findOneAndUpdate({ companyId: tenant.companyId, employeeId }, { $set: updatePayload }, { new: true })
            .lean();
        if (!updated) {
            throw new common_1.NotFoundException('Employee not found');
        }
        if (updated.userId) {
            const userModel = await this.regionalDbManager.getModel(tenant.region, user_schema_1.User.name, user_schema_1.UserSchema);
            const userUpdates = {};
            if (dto.permissions)
                userUpdates['permissions'] = dto.permissions;
            if (dto.roleName)
                userUpdates['roleName'] = dto.roleName;
            if (dto.branchId !== undefined) {
                userUpdates['branchId'] = updatePayload['branchId'];
                userUpdates['branchName'] = updatePayload['branchName'];
            }
            if (dto.status) {
                const accStatus = dto.status === employee_schema_1.EmployeeStatus.ACTIVE
                    ? master_schema_1.AccountStatus.ACTIVE
                    : master_schema_1.AccountStatus.DEACTIVATED;
                userUpdates['status'] = accStatus;
                await this.masterIdentityModel.updateOne({ userId: updated.userId }, { $set: { status: accStatus } });
            }
            if (Object.keys(userUpdates).length > 0) {
                await userModel.updateOne({ userId: updated.userId, companyId: tenant.companyId }, { $set: userUpdates });
            }
        }
        return updated;
    }
    async updateStatus(tenant, employeeId, status) {
        return this.update(tenant, employeeId, { status });
    }
    async delete(tenant, employeeId) {
        const model = await this.regionalDbManager.getModel(tenant.region, employee_schema_1.Employee.name, employee_schema_1.EmployeeSchema);
        const employee = await model
            .findOne({
            companyId: tenant.companyId,
            employeeId,
        })
            .lean();
        if (!employee) {
            throw new common_1.NotFoundException('Employee not found');
        }
        const userModel = await this.regionalDbManager.getModel(tenant.region, user_schema_1.User.name, user_schema_1.UserSchema);
        if (employee.userId) {
            await userModel.deleteMany({
                companyId: tenant.companyId,
                userId: employee.userId,
            });
        }
        if (employee.email) {
            await userModel.deleteMany({
                companyId: tenant.companyId,
                email: employee.email.toLowerCase().trim(),
            });
        }
        if (employee.userId) {
            await this.masterIdentityModel.deleteMany({ userId: employee.userId });
        }
        if (employee.email) {
            await this.masterIdentityModel.deleteMany({
                email: employee.email.toLowerCase().trim(),
            });
        }
        if (employee.departmentId) {
            const deptModel = await this.regionalDbManager.getModel(tenant.region, department_schema_1.Department.name, department_schema_1.DepartmentSchema);
            await deptModel.updateOne({
                companyId: tenant.companyId,
                departmentId: employee.departmentId,
                employeeCount: { $gt: 0 },
            }, { $inc: { employeeCount: -1 } });
        }
        await model.deleteOne({
            companyId: tenant.companyId,
            employeeId,
        });
        return { success: true };
    }
    async getOnboardingForms(tenant, query) {
        const model = await this.regionalDbManager.getModel(tenant.region, onboarding_form_schema_1.OnboardingFormTemplate.name, onboarding_form_schema_1.OnboardingFormTemplateSchema);
        const filter = { companyId: tenant.companyId };
        if (query?.branchId)
            filter['branchId'] = query.branchId;
        if (query?.departmentId)
            filter['departmentId'] = query.departmentId;
        return model.find(filter).sort({ createdAt: -1 }).lean();
    }
    async getActiveOnboardingForm(tenant, query) {
        const model = await this.regionalDbManager.getModel(tenant.region, onboarding_form_schema_1.OnboardingFormTemplate.name, onboarding_form_schema_1.OnboardingFormTemplateSchema);
        if (query?.branchId && query?.departmentId) {
            const specific = await model
                .findOne({
                companyId: tenant.companyId,
                branchId: query.branchId,
                departmentId: query.departmentId,
            })
                .lean();
            if (specific)
                return specific;
        }
        if (query?.branchId) {
            const branchSpecific = await model
                .findOne({
                companyId: tenant.companyId,
                branchId: query.branchId,
            })
                .lean();
            if (branchSpecific)
                return branchSpecific;
        }
        const defaultForm = await model
            .findOne({
            companyId: tenant.companyId,
            isDefault: true,
        })
            .lean();
        if (defaultForm)
            return defaultForm;
        return model.findOne({ companyId: tenant.companyId }).lean();
    }
    async createOnboardingForm(tenant, dto) {
        const model = await this.regionalDbManager.getModel(tenant.region, onboarding_form_schema_1.OnboardingFormTemplate.name, onboarding_form_schema_1.OnboardingFormTemplateSchema);
        const templateId = `form_${(0, crypto_1.randomUUID)()}`;
        if (dto.isDefault) {
            await model.updateMany({ companyId: tenant.companyId }, { $set: { isDefault: false } });
        }
        return model.create({
            templateId,
            companyId: tenant.companyId,
            title: dto.title.trim(),
            branchId: dto.branchId,
            branchName: dto.branchName,
            departmentId: dto.departmentId,
            departmentName: dto.departmentName,
            isDefault: !!dto.isDefault,
            fields: dto.fields || [],
        });
    }
    async updateOnboardingForm(tenant, templateId, dto) {
        const model = await this.regionalDbManager.getModel(tenant.region, onboarding_form_schema_1.OnboardingFormTemplate.name, onboarding_form_schema_1.OnboardingFormTemplateSchema);
        if (dto.isDefault) {
            await model.updateMany({ companyId: tenant.companyId, templateId: { $ne: templateId } }, { $set: { isDefault: false } });
        }
        const updated = await model
            .findOneAndUpdate({ companyId: tenant.companyId, templateId }, { $set: dto }, { new: true })
            .lean();
        if (!updated) {
            throw new common_1.NotFoundException('Onboarding form template not found');
        }
        return updated;
    }
    async deleteOnboardingForm(tenant, templateId) {
        const model = await this.regionalDbManager.getModel(tenant.region, onboarding_form_schema_1.OnboardingFormTemplate.name, onboarding_form_schema_1.OnboardingFormTemplateSchema);
        const res = await model.deleteOne({
            companyId: tenant.companyId,
            templateId,
        });
        if (res.deletedCount === 0) {
            throw new common_1.NotFoundException('Onboarding form template not found');
        }
        return { success: true };
    }
};
exports.EmployeesService = EmployeesService;
exports.EmployeesService = EmployeesService = __decorate([
    (0, common_1.Injectable)(),
    __param(4, (0, mongoose_2.InjectModel)(master_schema_1.MasterIdentity.name)),
    __metadata("design:paramtypes", [regional_database_manager_1.RegionalDatabaseManager,
        password_service_1.PasswordService,
        mail_service_1.MailService,
        config_1.ConfigService,
        mongoose_1.Model])
], EmployeesService);
//# sourceMappingURL=employees.service.js.map