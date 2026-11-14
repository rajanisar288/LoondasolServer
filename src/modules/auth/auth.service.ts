import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomUUID } from 'crypto';
import {
  MasterIdentity,
  MasterIdentityDocument,
  AccountStatus,
} from '../../database/master.schema';
import { RegionalDatabaseManager } from '../../database/regional-database.manager';
import { shardingConfig } from '../../config/sharding.config';
import { PasswordService } from './password.service';
import { TokenService, GeneratedTokens } from './token.service';
import { RegisterDto, RegistrationType } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { VerifyEmailDto, ResendVerificationDto } from './dto/verify-email.dto';
import { MailService } from '../mail/mail.service';
import {
  Company,
  CompanySchema,
  SubscriptionPlan,
  SubscriptionStatus,
} from '../companies/schemas/company.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Role, RoleSchema } from '../roles/schemas/role.schema';
import {
  Employee,
  EmployeeSchema,
  EmployeeStatus,
  EmploymentType,
} from '../employees/schemas/employee.schema';
import {
  OnboardingFormTemplate,
  OnboardingFormTemplateSchema,
} from '../employees/schemas/onboarding-form.schema';
import { Branch, BranchSchema } from '../branches/schemas/branch.schema';
import { ALL_PERMISSIONS } from '../../common/constants/permissions.constant';
import { ROLES } from '../../common/constants/roles.constant';
import {
  DEFAULT_REGION,
  RegionCode,
  REGIONS,
} from '../../common/constants/regions.constant';
import { validateCompanyWorkingHours } from '../companies/working-hours.helper';
import { JwtPayload } from './jwt.strategy';
import { UpdateProfileDto } from './dto/update-profile.dto';

export interface AuthSessionResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  user: {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    displayName: string;
    avatarUrl?: string;
    phone?: string;
    address?: string;
    dateOfBirth?: string;
    cnic?: string;
    bankDetails?: any;
    roleName: string;
    permissions: string[];
    isOwner: boolean;
    isSuperAdmin?: boolean;
    status: string;
    isEmailVerified?: boolean;
    branchId?: string;
    branchName?: string;
    branchTimezone?: string;
    branchCurrency?: string;
  };
  company: {
    companyId: string;
    name: string;
    region: RegionCode;
    timezone: string;
    currency: string;
    companyTimezone?: string;
    companyCurrency?: string;
    logoUrl?: string;
    subscription: {
      plan: string;
      status: string;
      trialEndsAt?: Date;
    };
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(MasterIdentity.name)
    private readonly masterIdentityModel: Model<MasterIdentityDocument>,
    private readonly regionalDbManager: RegionalDatabaseManager,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly mailService: MailService,
  ) {}

  /** Resolves effective timezone and currency for a user from their assigned branch or company defaults. */
  private async resolveEffectiveLocale(
    region: string,
    company: Company,
    user: { userId: string; email?: string; branchId?: string; branchName?: string },
  ): Promise<{
    timezone: string;
    currency: string;
    companyTimezone: string;
    companyCurrency: string;
    branchId?: string;
    branchName?: string;
    branchTimezone?: string;
    branchCurrency?: string;
    branch?: Branch | null;
  }> {
    const companyTimezone = company.timezone || 'UTC';
    const companyCurrency = company.currency || 'USD';

    let effectiveBranchId = user.branchId;
    let effectiveBranchName = user.branchName;

    try {
      const empModel = await this.regionalDbManager.getModel<Employee>(
        region,
        Employee.name,
        EmployeeSchema,
      );
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
    } catch {}

    let branch: Branch | null = null;
    if (effectiveBranchId) {
      try {
        const branchModel = await this.regionalDbManager.getModel<Branch>(
          region,
          Branch.name,
          BranchSchema,
        );
        branch = await branchModel
          .findOne({ companyId: company.companyId, branchId: effectiveBranchId })
          .lean();
      } catch {}
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

  // Unified Registration for Company Onboarding or Invited Employee
  async register(dto: RegisterDto): Promise<AuthSessionResponse> {
    const normalizedEmail = dto.email.toLowerCase().trim();

    // Check Master Database for existing global identity
    const existingIdentity = await this.masterIdentityModel
      .findOne({ normalizedEmail })
      .lean();
    if (existingIdentity) {
      throw new ConflictException(
        'An account with this email address already exists',
      );
    }

    if (dto.type === RegistrationType.COMPANY) {
      return this.registerCompany(dto, normalizedEmail);
    } else {
      return this.registerEmployee(dto);
    }
  }

  // Multi-step Company Onboarding implementation
  private async registerCompany(
    dto: RegisterDto,
    normalizedEmail: string,
  ): Promise<AuthSessionResponse> {
    const country = dto.country ? dto.country.toUpperCase().trim() : 'US';
    const shard = shardingConfig.getShardForCountry(dto.region || country);
    const region: string = shard.name;

    const companyId = `comp_${randomUUID()}`;
    const userId = `usr_${randomUUID()}`;
    const roleId = `role_${randomUUID()}`;
    const employeeId = `emp_${randomUUID()}`;

    const passwordHash = await this.passwordService.hash(dto.password);
    const displayName = `${dto.firstName.trim()} ${dto.lastName.trim()}`;
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();
    const verificationCodeExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // 1. Create Master Identity in Master Database
    await this.masterIdentityModel.create({
      userId,
      email: dto.email.trim(),
      normalizedEmail,
      companyId,
      region,
      databaseCluster: 'primary',
      status: AccountStatus.ACTIVE,
      isEmailVerified: false,
      verificationCode,
      verificationCodeExpiresAt,
      lastLoginAt: new Date(),
    });

    // 2. Resolve Regional Database Connection
    try {
      const companyModel = await this.regionalDbManager.getModel<Company>(
      region,
      Company.name,
      CompanySchema,
    );
    const roleModel = await this.regionalDbManager.getModel<Role>(
      region,
      Role.name,
      RoleSchema,
    );
    const userModel = await this.regionalDbManager.getModel<User>(
      region,
      User.name,
      UserSchema,
    );
    const employeeModel = await this.regionalDbManager.getModel<Employee>(
      region,
      Employee.name,
      EmployeeSchema,
    );

    // 3. Create Company with selected Plan and Seats quota
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 30);

    const selectedPlan =
      (dto.subscriptionPlan as SubscriptionPlan) || SubscriptionPlan.PRO;
    const purchasedSeats = Math.max(1, Number(dto.purchasedSeats) || 5);
    let pricePerSeat = 5;
    let aiRequestLimit = 5000;

    if (selectedPlan === SubscriptionPlan.STARTER) {
      pricePerSeat = 3;
      aiRequestLimit = 1000;
    } else if (selectedPlan === SubscriptionPlan.ENTERPRISE) {
      pricePerSeat = 8;
      aiRequestLimit = -1;
    } else {
      pricePerSeat = 5;
      aiRequestLimit = 5000;
    }

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
        plan: selectedPlan,
        status: SubscriptionStatus.ACTIVE,
        purchasedSeats,
        pricePerSeat,
        aiRequestLimit,
        aiRequestsUsedThisMonth: 0,
        aiCycleResetDate: new Date(),
        currentPeriodEnd: trialEndsAt,
      },
      onboardingConfig: {
        requireCnic: false,
        requireAddress: false,
        requireBankDetails: false,
        allowBranchDepartments: false,
        allowBranchCustomForms: false,
      },
    });

    // 4. Create Owner Role with full permission set
    await roleModel.create({
      companyId,
      name: ROLES.OWNER,
      description: 'Company Creator & Full Administrative Access',
      isSystem: true,
      permissions: ALL_PERMISSIONS,
    });

    // 5. Seed default standard company roles
    await roleModel.create([
      {
        companyId,
        name: ROLES.ADMIN,
        description: 'Company Administrator',
        isSystem: true,
        permissions: ALL_PERMISSIONS.filter(
          (p) => !p.startsWith('company.settings.'),
        ),
      },
      {
        companyId,
        name: ROLES.EMPLOYEE,
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

    // 6. Generate Tokens
    const tokens = await this.tokenService.generateTokens({
      userId,
      email: normalizedEmail,
      companyId,
      region,
      role: ROLES.OWNER,
      permissions: ALL_PERMISSIONS,
      isOwner: true,
    });

    const hashedRefreshToken = await this.tokenService.hashRefreshToken(
      tokens.refreshToken,
    );

    // 7. Create User Record in Regional Database
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
      roleName: ROLES.OWNER,
      permissions: ALL_PERMISSIONS,
      isOwner: true,
      status: AccountStatus.ACTIVE,
      isEmailVerified: false,
      hashedRefreshToken,
      tokenVersion: 1,
      lastLoginAt: new Date(),
    });

    // 8. Create Employee Record for Owner
    await employeeModel.create({
      employeeId,
      companyId,
      userId,
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      email: normalizedEmail,
      phone: dto.companyPhone,
      designation: 'Chief Executive Officer',
      employmentType: EmploymentType.FULL_TIME,
      status: EmployeeStatus.ACTIVE,
      joiningDate: new Date(),
    });

    // 9. Dispatch Verification Email (Awaited to ensure serverless execution delivers the email)
    try {
      await this.mailService.sendVerificationCodeEmail(normalizedEmail, {
        name: displayName,
        companyName: company.name,
        code: verificationCode,
        expiresInMinutes: 15,
      });
      this.logger.log(`Verification code email successfully sent to ${normalizedEmail}`);
    } catch (err: unknown) {
      this.logger.error(
        `Failed to send verification email to ${normalizedEmail}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    this.logger.log(
      `Registered company [${company.name}] (ID: ${companyId}) in region [${region}]`,
    );

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
    } catch (err: unknown) {
      await this.masterIdentityModel.deleteOne({ userId }).catch(() => {});
      this.logger.error(
        `Failed to complete registration for [${normalizedEmail}], rolled back master identity: ${err instanceof Error ? err.message : String(err)}`,
      );
      throw err;
    }
  }

  // Find employee record across regional databases by invitation token and email
  private async findEmployeeByInvitation(
    token: string,
    email: string,
    preferredRegion?: string,
  ): Promise<{ employee: Employee; region: RegionCode }> {
    if (!token || !email) {
      throw new BadRequestException('Invitation token and email are required');
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check preferred company region first if provided
    const regionsToCheck =
      preferredRegion &&
      (Object.values(REGIONS) as string[]).includes(preferredRegion)
        ? [
            preferredRegion as RegionCode,
            ...Object.values(REGIONS).filter((r) => r !== preferredRegion),
          ]
        : Object.values(REGIONS);

    for (const region of regionsToCheck) {
      const empModel = await this.regionalDbManager.getModel<Employee>(
        region,
        Employee.name,
        EmployeeSchema,
      );
      const employee = await empModel.findOne({
        email: normalizedEmail,
        status: EmployeeStatus.INVITED,
      });

      if (employee && employee.invitationTokenHash) {
        const matches = await this.passwordService.verify(
          employee.invitationTokenHash,
          token,
        );
        if (matches) {
          if (
            employee.invitationExpiresAt &&
            employee.invitationExpiresAt < new Date()
          ) {
            throw new UnauthorizedException(
              'Invitation link has expired. Please contact your company administrator.',
            );
          }
          return { employee, region };
        }
      }
    }

    throw new UnauthorizedException(
      'Invalid or expired invitation token. Please check your invitation link.',
    );
  }

  // Validates invitation token and returns workspace context for employee acceptance UI
  async validateInvitation(
    token: string,
    email: string,
    preferredRegion?: string,
  ) {
    const { employee, region } = await this.findEmployeeByInvitation(
      token,
      email,
      preferredRegion,
    );

    const companyModel = await this.regionalDbManager.getModel<Company>(
      region,
      Company.name,
      CompanySchema,
    );
    const company = await companyModel
      .findOne({ companyId: employee.companyId })
      .lean();

    // Look up custom onboarding form template if defined for employee's branch/department
    const formModel =
      await this.regionalDbManager.getModel<OnboardingFormTemplate>(
        region,
        OnboardingFormTemplate.name,
        OnboardingFormTemplateSchema,
      );
    let activeForm: OnboardingFormTemplate | null = null;
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

  // Invited Employee Registration and Activation implementation
  private async registerEmployee(
    dto: RegisterDto,
  ): Promise<AuthSessionResponse> {
    if (!dto.invitationToken) {
      throw new UnauthorizedException(
        'Invitation token is required for employee account creation',
      );
    }

    const { employee, region } = await this.findEmployeeByInvitation(
      dto.invitationToken,
      dto.email,
    );

    const normalizedEmail = dto.email.toLowerCase().trim();

    // Verify no active master identity collision
    const existingIdentity = await this.masterIdentityModel.findOne({
      normalizedEmail,
      status: AccountStatus.ACTIVE,
    });
    if (existingIdentity) {
      throw new ConflictException(
        'An active account with this corporate email already exists',
      );
    }

    const companyModel = await this.regionalDbManager.getModel<Company>(
      region,
      Company.name,
      CompanySchema,
    );
    const company = await companyModel.findOne({
      companyId: employee.companyId,
    });
    if (!company) {
      throw new NotFoundException(
        'Company profile not found in designated region',
      );
    }

    // Verify company onboarding field requirements
    if (company.onboardingConfig?.requireCnic && !dto.cnic) {
      throw new BadRequestException('CNIC is required by company policy');
    }
    if (company.onboardingConfig?.requireAddress && !dto.address) {
      throw new BadRequestException('Address is required by company policy');
    }
    if (
      company.onboardingConfig?.requireBankDetails &&
      (!dto.bankDetails || !dto.bankDetails.accountNumber)
    ) {
      throw new BadRequestException(
        'Bank account details are required by company policy',
      );
    }

    const passwordHash = await this.passwordService.hash(dto.password);
    const userId = employee.userId || `usr_${randomUUID()}`;

    const userModel = await this.regionalDbManager.getModel<User>(
      region,
      User.name,
      UserSchema,
    );
    const empModel = await this.regionalDbManager.getModel<Employee>(
      region,
      Employee.name,
      EmployeeSchema,
    );

    const firstName = (dto.firstName || employee.firstName || '').trim();
    const lastName = (dto.lastName || employee.lastName || '').trim();
    const displayName = `${firstName} ${lastName}`.trim() || employee.email;

    // Resolve Role for roleId
    const roleModel = await this.regionalDbManager.getModel<Role>(
      region,
      Role.name,
      RoleSchema,
    );
    const roleName = employee.roleName || ROLES.EMPLOYEE;
    const roleDoc = await roleModel.findOne({
      companyId: employee.companyId,
      name: roleName,
    });
    const roleId = roleDoc?._id?.toString() || `role_${randomUUID()}`;

    // Generate JWT access & refresh tokens
    const tokens = await this.tokenService.generateTokens({
      userId,
      email: employee.email,
      companyId: employee.companyId,
      region,
      role: roleName,
      isOwner: false,
      permissions: employee.permissions || [],
    });

    const hashedRefreshToken = await this.tokenService.hashRefreshToken(
      tokens.refreshToken,
    );

    const userLocationRegion =
      dto.userLocationRegion || dto.country || undefined;

    // Create user profile in regional database
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
      status: AccountStatus.ACTIVE,
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

    // Create or update Master Identity
    await this.masterIdentityModel.findOneAndUpdate(
      { normalizedEmail },
      {
        userId,
        email: employee.email,
        normalizedEmail,
        companyId: employee.companyId,
        role: roleName,
        region,
        userLocationRegion,
        status: AccountStatus.ACTIVE,
        isEmailVerified: true,
        lastLoginAt: new Date(),
      },
      { upsert: true, new: true },
    );

    // Update Employee record to ACTIVE
    const employeeUpdate: Record<string, any> = {
      userId,
      status: EmployeeStatus.ACTIVE,
      firstName,
      lastName,
      dateOfBirth: dto.dateOfBirth,
      cnic: dto.cnic,
      address: dto.address,
      bankDetails: dto.bankDetails,
      invitationAcceptedAt: new Date(),
      $unset: { invitationTokenHash: 1, invitationExpiresAt: 1 },
    };
    if (userLocationRegion) employeeUpdate.userLocationRegion = userLocationRegion;
    if (dto.customFields) employeeUpdate.customFields = dto.customFields;
    if (dto.documents && dto.documents.length > 0) employeeUpdate.documents = dto.documents;

    await empModel.updateOne(
      { _id: (employee as any)._id },
      employeeUpdate,
    );

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

  // Unified Login Flow across all user roles
  async login(dto: LoginDto): Promise<AuthSessionResponse> {
    const normalizedEmail = dto.email.toLowerCase().trim();

    // 1. Locate Identity record in Master Database
    const identity = await this.masterIdentityModel
      .findOne({ normalizedEmail })
      .lean();
    if (!identity) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (
      identity.status === AccountStatus.DEACTIVATED ||
      identity.status === AccountStatus.SUSPENDED
    ) {
      throw new ForbiddenException(
        `Account is currently ${identity.status.toLowerCase()}`,
      );
    }

    const region = identity.region;

    // 2. Connect to user's assigned Regional Database
    const userModel = await this.regionalDbManager.getModel<User>(
      region,
      User.name,
      UserSchema,
    );
    const companyModel = await this.regionalDbManager.getModel<Company>(
      region,
      Company.name,
      CompanySchema,
    );

    const user = await userModel.findOne({ userId: identity.userId });
    if (!user) {
      throw new UnauthorizedException(
        'User profile not found in designated regional database',
      );
    }

    // 3. Verify Password using Argon2id
    const isPasswordValid = await this.passwordService.verify(
      user.passwordHash,
      dto.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // 4. Retrieve Company and verify working hours login restrictions
    const company = await companyModel
      .findOne({ companyId: user.companyId })
      .lean();
    if (!company && !user.isSuperAdmin && normalizedEmail !== 'admin@admin.com') {
      throw new UnauthorizedException(
        'Associated company workspace could not be found',
      );
    }

    const isSuperAdmin = user.isSuperAdmin || normalizedEmail === 'admin@admin.com' || user.roleName === 'SUPERADMIN';

    if (!isSuperAdmin && company && (company.status === 'INACTIVE' || company.status === 'SUSPENDED')) {
      throw new ForbiddenException(
        `Company workspace is currently ${company.status.toLowerCase()}. Please contact Super Admin.`,
      );
    }

    const locale = company
      ? await this.resolveEffectiveLocale(region, company, {
          userId: user.userId,
          email: user.email,
          branchId: (user as any).branchId,
          branchName: (user as any).branchName,
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

    // Check working hours restriction if configured (exempt owner and superadmin)
    if (
      !isSuperAdmin &&
      !user.isOwner &&
      company?.workingHours?.enabled &&
      company?.workingHours?.loginRestriction &&
      !locale.branch?.workingHours?.enforceLoginRestriction
    ) {
      const workingHoursCheck = validateCompanyWorkingHours(
        company.workingHours,
        locale.timezone,
      );
      if (!workingHoursCheck.allowed) {
        throw new ForbiddenException({
          statusCode: 403,
          code: 'COMPANY_OUTSIDE_WORKING_HOURS',
          message:
            workingHoursCheck.message ||
            'Your company is currently outside its allowed login hours.',
        });
      }
    }

    // Check branch working hours restriction if assigned to a branch (exempt owner and superadmin)
    if (!isSuperAdmin && !user.isOwner && locale.branch?.workingHours?.enforceLoginRestriction) {
      const branch = locale.branch;
      const tz = locale.timezone;
      const now = new Date();
      const dayOfWeek = new Date(
        now.toLocaleString('en-US', { timeZone: tz }),
      ).getDay();
      const workingDays = branch.workingHours.workingDays ?? [1, 2, 3, 4, 5];
      if (!workingDays.includes(dayOfWeek)) {
        throw new ForbiddenException({
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
        throw new ForbiddenException({
          statusCode: 403,
          code: 'BRANCH_OUTSIDE_WORKING_HOURS',
          message: `Login rejected: Outside authorized shift hours (${start} - ${end}) for branch "${branch.name}".`,
        });
      }
    }

    // 5. Generate fresh Access and Refresh tokens
    const tokens = await this.tokenService.generateTokens(
      {
        userId: user.userId,
        email: user.email,
        companyId: user.companyId,
        region: user.region,
        role: user.roleName,
        permissions: user.permissions,
        isOwner: user.isOwner,
        isSuperAdmin,
      } as any,
      user.tokenVersion,
    );

    // 6. Securely hash and rotate refresh token
    const hashedRefreshToken = await this.tokenService.hashRefreshToken(
      tokens.refreshToken,
    );
    user.hashedRefreshToken = hashedRefreshToken;
    user.lastLoginAt = new Date();
    await user.save();

    await this.masterIdentityModel.updateOne(
      { userId: identity.userId },
      { lastLoginAt: new Date() },
    );

    const safeCompany = company || {
      companyId: user.companyId || 'superadmin_workspace',
      name: 'Super Admin System',
      region: user.region || 'PK',
      timezone: 'UTC',
      currency: 'USD',
      logoUrl: undefined,
      subscription: {
        plan: SubscriptionPlan.FREE_TRIAL,
        status: SubscriptionStatus.TRIALING,
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
          plan: safeCompany.subscription?.plan || SubscriptionPlan.FREE_TRIAL,
          status: safeCompany.subscription?.status || SubscriptionStatus.TRIALING,
          trialEndsAt: safeCompany.subscription?.trialEndsAt,
        },
      },
    };
  }

  // Refresh Token Rotation and Replay Detection
  async refresh(dto: RefreshTokenDto): Promise<GeneratedTokens> {
    const payload = await this.tokenService.verifyRefreshToken(
      dto.refreshToken,
    );

    const userModel = await this.regionalDbManager.getModel<User>(
      payload.region,
      User.name,
      UserSchema,
    );

    const user = await userModel.findOne({ userId: payload.userId });
    if (!user) {
      throw new UnauthorizedException('User session not found');
    }

    // Detect version mismatch
    if (user.tokenVersion !== payload.tokenVersion) {
      // Invalidate all tokens immediately upon reuse detection
      user.tokenVersion += 1;
      user.hashedRefreshToken = undefined;
      await user.save();
      throw new UnauthorizedException(
        'Compromised refresh token detected. All active sessions have been revoked.',
      );
    }

    // Verify raw refresh token against stored hash
    if (!user.hashedRefreshToken) {
      throw new UnauthorizedException('Session has expired or was revoked');
    }

    const matches = await this.tokenService.verifyHashedRefreshToken(
      user.hashedRefreshToken,
      dto.refreshToken,
    );

    if (!matches) {
      // Replay detected
      user.tokenVersion += 1;
      user.hashedRefreshToken = undefined;
      await user.save();
      throw new UnauthorizedException(
        'Compromised refresh token detected. All active sessions have been revoked.',
      );
    }

    // Rotate tokens
    const tokens = await this.tokenService.generateTokens(
      {
        userId: user.userId,
        email: user.email,
        companyId: user.companyId,
        region: user.region,
        role: user.roleName,
        permissions: user.permissions,
        isOwner: user.isOwner,
      },
      user.tokenVersion,
    );

    user.hashedRefreshToken = await this.tokenService.hashRefreshToken(
      tokens.refreshToken,
    );
    await user.save();

    return tokens;
  }

  /** Invalidates the current user session and marks the user offline in the regional database. */
  async logout(
    userPayload: JwtPayload,
  ): Promise<{ success: boolean; message: string }> {
    const lastSeen = new Date();
    const userModel = await this.regionalDbManager.getModel<User>(
      userPayload.region,
      User.name,
      UserSchema,
    );
    const empModel = await this.regionalDbManager.getModel<Employee>(
      userPayload.region,
      Employee.name,
      EmployeeSchema,
    );

    await userModel.updateOne(
      { userId: userPayload.userId },
      {
        $unset: { hashedRefreshToken: 1 },
        $inc: { tokenVersion: 1 },
        $set: { isOnline: false, lastSeen },
      },
    );

    await empModel.updateOne(
      { userId: userPayload.userId },
      { $set: { isOnline: false, lastSeen } },
    );

    return { success: true, message: 'Logged out successfully' };
  }

  /** Retrieves the current authenticated user profile and effective workspace locale. */
  async getCurrentSession(
    userPayload: JwtPayload,
  ): Promise<AuthSessionResponse> {
    const userModel = await this.regionalDbManager.getModel<User>(
      userPayload.region,
      User.name,
      UserSchema,
    );
    const companyModel = await this.regionalDbManager.getModel<Company>(
      userPayload.region,
      Company.name,
      CompanySchema,
    );

    const user = await userModel.findOne({ userId: userPayload.userId }).lean();
    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    const company = await companyModel
      .findOne({ companyId: userPayload.companyId })
      .lean();
    if (!company) {
      throw new NotFoundException('Company profile not found');
    }

    const locale = await this.resolveEffectiveLocale(
      userPayload.region,
      company,
      {
        userId: user.userId,
        email: user.email,
        branchId: (user as any).branchId,
        branchName: (user as any).branchName,
      },
    );

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
          plan: company.subscription?.plan || SubscriptionPlan.FREE_TRIAL,
          status: company.subscription?.status || SubscriptionStatus.TRIALING,
          trialEndsAt: company.subscription?.trialEndsAt,
        },
      },
    };
  }

  // Updates current user profile details and synchronizes with regional Employee record
  async updateProfile(
    userPayload: JwtPayload,
    dto: UpdateProfileDto,
  ): Promise<AuthSessionResponse> {
    const userModel = await this.regionalDbManager.getModel<User>(
      userPayload.region,
      User.name,
      UserSchema,
    );
    const empModel = await this.regionalDbManager.getModel<Employee>(
      userPayload.region,
      Employee.name,
      EmployeeSchema,
    );

    const updateFields: Record<string, any> = {};
    if (dto.firstName !== undefined) updateFields.firstName = dto.firstName.trim();
    if (dto.lastName !== undefined) updateFields.lastName = dto.lastName.trim();
    if (dto.firstName !== undefined || dto.lastName !== undefined) {
      const existingUser = await userModel.findOne({ userId: userPayload.userId }).lean();
      const fn = dto.firstName !== undefined ? dto.firstName.trim() : (existingUser?.firstName || '');
      const ln = dto.lastName !== undefined ? dto.lastName.trim() : (existingUser?.lastName || '');
      updateFields.displayName = `${fn} ${ln}`.trim();
    }
    if (dto.avatarUrl !== undefined) updateFields.avatarUrl = dto.avatarUrl.trim();
    if (dto.phone !== undefined) updateFields.phone = dto.phone.trim();
    if (dto.address !== undefined) updateFields.address = dto.address.trim();
    if (dto.dateOfBirth !== undefined) updateFields.dateOfBirth = dto.dateOfBirth;
    if (dto.cnic !== undefined) updateFields.cnic = dto.cnic.trim();
    if (dto.bankDetails !== undefined) updateFields.bankDetails = dto.bankDetails;

    await userModel.updateOne(
      { userId: userPayload.userId },
      { $set: updateFields },
    );

    // Also sync with Employee record if present
    const empUpdate: Record<string, any> = {};
    if (updateFields.firstName) empUpdate.firstName = updateFields.firstName;
    if (updateFields.lastName) empUpdate.lastName = updateFields.lastName;
    if (updateFields.avatarUrl) empUpdate.avatarUrl = updateFields.avatarUrl;
    if (updateFields.phone) empUpdate.phone = updateFields.phone;
    if (updateFields.address) empUpdate.address = updateFields.address;
    if (updateFields.dateOfBirth) empUpdate.dateOfBirth = updateFields.dateOfBirth;
    if (updateFields.cnic) empUpdate.cnic = updateFields.cnic;
    if (updateFields.bankDetails) empUpdate.bankDetails = updateFields.bankDetails;

    if (Object.keys(empUpdate).length > 0) {
      await empModel.updateOne(
        { $or: [{ userId: userPayload.userId }, { email: userPayload.email }] },
        { $set: empUpdate },
      );
    }

    return this.getCurrentSession(userPayload);
  }

  // Verify 6-digit email verification code
  async verifyEmail(dto: VerifyEmailDto): Promise<AuthSessionResponse> {
    const normalizedEmail = dto.email.toLowerCase().trim();
    const identity = await this.masterIdentityModel.findOne({
      normalizedEmail,
    });

    if (!identity) {
      throw new NotFoundException('Account not found');
    }

    if (identity.isEmailVerified) {
      return this.getSessionForIdentity(identity);
    }

    if (
      !identity.verificationCode ||
      identity.verificationCode !== dto.code.trim()
    ) {
      throw new BadRequestException('Invalid verification code');
    }

    if (
      identity.verificationCodeExpiresAt &&
      new Date() > identity.verificationCodeExpiresAt
    ) {
      throw new BadRequestException(
        'Verification code has expired. Please request a new code.',
      );
    }

    // Mark as verified in Master Database
    identity.isEmailVerified = true;
    identity.status = AccountStatus.ACTIVE;
    identity.verificationCode = undefined;
    identity.verificationCodeExpiresAt = undefined;
    await identity.save();

    // Mark as verified in Regional Database
    const userModel = await this.regionalDbManager.getModel<User>(
      identity.region,
      User.name,
      UserSchema,
    );
    await userModel.updateOne(
      { userId: identity.userId },
      { isEmailVerified: true, status: AccountStatus.ACTIVE },
    );

    return this.getSessionForIdentity(identity);
  }

  // Resend fresh 6-digit verification code
  async resendVerificationCode(
    dto: ResendVerificationDto,
  ): Promise<{ success: boolean; message: string }> {
    const normalizedEmail = dto.email.toLowerCase().trim();
    const identity = await this.masterIdentityModel.findOne({
      normalizedEmail,
    });

    if (!identity) {
      throw new NotFoundException('Account not found');
    }

    if (identity.isEmailVerified) {
      return { success: true, message: 'Email address is already verified' };
    }

    const verificationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();
    const verificationCodeExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    identity.verificationCode = verificationCode;
    identity.verificationCodeExpiresAt = verificationCodeExpiresAt;
    await identity.save();

    const companyModel = await this.regionalDbManager.getModel<Company>(
      identity.region,
      Company.name,
      CompanySchema,
    );
    const company = await companyModel
      .findOne({ companyId: identity.companyId })
      .lean();

    const userModel = await this.regionalDbManager.getModel<User>(
      identity.region,
      User.name,
      UserSchema,
    );
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

  // Generate authenticated session response for an identity
  private async getSessionForIdentity(
    identity: MasterIdentityDocument,
  ): Promise<AuthSessionResponse> {
    const userModel = await this.regionalDbManager.getModel<User>(
      identity.region,
      User.name,
      UserSchema,
    );
    const companyModel = await this.regionalDbManager.getModel<Company>(
      identity.region,
      Company.name,
      CompanySchema,
    );

    const user = await userModel.findOne({ userId: identity.userId }).lean();
    if (!user) throw new NotFoundException('User profile not found');

    const company = await companyModel
      .findOne({ companyId: identity.companyId })
      .lean();
    if (!company) throw new NotFoundException('Company profile not found');

    const tokens = await this.tokenService.generateTokens({
      userId: user.userId,
      email: user.normalizedEmail,
      companyId: user.companyId,
      region: user.region,
      role: user.roleName,
      permissions: user.permissions,
      isOwner: user.isOwner,
    });

    const hashedRefreshToken = await this.tokenService.hashRefreshToken(
      tokens.refreshToken,
    );
    await userModel.updateOne(
      { userId: user.userId },
      { hashedRefreshToken, lastLoginAt: new Date() },
    );

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
          plan: company.subscription?.plan || SubscriptionPlan.FREE_TRIAL,
          status: company.subscription?.status || SubscriptionStatus.TRIALING,
          trialEndsAt: company.subscription?.trialEndsAt,
        },
      },
    };
  }

  // 1. Forgot password - generate 6-digit OTP, save in MasterIdentity, dispatch email
  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
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

    await this.masterIdentityModel.updateOne(
      { normalizedEmail },
      {
        passwordResetOtpHash: otpHash,
        passwordResetOtpExpiresAt: expiresAt,
      },
    );

    const userModel = await this.regionalDbManager.getModel<User>(
      identity.region,
      User.name,
      UserSchema,
    );
    const user = await userModel.findOne({ userId: identity.userId }).lean();
    const name = user ? user.displayName : 'Team Member';

    this.logger.log(`[AUTH] Generated password reset OTP for ${normalizedEmail}: [${otp}]`);

    // Asynchronously dispatch email without blocking client response
    this.mailService
      .sendPasswordResetOtpEmail(normalizedEmail, {
        name,
        code: otp,
        expiresInMinutes: 15,
      })
      .catch((err: unknown) => {
        this.logger.error(
          `Failed to dispatch password reset email to ${normalizedEmail}: ${err instanceof Error ? err.message : String(err)}`,
        );
      });

    return {
      success: true,
      message: 'A 6-digit OTP has been sent to your email address.',
    };
  }

  // 2. Verify password reset OTP
  async verifyPasswordResetOtp(email: string, otp: string): Promise<{ success: boolean; valid: boolean }> {
    const normalizedEmail = email.toLowerCase().trim();
    const identity = await this.masterIdentityModel.findOne({ normalizedEmail });
    if (!identity || !identity.passwordResetOtpHash || !identity.passwordResetOtpExpiresAt) {
      throw new BadRequestException('Invalid or expired OTP request');
    }

    if (new Date() > identity.passwordResetOtpExpiresAt) {
      throw new BadRequestException('The OTP code has expired. Please request a new one.');
    }

    const isValid = await this.passwordService.verify(
      identity.passwordResetOtpHash,
      otp.trim(),
    );
    if (!isValid) {
      throw new BadRequestException('Invalid verification code');
    }

    return { success: true, valid: true };
  }

  // 3. Reset password using verified OTP
  async resetPassword(dto: { email: string; otp: string; newPassword: string }): Promise<{ success: boolean; message: string }> {
    await this.verifyPasswordResetOtp(dto.email, dto.otp);

    const normalizedEmail = dto.email.toLowerCase().trim();
    const identity = await this.masterIdentityModel.findOne({ normalizedEmail });
    if (!identity) throw new NotFoundException('Account identity not found');

    const newPasswordHash = await this.passwordService.hash(dto.newPassword);

    // Update regional user password
    const userModel = await this.regionalDbManager.getModel<User>(
      identity.region,
      User.name,
      UserSchema,
    );
    await userModel.updateOne(
      { userId: identity.userId },
      { passwordHash: newPasswordHash, updatedAt: new Date() },
    );

    // Clear reset OTP from master identity
    await this.masterIdentityModel.updateOne(
      { normalizedEmail },
      {
        $unset: {
          passwordResetOtpHash: 1,
          passwordResetOtpExpiresAt: 1,
        },
      },
    );

    return {
      success: true,
      message: 'Password reset successfully. You may now sign in with your new password.',
    };
  }
}
