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
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const crypto_1 = require("crypto");
const master_schema_1 = require("../../database/master.schema");
const regional_database_manager_1 = require("../../database/regional-database.manager");
const sharding_config_1 = require("../../config/sharding.config");
const password_service_1 = require("./password.service");
const token_service_1 = require("./token.service");
const register_dto_1 = require("./dto/register.dto");
const mail_service_1 = require("../mail/mail.service");
const company_schema_1 = require("../companies/schemas/company.schema");
const user_schema_1 = require("../users/schemas/user.schema");
const role_schema_1 = require("../roles/schemas/role.schema");
const employee_schema_1 = require("../employees/schemas/employee.schema");
const onboarding_form_schema_1 = require("../employees/schemas/onboarding-form.schema");
const branch_schema_1 = require("../branches/schemas/branch.schema");
const permissions_constant_1 = require("../../common/constants/permissions.constant");
const roles_constant_1 = require("../../common/constants/roles.constant");
const regions_constant_1 = require("../../common/constants/regions.constant");
const working_hours_helper_1 = require("../companies/working-hours.helper");
let AuthService = AuthService_1 = class AuthService {
    constructor(masterIdentityModel, regionalDbManager, passwordService, tokenService, mailService) {
        this.masterIdentityModel = masterIdentityModel;
        this.regionalDbManager = regionalDbManager;
        this.passwordService = passwordService;
        this.tokenService = tokenService;
        this.mailService = mailService;
        this.logger = new common_1.Logger(AuthService_1.name);
    }
    async resolveEffectiveLocale(region, company, user) {
        const companyTimezone = company.timezone || 'UTC';
        const companyCurrency = company.currency || 'USD';
        let effectiveBranchId = user.branchId;
        let effectiveBranchName = user.branchName;
        try {
            const empModel = await this.regionalDbManager.getModel(region, employee_schema_1.Employee.name, employee_schema_1.EmployeeSchema);
            const emp = await empModel
                .findOne({
                companyId: company.companyId,
                $or: [
                    { userId: user.userId },
                    ...(user.email ? [{ email: user.email.toLowerCase().trim() }] : []),
                ],
            })
                .lean();
            if (emp?.branchId) {
                effectiveBranchId = emp.branchId;
                effectiveBranchName = emp.branchName || effectiveBranchName;
            }
        }
        catch { }
        let branch = null;
        if (effectiveBranchId) {
            try {
                const branchModel = await this.regionalDbManager.getModel(region, branch_schema_1.Branch.name, branch_schema_1.BranchSchema);
                branch = await branchModel
                    .findOne({ companyId: company.companyId, branchId: effectiveBranchId })
                    .lean();
            }
            catch { }
        }
        const branchTimezone = branch?.timezone || undefined;
        const branchCurrency = branch?.currency || undefined;
        return {
            timezone: branchTimezone || companyTimezone,
            currency: branchCurrency || companyCurrency,
            companyTimezone,
            companyCurrency,
            branchId: branch?.branchId || effectiveBranchId,
            branchName: branch?.name || effectiveBranchName,
            branchTimezone,
            branchCurrency,
            branch,
        };
    }
    async register(dto) {
        const normalizedEmail = dto.email.toLowerCase().trim();
        const existingIdentity = await this.masterIdentityModel
            .findOne({ normalizedEmail })
            .lean();
        if (existingIdentity) {
            throw new common_1.ConflictException('An account with this email address already exists');
        }
        if (dto.type === register_dto_1.RegistrationType.COMPANY) {
            return this.registerCompany(dto, normalizedEmail);
        }
        else {
            return this.registerEmployee(dto);
        }
    }
    async registerCompany(dto, normalizedEmail) {
        const country = dto.country ? dto.country.toUpperCase().trim() : 'US';
        const shard = sharding_config_1.shardingConfig.getShardForCountry(dto.region || country);
        const region = shard.name;
        const companyId = `comp_${(0, crypto_1.randomUUID)()}`;
        const userId = `usr_${(0, crypto_1.randomUUID)()}`;
        const roleId = `role_${(0, crypto_1.randomUUID)()}`;
        const employeeId = `emp_${(0, crypto_1.randomUUID)()}`;
        const passwordHash = await this.passwordService.hash(dto.password);
        const displayName = `${dto.firstName.trim()} ${dto.lastName.trim()}`;
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const verificationCodeExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
        await this.masterIdentityModel.create({
            userId,
            email: dto.email.trim(),
            normalizedEmail,
            companyId,
            region,
            databaseCluster: 'primary',
            status: master_schema_1.AccountStatus.ACTIVE,
            isEmailVerified: false,
            verificationCode,
            verificationCodeExpiresAt,
            lastLoginAt: new Date(),
        });
        try {
            const companyModel = await this.regionalDbManager.getModel(region, company_schema_1.Company.name, company_schema_1.CompanySchema);
            const roleModel = await this.regionalDbManager.getModel(region, role_schema_1.Role.name, role_schema_1.RoleSchema);
            const userModel = await this.regionalDbManager.getModel(region, user_schema_1.User.name, user_schema_1.UserSchema);
            const employeeModel = await this.regionalDbManager.getModel(region, employee_schema_1.Employee.name, employee_schema_1.EmployeeSchema);
            const trialEndsAt = new Date();
            trialEndsAt.setDate(trialEndsAt.getDate() + 30);
            const company = await companyModel.create({
                companyId,
                name: dto.companyName || 'My Company',
                email: normalizedEmail,
                phone: dto.companyPhone,
                registrationNumber: dto.registrationNumber,
                website: dto.website,
                industry: dto.industry || 'Technology',
                companySize: dto.companySize || '1-10',
                logoUrl: dto.logoUrl,
                country: dto.country || 'PK',
                city: dto.city,
                state: dto.state,
                postalCode: dto.postalCode,
                address: dto.address,
                region,
                timezone: dto.timezone || 'Asia/Karachi',
                currency: dto.currency || 'USD',
                ownerId: userId,
                workingHours: {
                    enabled: true,
                    startTime: '09:00',
                    endTime: '18:00',
                    workingDays: [1, 2, 3, 4, 5],
                    loginRestriction: false,
                },
                subscription: {
                    plan: company_schema_1.SubscriptionPlan.FREE_TRIAL,
                    status: company_schema_1.SubscriptionStatus.TRIALING,
                    trialEndsAt,
                },
            });
            await roleModel.create({
                companyId,
                name: roles_constant_1.ROLES.OWNER,
                description: 'Company Creator & Full Administrative Access',
                isSystem: true,
                permissions: permissions_constant_1.ALL_PERMISSIONS,
            });
            await roleModel.create([
                {
                    companyId,
                    name: roles_constant_1.ROLES.ADMIN,
                    description: 'Company Administrator',
                    isSystem: true,
                    permissions: permissions_constant_1.ALL_PERMISSIONS.filter((p) => !p.startsWith('company.settings.')),
                },
                {
                    companyId,
                    name: roles_constant_1.ROLES.EMPLOYEE,
                    description: 'Standard Team Member',
                    isSystem: true,
                    permissions: [
                        'leave.view',
                        'leave.create',
                        'attendance.view',
                        'attendance.create',
                        'tasks.view',
                        'messages.view',
                        'messages.create',
                        'meetings.view',
                        'notifications.view',
                    ],
                },
            ]);
            const tokens = await this.tokenService.generateTokens({
                userId,
                email: normalizedEmail,
                companyId,
                region,
                role: roles_constant_1.ROLES.OWNER,
                permissions: permissions_constant_1.ALL_PERMISSIONS,
                isOwner: true,
            });
            const hashedRefreshToken = await this.tokenService.hashRefreshToken(tokens.refreshToken);
            const user = await userModel.create({
                userId,
                companyId,
                region,
                email: dto.email.trim(),
                normalizedEmail,
                passwordHash,
                firstName: dto.firstName.trim(),
                lastName: dto.lastName.trim(),
                displayName,
                roleId,
                roleName: roles_constant_1.ROLES.OWNER,
                permissions: permissions_constant_1.ALL_PERMISSIONS,
                isOwner: true,
                status: master_schema_1.AccountStatus.ACTIVE,
                isEmailVerified: false,
                hashedRefreshToken,
                tokenVersion: 1,
                lastLoginAt: new Date(),
            });
            await employeeModel.create({
                employeeId,
                companyId,
                userId,
                firstName: dto.firstName.trim(),
                lastName: dto.lastName.trim(),
                email: normalizedEmail,
                phone: dto.companyPhone,
                designation: 'Chief Executive Officer',
                employmentType: employee_schema_1.EmploymentType.FULL_TIME,
                status: employee_schema_1.EmployeeStatus.ACTIVE,
                joiningDate: new Date(),
            });
            this.mailService
                .sendVerificationCodeEmail(normalizedEmail, {
                name: displayName,
                companyName: company.name,
                code: verificationCode,
                expiresInMinutes: 15,
            })
                .catch((err) => this.logger.error(`Failed to send verification email: ${err.message}`));
            this.logger.log(`Registered company [${company.name}] (ID: ${companyId}) in region [${region}]`);
            return {
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                expiresIn: tokens.expiresIn,
                user: {
                    userId: user.userId,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    displayName: user.displayName,
                    avatarUrl: user.avatarUrl,
                    roleName: user.roleName,
                    permissions: user.permissions,
                    isOwner: user.isOwner,
                    status: user.status,
                    isEmailVerified: false,
                },
                company: {
                    companyId: company.companyId,
                    name: company.name,
                    region: company.region,
                    timezone: company.timezone,
                    currency: company.currency,
                    logoUrl: company.logoUrl,
                    subscription: {
                        plan: company.subscription.plan,
                        status: company.subscription.status,
                        trialEndsAt: company.subscription.trialEndsAt,
                    },
                },
            };
        }
        catch (err) {
            await this.masterIdentityModel.deleteOne({ userId }).catch(() => { });
            this.logger.error(`Failed to complete registration for [${normalizedEmail}], rolled back master identity: ${err instanceof Error ? err.message : String(err)}`);
            throw err;
        }
    }
    async findEmployeeByInvitation(token, email, preferredRegion) {
        if (!token || !email) {
            throw new common_1.BadRequestException('Invitation token and email are required');
        }
        const normalizedEmail = email.toLowerCase().trim();
        const regionsToCheck = preferredRegion &&
            Object.values(regions_constant_1.REGIONS).includes(preferredRegion)
            ? [
                preferredRegion,
                ...Object.values(regions_constant_1.REGIONS).filter((r) => r !== preferredRegion),
            ]
            : Object.values(regions_constant_1.REGIONS);
        for (const region of regionsToCheck) {
            const empModel = await this.regionalDbManager.getModel(region, employee_schema_1.Employee.name, employee_schema_1.EmployeeSchema);
            const employee = await empModel.findOne({
                email: normalizedEmail,
                status: employee_schema_1.EmployeeStatus.INVITED,
            });
            if (employee && employee.invitationTokenHash) {
                const matches = await this.passwordService.verify(employee.invitationTokenHash, token);
                if (matches) {
                    if (employee.invitationExpiresAt &&
                        employee.invitationExpiresAt < new Date()) {
                        throw new common_1.UnauthorizedException('Invitation link has expired. Please contact your company administrator.');
                    }
                    return { employee, region };
                }
            }
        }
        throw new common_1.UnauthorizedException('Invalid or expired invitation token. Please check your invitation link.');
    }
    async validateInvitation(token, email, preferredRegion) {
        const { employee, region } = await this.findEmployeeByInvitation(token, email, preferredRegion);
        const companyModel = await this.regionalDbManager.getModel(region, company_schema_1.Company.name, company_schema_1.CompanySchema);
        const company = await companyModel
            .findOne({ companyId: employee.companyId })
            .lean();
        const formModel = await this.regionalDbManager.getModel(region, onboarding_form_schema_1.OnboardingFormTemplate.name, onboarding_form_schema_1.OnboardingFormTemplateSchema);
        let activeForm = null;
        if (employee.branchId && employee.departmentId) {
            activeForm = await formModel
                .findOne({
                companyId: employee.companyId,
                branchId: employee.branchId,
                departmentId: employee.departmentId,
            })
                .lean();
        }
        if (!activeForm && employee.branchId) {
            activeForm = await formModel
                .findOne({
                companyId: employee.companyId,
                branchId: employee.branchId,
            })
                .lean();
        }
        if (!activeForm) {
            activeForm = await formModel
                .findOne({ companyId: employee.companyId, isDefault: true })
                .lean();
        }
        if (!activeForm) {
            activeForm = await formModel
                .findOne({ companyId: employee.companyId })
                .lean();
        }
        return {
            valid: true,
            email: employee.email,
            firstName: employee.firstName,
            lastName: employee.lastName,
            companyName: company?.name || 'WorkivLab Workspace',
            designation: employee.designation,
            departmentName: employee.departmentName || 'General',
            branchName: employee.branchName,
            branchId: employee.branchId,
            departmentId: employee.departmentId,
            region,
            companyId: employee.companyId,
            customFieldsTemplate: activeForm?.fields || [],
            onboardingConfig: company?.onboardingConfig || {
                requireCnic: false,
                requireAddress: false,
                requireBankDetails: false,
            },
        };
    }
    async registerEmployee(dto) {
        if (!dto.invitationToken) {
            throw new common_1.UnauthorizedException('Invitation token is required for employee account creation');
        }
        const { employee, region } = await this.findEmployeeByInvitation(dto.invitationToken, dto.email);
        const normalizedEmail = dto.email.toLowerCase().trim();
        const existingIdentity = await this.masterIdentityModel.findOne({
            normalizedEmail,
            status: master_schema_1.AccountStatus.ACTIVE,
        });
        if (existingIdentity) {
            throw new common_1.ConflictException('An active account with this corporate email already exists');
        }
        const companyModel = await this.regionalDbManager.getModel(region, company_schema_1.Company.name, company_schema_1.CompanySchema);
        const company = await companyModel.findOne({
            companyId: employee.companyId,
        });
        if (!company) {
            throw new common_1.NotFoundException('Company profile not found in designated region');
        }
        if (company.onboardingConfig?.requireCnic && !dto.cnic) {
            throw new common_1.BadRequestException('CNIC is required by company policy');
        }
        if (company.onboardingConfig?.requireAddress && !dto.address) {
            throw new common_1.BadRequestException('Address is required by company policy');
        }
        if (company.onboardingConfig?.requireBankDetails &&
            (!dto.bankDetails || !dto.bankDetails.accountNumber)) {
            throw new common_1.BadRequestException('Bank account details are required by company policy');
        }
        const passwordHash = await this.passwordService.hash(dto.password);
        const userId = employee.userId || `usr_${(0, crypto_1.randomUUID)()}`;
        const userModel = await this.regionalDbManager.getModel(region, user_schema_1.User.name, user_schema_1.UserSchema);
        const empModel = await this.regionalDbManager.getModel(region, employee_schema_1.Employee.name, employee_schema_1.EmployeeSchema);
        const firstName = (dto.firstName || employee.firstName || '').trim();
        const lastName = (dto.lastName || employee.lastName || '').trim();
        const displayName = `${firstName} ${lastName}`.trim() || employee.email;
        const roleModel = await this.regionalDbManager.getModel(region, role_schema_1.Role.name, role_schema_1.RoleSchema);
        const roleName = employee.roleName || roles_constant_1.ROLES.EMPLOYEE;
        const roleDoc = await roleModel.findOne({
            companyId: employee.companyId,
            name: roleName,
        });
        const roleId = roleDoc?._id?.toString() || `role_${(0, crypto_1.randomUUID)()}`;
        const tokens = await this.tokenService.generateTokens({
            userId,
            email: employee.email,
            companyId: employee.companyId,
            region,
            role: roleName,
            isOwner: false,
            permissions: employee.permissions || [],
        });
        const hashedRefreshToken = await this.tokenService.hashRefreshToken(tokens.refreshToken);
        const userLocationRegion = dto.userLocationRegion || dto.country || undefined;
        const user = await userModel.create({
            userId,
            companyId: employee.companyId,
            region,
            userLocationRegion,
            email: employee.email,
            normalizedEmail,
            passwordHash,
            firstName,
            lastName,
            displayName,
            roleId,
            roleName,
            permissions: employee.permissions || [],
            isOwner: false,
            isEmailVerified: true,
            status: master_schema_1.AccountStatus.ACTIVE,
            hashedRefreshToken,
            tokenVersion: 1,
            dateOfBirth: dto.dateOfBirth,
            cnic: dto.cnic,
            address: dto.address,
            bankDetails: dto.bankDetails,
            branchId: employee.branchId,
            branchName: employee.branchName,
            lastLoginAt: new Date(),
        });
        await this.masterIdentityModel.findOneAndUpdate({ normalizedEmail }, {
            userId,
            email: employee.email,
            normalizedEmail,
            companyId: employee.companyId,
            role: roleName,
            region,
            userLocationRegion,
            status: master_schema_1.AccountStatus.ACTIVE,
            isEmailVerified: true,
            lastLoginAt: new Date(),
        }, { upsert: true, new: true });
        const employeeUpdate = {
            userId,
            status: employee_schema_1.EmployeeStatus.ACTIVE,
            firstName,
            lastName,
            dateOfBirth: dto.dateOfBirth,
            cnic: dto.cnic,
            address: dto.address,
            bankDetails: dto.bankDetails,
            invitationAcceptedAt: new Date(),
            $unset: { invitationTokenHash: 1, invitationExpiresAt: 1 },
        };
        if (userLocationRegion)
            employeeUpdate.userLocationRegion = userLocationRegion;
        if (dto.customFields)
            employeeUpdate.customFields = dto.customFields;
        if (dto.documents && dto.documents.length > 0)
            employeeUpdate.documents = dto.documents;
        await empModel.updateOne({ _id: employee._id }, employeeUpdate);
        const { accessToken, refreshToken, expiresIn } = tokens;
        const locale = await this.resolveEffectiveLocale(region, company, {
            userId: user.userId,
            email: user.email,
            branchId: employee.branchId,
            branchName: employee.branchName,
        });
        return {
            accessToken,
            refreshToken,
            expiresIn,
            user: {
                userId: user.userId,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                displayName: `${user.firstName} ${user.lastName}`.trim(),
                roleName: user.roleName || 'EMPLOYEE',
                isOwner: false,
                status: user.status || 'ACTIVE',
                isEmailVerified: true,
                permissions: user.permissions || [],
                avatarUrl: user.avatarUrl,
                branchId: locale.branchId,
                branchName: locale.branchName,
                branchTimezone: locale.branchTimezone,
                branchCurrency: locale.branchCurrency,
            },
            company: {
                companyId: company.companyId,
                name: company.name,
                region: company.region,
                timezone: locale.timezone,
                currency: locale.currency,
                companyTimezone: locale.companyTimezone,
                companyCurrency: locale.companyCurrency,
                logoUrl: company.logoUrl,
                subscription: {
                    plan: company.subscription?.plan || 'TRIAL',
                    status: company.subscription?.status || 'TRIALING',
                    trialEndsAt: company.subscription?.trialEndsAt,
                },
            },
        };
    }
    async login(dto) {
        const normalizedEmail = dto.email.toLowerCase().trim();
        const identity = await this.masterIdentityModel
            .findOne({ normalizedEmail })
            .lean();
        if (!identity) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        if (identity.status === master_schema_1.AccountStatus.DEACTIVATED ||
            identity.status === master_schema_1.AccountStatus.SUSPENDED) {
            throw new common_1.ForbiddenException(`Account is currently ${identity.status.toLowerCase()}`);
        }
        const region = identity.region;
        const userModel = await this.regionalDbManager.getModel(region, user_schema_1.User.name, user_schema_1.UserSchema);
        const companyModel = await this.regionalDbManager.getModel(region, company_schema_1.Company.name, company_schema_1.CompanySchema);
        const user = await userModel.findOne({ userId: identity.userId });
        if (!user) {
            throw new common_1.UnauthorizedException('User profile not found in designated regional database');
        }
        const isPasswordValid = await this.passwordService.verify(user.passwordHash, dto.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        const company = await companyModel
            .findOne({ companyId: user.companyId })
            .lean();
        if (!company && !user.isSuperAdmin && normalizedEmail !== 'admin@admin.com') {
            throw new common_1.UnauthorizedException('Associated company workspace could not be found');
        }
        const isSuperAdmin = user.isSuperAdmin || normalizedEmail === 'admin@admin.com' || user.roleName === 'SUPERADMIN';
        if (!isSuperAdmin && company && (company.status === 'INACTIVE' || company.status === 'SUSPENDED')) {
            throw new common_1.ForbiddenException(`Company workspace is currently ${company.status.toLowerCase()}. Please contact Super Admin.`);
        }
        const locale = company
            ? await this.resolveEffectiveLocale(region, company, {
                userId: user.userId,
                email: user.email,
                branchId: user.branchId,
                branchName: user.branchName,
            })
            : {
                timezone: 'UTC',
                currency: 'USD',
                companyTimezone: 'UTC',
                companyCurrency: 'USD',
                branchId: undefined,
                branchName: undefined,
                branchTimezone: undefined,
                branchCurrency: undefined,
                branch: null,
            };
        if (!isSuperAdmin &&
            !user.isOwner &&
            company?.workingHours?.enabled &&
            company?.workingHours?.loginRestriction &&
            !locale.branch?.workingHours?.enforceLoginRestriction) {
            const workingHoursCheck = (0, working_hours_helper_1.validateCompanyWorkingHours)(company.workingHours, locale.timezone);
            if (!workingHoursCheck.allowed) {
                throw new common_1.ForbiddenException({
                    statusCode: 403,
                    code: 'COMPANY_OUTSIDE_WORKING_HOURS',
                    message: workingHoursCheck.message ||
                        'Your company is currently outside its allowed login hours.',
                });
            }
        }
        if (!isSuperAdmin && !user.isOwner && locale.branch?.workingHours?.enforceLoginRestriction) {
            const branch = locale.branch;
            const tz = locale.timezone;
            const now = new Date();
            const dayOfWeek = new Date(now.toLocaleString('en-US', { timeZone: tz })).getDay();
            const workingDays = branch.workingHours.workingDays ?? [1, 2, 3, 4, 5];
            if (!workingDays.includes(dayOfWeek)) {
                throw new common_1.ForbiddenException({
                    statusCode: 403,
                    code: 'BRANCH_OUTSIDE_WORKING_DAYS',
                    message: `Login rejected: Today is not an authorized working day for your assigned branch "${branch.name}".`,
                });
            }
            const timeFormatter = new Intl.DateTimeFormat('en-US', {
                timeZone: tz,
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
            });
            const currentBranchTime = timeFormatter.format(now);
            const start = branch.workingHours.startTime || '09:00';
            const end = branch.workingHours.endTime || '18:00';
            if (currentBranchTime < start || currentBranchTime > end) {
                throw new common_1.ForbiddenException({
                    statusCode: 403,
                    code: 'BRANCH_OUTSIDE_WORKING_HOURS',
                    message: `Login rejected: Outside authorized shift hours (${start} - ${end}) for branch "${branch.name}".`,
                });
            }
        }
        const tokens = await this.tokenService.generateTokens({
            userId: user.userId,
            email: user.email,
            companyId: user.companyId,
            region: user.region,
            role: user.roleName,
            permissions: user.permissions,
            isOwner: user.isOwner,
            isSuperAdmin,
        }, user.tokenVersion);
        const hashedRefreshToken = await this.tokenService.hashRefreshToken(tokens.refreshToken);
        user.hashedRefreshToken = hashedRefreshToken;
        user.lastLoginAt = new Date();
        await user.save();
        await this.masterIdentityModel.updateOne({ userId: identity.userId }, { lastLoginAt: new Date() });
        const safeCompany = company || {
            companyId: user.companyId || 'superadmin_workspace',
            name: 'Super Admin System',
            region: user.region || 'PK',
            timezone: 'UTC',
            currency: 'USD',
            logoUrl: undefined,
            subscription: {
                plan: company_schema_1.SubscriptionPlan.FREE_TRIAL,
                status: company_schema_1.SubscriptionStatus.TRIALING,
                trialEndsAt: undefined,
            },
        };
        return {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresIn: tokens.expiresIn,
            user: {
                userId: user.userId,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                displayName: user.displayName,
                avatarUrl: user.avatarUrl,
                roleName: user.roleName,
                permissions: user.permissions,
                isOwner: user.isOwner,
                isSuperAdmin: !!isSuperAdmin,
                status: user.status,
                branchId: locale.branchId,
                branchName: locale.branchName,
                branchTimezone: locale.branchTimezone,
                branchCurrency: locale.branchCurrency,
            },
            company: {
                companyId: safeCompany.companyId,
                name: safeCompany.name,
                region: safeCompany.region,
                timezone: locale.timezone,
                currency: locale.currency,
                companyTimezone: locale.companyTimezone,
                companyCurrency: locale.companyCurrency,
                logoUrl: safeCompany.logoUrl,
                subscription: {
                    plan: safeCompany.subscription?.plan || company_schema_1.SubscriptionPlan.FREE_TRIAL,
                    status: safeCompany.subscription?.status || company_schema_1.SubscriptionStatus.TRIALING,
                    trialEndsAt: safeCompany.subscription?.trialEndsAt,
                },
            },
        };
    }
    async refresh(dto) {
        const payload = await this.tokenService.verifyRefreshToken(dto.refreshToken);
        const userModel = await this.regionalDbManager.getModel(payload.region, user_schema_1.User.name, user_schema_1.UserSchema);
        const user = await userModel.findOne({ userId: payload.userId });
        if (!user) {
            throw new common_1.UnauthorizedException('User session not found');
        }
        if (user.tokenVersion !== payload.tokenVersion) {
            user.tokenVersion += 1;
            user.hashedRefreshToken = undefined;
            await user.save();
            throw new common_1.UnauthorizedException('Compromised refresh token detected. All active sessions have been revoked.');
        }
        if (!user.hashedRefreshToken) {
            throw new common_1.UnauthorizedException('Session has expired or was revoked');
        }
        const matches = await this.tokenService.verifyHashedRefreshToken(user.hashedRefreshToken, dto.refreshToken);
        if (!matches) {
            user.tokenVersion += 1;
            user.hashedRefreshToken = undefined;
            await user.save();
            throw new common_1.UnauthorizedException('Compromised refresh token detected. All active sessions have been revoked.');
        }
        const tokens = await this.tokenService.generateTokens({
            userId: user.userId,
            email: user.email,
            companyId: user.companyId,
            region: user.region,
            role: user.roleName,
            permissions: user.permissions,
            isOwner: user.isOwner,
        }, user.tokenVersion);
        user.hashedRefreshToken = await this.tokenService.hashRefreshToken(tokens.refreshToken);
        await user.save();
        return tokens;
    }
    async logout(userPayload) {
        const lastSeen = new Date();
        const userModel = await this.regionalDbManager.getModel(userPayload.region, user_schema_1.User.name, user_schema_1.UserSchema);
        const empModel = await this.regionalDbManager.getModel(userPayload.region, employee_schema_1.Employee.name, employee_schema_1.EmployeeSchema);
        await userModel.updateOne({ userId: userPayload.userId }, {
            $unset: { hashedRefreshToken: 1 },
            $inc: { tokenVersion: 1 },
            $set: { isOnline: false, lastSeen },
        });
        await empModel.updateOne({ userId: userPayload.userId }, { $set: { isOnline: false, lastSeen } });
        return { success: true, message: 'Logged out successfully' };
    }
    async getCurrentSession(userPayload) {
        const userModel = await this.regionalDbManager.getModel(userPayload.region, user_schema_1.User.name, user_schema_1.UserSchema);
        const companyModel = await this.regionalDbManager.getModel(userPayload.region, company_schema_1.Company.name, company_schema_1.CompanySchema);
        const user = await userModel.findOne({ userId: userPayload.userId }).lean();
        if (!user) {
            throw new common_1.NotFoundException('User profile not found');
        }
        const company = await companyModel
            .findOne({ companyId: userPayload.companyId })
            .lean();
        if (!company) {
            throw new common_1.NotFoundException('Company profile not found');
        }
        const locale = await this.resolveEffectiveLocale(userPayload.region, company, {
            userId: user.userId,
            email: user.email,
            branchId: user.branchId,
            branchName: user.branchName,
        });
        return {
            accessToken: '',
            refreshToken: '',
            expiresIn: '',
            user: {
                userId: user.userId,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                displayName: user.displayName,
                avatarUrl: user.avatarUrl,
                phone: user.phone,
                address: user.address,
                dateOfBirth: user.dateOfBirth,
                cnic: user.cnic,
                bankDetails: user.bankDetails,
                roleName: user.roleName,
                permissions: user.permissions,
                isOwner: user.isOwner,
                status: user.status,
                branchId: locale.branchId,
                branchName: locale.branchName,
                branchTimezone: locale.branchTimezone,
                branchCurrency: locale.branchCurrency,
            },
            company: {
                companyId: company.companyId,
                name: company.name,
                region: company.region,
                timezone: locale.timezone,
                currency: locale.currency,
                companyTimezone: locale.companyTimezone,
                companyCurrency: locale.companyCurrency,
                logoUrl: company.logoUrl,
                subscription: {
                    plan: company.subscription?.plan || company_schema_1.SubscriptionPlan.FREE_TRIAL,
                    status: company.subscription?.status || company_schema_1.SubscriptionStatus.TRIALING,
                    trialEndsAt: company.subscription?.trialEndsAt,
                },
            },
        };
    }
    async updateProfile(userPayload, dto) {
        const userModel = await this.regionalDbManager.getModel(userPayload.region, user_schema_1.User.name, user_schema_1.UserSchema);
        const empModel = await this.regionalDbManager.getModel(userPayload.region, employee_schema_1.Employee.name, employee_schema_1.EmployeeSchema);
        const updateFields = {};
        if (dto.firstName !== undefined)
            updateFields.firstName = dto.firstName.trim();
        if (dto.lastName !== undefined)
            updateFields.lastName = dto.lastName.trim();
        if (dto.firstName !== undefined || dto.lastName !== undefined) {
            const existingUser = await userModel.findOne({ userId: userPayload.userId }).lean();
            const fn = dto.firstName !== undefined ? dto.firstName.trim() : (existingUser?.firstName || '');
            const ln = dto.lastName !== undefined ? dto.lastName.trim() : (existingUser?.lastName || '');
            updateFields.displayName = `${fn} ${ln}`.trim();
        }
        if (dto.avatarUrl !== undefined)
            updateFields.avatarUrl = dto.avatarUrl.trim();
        if (dto.phone !== undefined)
            updateFields.phone = dto.phone.trim();
        if (dto.address !== undefined)
            updateFields.address = dto.address.trim();
        if (dto.dateOfBirth !== undefined)
            updateFields.dateOfBirth = dto.dateOfBirth;
        if (dto.cnic !== undefined)
            updateFields.cnic = dto.cnic.trim();
        if (dto.bankDetails !== undefined)
            updateFields.bankDetails = dto.bankDetails;
        await userModel.updateOne({ userId: userPayload.userId }, { $set: updateFields });
        const empUpdate = {};
        if (updateFields.firstName)
            empUpdate.firstName = updateFields.firstName;
        if (updateFields.lastName)
            empUpdate.lastName = updateFields.lastName;
        if (updateFields.avatarUrl)
            empUpdate.avatarUrl = updateFields.avatarUrl;
        if (updateFields.phone)
            empUpdate.phone = updateFields.phone;
        if (updateFields.address)
            empUpdate.address = updateFields.address;
        if (updateFields.dateOfBirth)
            empUpdate.dateOfBirth = updateFields.dateOfBirth;
        if (updateFields.cnic)
            empUpdate.cnic = updateFields.cnic;
        if (updateFields.bankDetails)
            empUpdate.bankDetails = updateFields.bankDetails;
        if (Object.keys(empUpdate).length > 0) {
            await empModel.updateOne({ $or: [{ userId: userPayload.userId }, { email: userPayload.email }] }, { $set: empUpdate });
        }
        return this.getCurrentSession(userPayload);
    }
    async verifyEmail(dto) {
        const normalizedEmail = dto.email.toLowerCase().trim();
        const identity = await this.masterIdentityModel.findOne({
            normalizedEmail,
        });
        if (!identity) {
            throw new common_1.NotFoundException('Account not found');
        }
        if (identity.isEmailVerified) {
            return this.getSessionForIdentity(identity);
        }
        if (!identity.verificationCode ||
            identity.verificationCode !== dto.code.trim()) {
            throw new common_1.BadRequestException('Invalid verification code');
        }
        if (identity.verificationCodeExpiresAt &&
            new Date() > identity.verificationCodeExpiresAt) {
            throw new common_1.BadRequestException('Verification code has expired. Please request a new code.');
        }
        identity.isEmailVerified = true;
        identity.status = master_schema_1.AccountStatus.ACTIVE;
        identity.verificationCode = undefined;
        identity.verificationCodeExpiresAt = undefined;
        await identity.save();
        const userModel = await this.regionalDbManager.getModel(identity.region, user_schema_1.User.name, user_schema_1.UserSchema);
        await userModel.updateOne({ userId: identity.userId }, { isEmailVerified: true, status: master_schema_1.AccountStatus.ACTIVE });
        return this.getSessionForIdentity(identity);
    }
    async resendVerificationCode(dto) {
        const normalizedEmail = dto.email.toLowerCase().trim();
        const identity = await this.masterIdentityModel.findOne({
            normalizedEmail,
        });
        if (!identity) {
            throw new common_1.NotFoundException('Account not found');
        }
        if (identity.isEmailVerified) {
            return { success: true, message: 'Email address is already verified' };
        }
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const verificationCodeExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
        identity.verificationCode = verificationCode;
        identity.verificationCodeExpiresAt = verificationCodeExpiresAt;
        await identity.save();
        const companyModel = await this.regionalDbManager.getModel(identity.region, company_schema_1.Company.name, company_schema_1.CompanySchema);
        const company = await companyModel
            .findOne({ companyId: identity.companyId })
            .lean();
        const userModel = await this.regionalDbManager.getModel(identity.region, user_schema_1.User.name, user_schema_1.UserSchema);
        const user = await userModel.findOne({ userId: identity.userId }).lean();
        const name = user ? user.displayName : 'Workspace Member';
        await this.mailService.sendVerificationCodeEmail(normalizedEmail, {
            name,
            companyName: company?.name || 'WorkivLab',
            code: verificationCode,
            expiresInMinutes: 15,
        });
        return { success: true, message: 'Verification code resent successfully' };
    }
    async getSessionForIdentity(identity) {
        const userModel = await this.regionalDbManager.getModel(identity.region, user_schema_1.User.name, user_schema_1.UserSchema);
        const companyModel = await this.regionalDbManager.getModel(identity.region, company_schema_1.Company.name, company_schema_1.CompanySchema);
        const user = await userModel.findOne({ userId: identity.userId }).lean();
        if (!user)
            throw new common_1.NotFoundException('User profile not found');
        const company = await companyModel
            .findOne({ companyId: identity.companyId })
            .lean();
        if (!company)
            throw new common_1.NotFoundException('Company profile not found');
        const tokens = await this.tokenService.generateTokens({
            userId: user.userId,
            email: user.normalizedEmail,
            companyId: user.companyId,
            region: user.region,
            role: user.roleName,
            permissions: user.permissions,
            isOwner: user.isOwner,
        });
        const hashedRefreshToken = await this.tokenService.hashRefreshToken(tokens.refreshToken);
        await userModel.updateOne({ userId: user.userId }, { hashedRefreshToken, lastLoginAt: new Date() });
        return {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresIn: tokens.expiresIn,
            user: {
                userId: user.userId,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                displayName: user.displayName,
                avatarUrl: user.avatarUrl,
                roleName: user.roleName,
                permissions: user.permissions,
                isOwner: user.isOwner,
                status: user.status,
                isEmailVerified: identity.isEmailVerified,
            },
            company: {
                companyId: company.companyId,
                name: company.name,
                region: company.region,
                timezone: company.timezone,
                currency: company.currency,
                logoUrl: company.logoUrl,
                subscription: {
                    plan: company.subscription?.plan || company_schema_1.SubscriptionPlan.FREE_TRIAL,
                    status: company.subscription?.status || company_schema_1.SubscriptionStatus.TRIALING,
                    trialEndsAt: company.subscription?.trialEndsAt,
                },
            },
        };
    }
    async forgotPassword(email) {
        const normalizedEmail = email.toLowerCase().trim();
        const identity = await this.masterIdentityModel.findOne({ normalizedEmail });
        if (!identity) {
            return {
                success: true,
                message: 'If an account exists with this email, a 6-digit OTP has been sent.',
            };
        }
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = await this.passwordService.hash(otp);
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
        await this.masterIdentityModel.updateOne({ normalizedEmail }, {
            passwordResetOtpHash: otpHash,
            passwordResetOtpExpiresAt: expiresAt,
        });
        const userModel = await this.regionalDbManager.getModel(identity.region, user_schema_1.User.name, user_schema_1.UserSchema);
        const user = await userModel.findOne({ userId: identity.userId }).lean();
        const name = user ? user.displayName : 'Team Member';
        await this.mailService.sendPasswordResetOtpEmail(normalizedEmail, {
            name,
            code: otp,
            expiresInMinutes: 15,
        });
        return {
            success: true,
            message: 'A 6-digit OTP has been sent to your email address.',
        };
    }
    async verifyPasswordResetOtp(email, otp) {
        const normalizedEmail = email.toLowerCase().trim();
        const identity = await this.masterIdentityModel.findOne({ normalizedEmail });
        if (!identity || !identity.passwordResetOtpHash || !identity.passwordResetOtpExpiresAt) {
            throw new common_1.BadRequestException('Invalid or expired OTP request');
        }
        if (new Date() > identity.passwordResetOtpExpiresAt) {
            throw new common_1.BadRequestException('The OTP code has expired. Please request a new one.');
        }
        const isValid = await this.passwordService.verify(identity.passwordResetOtpHash, otp.trim());
        if (!isValid) {
            throw new common_1.BadRequestException('Invalid verification code');
        }
        return { success: true, valid: true };
    }
    async resetPassword(dto) {
        await this.verifyPasswordResetOtp(dto.email, dto.otp);
        const normalizedEmail = dto.email.toLowerCase().trim();
        const identity = await this.masterIdentityModel.findOne({ normalizedEmail });
        if (!identity)
            throw new common_1.NotFoundException('Account identity not found');
        const newPasswordHash = await this.passwordService.hash(dto.newPassword);
        const userModel = await this.regionalDbManager.getModel(identity.region, user_schema_1.User.name, user_schema_1.UserSchema);
        await userModel.updateOne({ userId: identity.userId }, { passwordHash: newPasswordHash, updatedAt: new Date() });
        await this.masterIdentityModel.updateOne({ normalizedEmail }, {
            $unset: {
                passwordResetOtpHash: 1,
                passwordResetOtpExpiresAt: 1,
            },
        });
        return {
            success: true,
            message: 'Password reset successfully. You may now sign in with your new password.',
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(master_schema_1.MasterIdentity.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        regional_database_manager_1.RegionalDatabaseManager,
        password_service_1.PasswordService,
        token_service_1.TokenService,
        mail_service_1.MailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map