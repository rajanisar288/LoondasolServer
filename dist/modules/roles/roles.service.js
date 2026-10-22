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
exports.RolesService = void 0;
const common_1 = require("@nestjs/common");
const regional_database_manager_1 = require("../../database/regional-database.manager");
const role_schema_1 = require("./schemas/role.schema");
const permissions_constant_1 = require("../../common/constants/permissions.constant");
let RolesService = class RolesService {
    constructor(regionalDbManager) {
        this.regionalDbManager = regionalDbManager;
    }
    async findAll(tenant) {
        const model = await this.regionalDbManager.getModel(tenant.region, role_schema_1.Role.name, role_schema_1.RoleSchema);
        return model
            .find({ companyId: tenant.companyId })
            .sort({ isSystem: -1, name: 1 })
            .lean();
    }
    getAvailablePermissions() {
        return permissions_constant_1.ALL_PERMISSIONS;
    }
    async create(tenant, dto) {
        const model = await this.regionalDbManager.getModel(tenant.region, role_schema_1.Role.name, role_schema_1.RoleSchema);
        const existing = await model
            .findOne({ companyId: tenant.companyId, name: dto.name.trim() })
            .lean();
        if (existing) {
            throw new common_1.ConflictException(`Role with name "${dto.name}" already exists in your workspace`);
        }
        const validPerms = (dto.permissions || []).filter((p) => typeof p === 'string' && p.trim().length > 0);
        return model.create({
            companyId: tenant.companyId,
            name: dto.name.trim(),
            description: dto.description?.trim(),
            isSystem: false,
            permissions: validPerms,
        });
    }
    async update(tenant, roleId, dto) {
        const model = await this.regionalDbManager.getModel(tenant.region, role_schema_1.Role.name, role_schema_1.RoleSchema);
        const role = await model.findOne({
            companyId: tenant.companyId,
            _id: roleId,
        });
        if (!role) {
            throw new common_1.NotFoundException('Role not found');
        }
        if (role.isSystem && dto.name && dto.name !== role.name) {
            throw new common_1.BadRequestException('System role names cannot be modified');
        }
        if (dto.name)
            role.name = dto.name.trim();
        if (dto.description !== undefined)
            role.description = dto.description?.trim();
        if (dto.permissions) {
            role.permissions = (dto.permissions || []).filter((p) => typeof p === 'string' && p.trim().length > 0);
        }
        return role.save();
    }
    async delete(tenant, roleId) {
        const model = await this.regionalDbManager.getModel(tenant.region, role_schema_1.Role.name, role_schema_1.RoleSchema);
        const role = await model.findOne({
            companyId: tenant.companyId,
            _id: roleId,
        });
        if (!role) {
            throw new common_1.NotFoundException('Role not found');
        }
        if (role.isSystem) {
            throw new common_1.BadRequestException('System roles cannot be deleted');
        }
        await model.deleteOne({ _id: roleId, companyId: tenant.companyId });
        return { success: true };
    }
};
exports.RolesService = RolesService;
exports.RolesService = RolesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [regional_database_manager_1.RegionalDatabaseManager])
], RolesService);
//# sourceMappingURL=roles.service.js.map