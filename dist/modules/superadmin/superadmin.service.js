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
var SuperAdminService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuperAdminService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const config_1 = require("@nestjs/config");
const crypto_1 = require("crypto");
const master_schema_1 = require("../../database/master.schema");
const regional_database_manager_1 = require("../../database/regional-database.manager");
const password_service_1 = require("../auth/password.service");
const company_schema_1 = require("../companies/schemas/company.schema");
const user_schema_1 = require("../users/schemas/user.schema");
const employee_schema_1 = require("../employees/schemas/employee.schema");
const audit_log_schema_1 = require("./schemas/audit-log.schema");
const regions_constant_1 = require("../../common/constants/regions.constant");
const permissions_constant_1 = require("../../common/constants/permissions.constant");
const roles_constant_1 = require("../../common/constants/roles.constant");
let SuperAdminService = SuperAdminService_1 = class SuperAdminService {
    constructor(masterIdentityModel, auditLogModel, regionalDbManager, passwordService, configService) {
        this.masterIdentityModel = masterIdentityModel;
        this.auditLogModel = auditLogModel;
        this.regionalDbManager = regionalDbManager;
        this.passwordService = passwordService;
        this.configService = configService;
        this.logger = new common_1.Logger(SuperAdminService_1.name);
    }
    async onModuleInit() {
        const email = (this.configService.get('SUPERADMIN_EMAIL') || 'admin@admin.com').toLowerCase().trim();
        const rawPassword = this.configService.get('SUPERADMIN_PASSWORD') || '9546167mobile191';
        try {
            const passwordHash = await this.passwordService.hash(rawPassword);
            const superAdminUserId = 'superadmin_system_id';
            const companyId = 'superadmin_workspace';
            const region = 'PK';
            let master = await this.masterIdentityModel.findOne({ normalizedEmail: email });
            if (!master) {
                master = await this.masterIdentityModel.create({
                    userId: superAdminUserId,
                    email,
                    normalizedEmail: email,
                    companyId,
                    region,
                    status: master_schema_1.AccountStatus.ACTIVE,
                    isEmailVerified: true,
                });
            }
            else {
                await this.masterIdentityModel.updateOne({ normalizedEmail: email }, { $set: { status: master_schema_1.AccountStatus.ACTIVE, isEmailVerified: true } });
            }
            const userModel = await this.regionalDbManager.getModel(region, user_schema_1.User.name, user_schema_1.UserSchema);
            const existingUser = await userModel.findOne({ email });
            if (!existingUser) {
                await userModel.create({
                    userId: master.userId,
                    companyId,
                    region,
                    email,
                    normalizedEmail: email,
                    passwordHash,
                    firstName: 'Super',
                    lastName: 'Admin',
                    displayName: 'Super Admin',
                    roleId: 'role_superadmin',
                    roleName: roles_constant_1.ROLES.SUPERADMIN || 'SUPERADMIN',
                    permissions: permissions_constant_1.ALL_PERMISSIONS,
                    isOwner: true,
                    isSuperAdmin: true,
                    status: master_schema_1.AccountStatus.ACTIVE,
                    isEmailVerified: true,
                });
            }
            else {
                await userModel.updateOne({ email }, {
                    $set: {
                        passwordHash,
                        roleName: roles_constant_1.ROLES.SUPERADMIN || 'SUPERADMIN',
                        isSuperAdmin: true,
                        permissions: permissions_constant_1.ALL_PERMISSIONS,
                        status: master_schema_1.AccountStatus.ACTIVE,
                    },
                });
            }
            this.logger.log(`Super Admin credentials initialized for [${email}]`);
        }
        catch (err) {
            this.logger.error(`Failed to initialize Super Admin: ${err.message}`);
        }
    }
    async logEvent(params) {
        try {
            return await this.auditLogModel.create({
                logId: `log_${(0, crypto_1.randomUUID)()}`,
                action: params.action,
                userId: params.userId,
                userEmail: params.userEmail,
                companyId: params.companyId,
                companyName: params.companyName,
                region: params.region,
                ipAddress: params.ipAddress,
                details: params.details || {},
            });
        }
        catch (err) {
            this.logger.warn(`Failed to write audit log: ${err.message}`);
            return null;
        }
    }
    async getSystemStats() {
        const totalIdentities = await this.masterIdentityModel.countDocuments();
        const activeIdentities = await this.masterIdentityModel.countDocuments({
            status: master_schema_1.AccountStatus.ACTIVE,
        });
        const totalLogs = await this.auditLogModel.countDocuments();
        let totalCompanies = 0;
        let activeCompanies = 0;
        let inactiveCompanies = 0;
        let freeTrialCompanies = 0;
        let paidCompanies = 0;
        let proPlanCompanies = 0;
        let ultraPlanCompanies = 0;
        let totalEmployees = 0;
        for (const region of Object.values(regions_constant_1.REGIONS)) {
            try {
                const companyModel = await this.regionalDbManager.getModel(region, company_schema_1.Company.name, company_schema_1.CompanySchema);
                const employeeModel = await this.regionalDbManager.getModel(region, employee_schema_1.Employee.name, employee_schema_1.EmployeeSchema);
                const companies = await companyModel.find().select('status subscription').lean();
                totalCompanies += companies.length;
                activeCompanies += companies.filter((c) => (c.status || 'ACTIVE') === 'ACTIVE').length;
                inactiveCompanies += companies.filter((c) => c.status && c.status !== 'ACTIVE').length;
                for (const comp of companies) {
                    const plan = comp.subscription?.plan || 'FREE_TRIAL';
                    if (plan === 'PRO') {
                        paidCompanies++;
                        proPlanCompanies++;
                    }
                    else if (plan === 'ULTRA') {
                        paidCompanies++;
                        ultraPlanCompanies++;
                    }
                    else {
                        freeTrialCompanies++;
                    }
                }
                const empCount = await employeeModel.countDocuments();
                totalEmployees += empCount;
            }
            catch (e) {
            }
        }
        return {
            totalCompanies,
            activeCompanies,
            inactiveCompanies,
            freeTrialCompanies,
            paidCompanies,
            proPlanCompanies,
            ultraPlanCompanies,
            totalUsers: totalIdentities,
            activeUsers: activeIdentities,
            totalEmployees,
            totalLogs,
            regions: Object.values(regions_constant_1.REGIONS),
        };
    }
    async getAllCompanies() {
        const allCompanies = [];
        for (const region of Object.values(regions_constant_1.REGIONS)) {
            try {
                const companyModel = await this.regionalDbManager.getModel(region, company_schema_1.Company.name, company_schema_1.CompanySchema);
                const employeeModel = await this.regionalDbManager.getModel(region, employee_schema_1.Employee.name, employee_schema_1.EmployeeSchema);
                const companies = await companyModel.find().lean();
                for (const comp of companies) {
                    const empCount = await employeeModel.countDocuments({ companyId: comp.companyId });
                    allCompanies.push({
                        ...comp,
                        status: comp.status || 'ACTIVE',
                        employeeCount: empCount,
                    });
                }
            }
            catch (e) {
            }
        }
        return allCompanies.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }
    async getCompanyDetails(companyId) {
        for (const region of Object.values(regions_constant_1.REGIONS)) {
            try {
                const companyModel = await this.regionalDbManager.getModel(region, company_schema_1.Company.name, company_schema_1.CompanySchema);
                const company = await companyModel.findOne({ companyId }).lean();
                if (company) {
                    const employeeModel = await this.regionalDbManager.getModel(region, employee_schema_1.Employee.name, employee_schema_1.EmployeeSchema);
                    const employees = await employeeModel.find({ companyId }).lean();
                    const logs = await this.auditLogModel
                        .find({ companyId })
                        .sort({ createdAt: -1 })
                        .limit(20)
                        .lean();
                    return {
                        company: {
                            ...company,
                            status: company.status || 'ACTIVE',
                        },
                        employees,
                        recentLogs: logs,
                    };
                }
            }
            catch (e) {
            }
        }
        throw new common_1.NotFoundException(`Company [${companyId}] not found`);
    }
    async updateCompanyStatus(companyId, status, superAdminUser) {
        if (!['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(status)) {
            throw new common_1.BadRequestException('Invalid status value');
        }
        let targetCompany = null;
        let companyRegion = 'PK';
        for (const region of Object.values(regions_constant_1.REGIONS)) {
            try {
                const companyModel = await this.regionalDbManager.getModel(region, company_schema_1.Company.name, company_schema_1.CompanySchema);
                const comp = await companyModel.findOne({ companyId });
                if (comp) {
                    targetCompany = comp;
                    companyRegion = region;
                    comp.status = status;
                    await comp.save();
                    const userModel = await this.regionalDbManager.getModel(region, user_schema_1.User.name, user_schema_1.UserSchema);
                    const accountStatus = status === 'ACTIVE' ? master_schema_1.AccountStatus.ACTIVE : master_schema_1.AccountStatus.SUSPENDED;
                    await userModel.updateMany({ companyId }, { $set: { status: accountStatus } });
                    break;
                }
            }
            catch (e) {
            }
        }
        if (!targetCompany) {
            throw new common_1.NotFoundException(`Company [${companyId}] not found`);
        }
        const masterAccountStatus = status === 'ACTIVE' ? master_schema_1.AccountStatus.ACTIVE : master_schema_1.AccountStatus.SUSPENDED;
        await this.masterIdentityModel.updateMany({ companyId }, { $set: { status: masterAccountStatus } });
        await this.logEvent({
            action: 'COMPANY_STATUS_UPDATED',
            userId: superAdminUser.userId,
            userEmail: superAdminUser.email,
            companyId,
            companyName: targetCompany.name,
            region: companyRegion,
            details: { newStatus: status, previousStatus: targetCompany.status },
        });
        return {
            success: true,
            message: `Company [${targetCompany.name}] status updated to ${status}`,
            companyId,
            status,
        };
    }
    async getAuditLogs(query) {
        const limit = Math.min(Number(query?.limit) || 50, 200);
        const page = Math.max(Number(query?.page) || 1, 1);
        const skip = (page - 1) * limit;
        const filter = {};
        if (query?.action) {
            filter.action = query.action;
        }
        if (query?.companyId) {
            filter.companyId = query.companyId;
        }
        if (query?.search) {
            const reg = new RegExp(query.search, 'i');
            filter.$or = [
                { action: reg },
                { userEmail: reg },
                { companyName: reg },
                { companyId: reg },
            ];
        }
        const [logs, total] = await Promise.all([
            this.auditLogModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            this.auditLogModel.countDocuments(filter),
        ]);
        return {
            logs: logs,
            total,
            page,
            limit,
        };
    }
    async getAllUsers(search) {
        const allUsers = [];
        const reg = search ? new RegExp(search, 'i') : null;
        for (const region of Object.values(regions_constant_1.REGIONS)) {
            try {
                const userModel = await this.regionalDbManager.getModel(region, user_schema_1.User.name, user_schema_1.UserSchema);
                const filter = {};
                if (reg) {
                    filter.$or = [
                        { email: reg },
                        { firstName: reg },
                        { lastName: reg },
                        { companyId: reg },
                    ];
                }
                const users = await userModel.find(filter).select('-passwordHash').limit(100).lean();
                allUsers.push(...users);
            }
            catch (e) {
            }
        }
        return allUsers;
    }
};
exports.SuperAdminService = SuperAdminService;
exports.SuperAdminService = SuperAdminService = SuperAdminService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(master_schema_1.MasterIdentity.name)),
    __param(1, (0, mongoose_1.InjectModel)(audit_log_schema_1.AuditLog.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        regional_database_manager_1.RegionalDatabaseManager,
        password_service_1.PasswordService,
        config_1.ConfigService])
], SuperAdminService);
//# sourceMappingURL=superadmin.service.js.map