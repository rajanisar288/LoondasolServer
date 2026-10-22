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
exports.WorkingHoursGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const regional_database_manager_1 = require("../../database/regional-database.manager");
const company_schema_1 = require("../../modules/companies/schemas/company.schema");
const working_hours_helper_1 = require("../../modules/companies/working-hours.helper");
const public_decorator_1 = require("../decorators/public.decorator");
const roles_constant_1 = require("../constants/roles.constant");
let WorkingHoursGuard = class WorkingHoursGuard {
    constructor(reflector, regionalDbManager) {
        this.reflector = reflector;
        this.regionalDbManager = regionalDbManager;
    }
    async canActivate(context) {
        const isPublic = this.reflector.getAllAndOverride(public_decorator_1.IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user || !user.companyId || !user.region || user.role === roles_constant_1.ROLES.OWNER) {
            return true;
        }
        try {
            const companyModel = await this.regionalDbManager.getModel(user.region, company_schema_1.Company.name, company_schema_1.CompanySchema);
            const company = await companyModel
                .findOne({ companyId: user.companyId })
                .lean();
            if (!company ||
                !company.workingHours?.enabled ||
                !company.workingHours?.loginRestriction) {
                return true;
            }
            const check = (0, working_hours_helper_1.validateCompanyWorkingHours)(company.workingHours, company.timezone);
            if (!check.allowed) {
                throw new common_1.ForbiddenException({
                    statusCode: 403,
                    code: 'COMPANY_OUTSIDE_WORKING_HOURS',
                    message: check.message ||
                        'Your company is currently outside its allowed login hours.',
                });
            }
            return true;
        }
        catch (err) {
            if (err instanceof common_1.ForbiddenException) {
                throw err;
            }
            return true;
        }
    }
};
exports.WorkingHoursGuard = WorkingHoursGuard;
exports.WorkingHoursGuard = WorkingHoursGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        regional_database_manager_1.RegionalDatabaseManager])
], WorkingHoursGuard);
//# sourceMappingURL=working-hours.guard.js.map