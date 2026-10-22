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
exports.MasterIdentitySchema = exports.MasterIdentity = exports.AccountStatus = void 0;
const mongoose_1 = require("@nestjs/mongoose");
var AccountStatus;
(function (AccountStatus) {
    AccountStatus["ACTIVE"] = "ACTIVE";
    AccountStatus["PENDING"] = "PENDING";
    AccountStatus["SUSPENDED"] = "SUSPENDED";
    AccountStatus["DEACTIVATED"] = "DEACTIVATED";
})(AccountStatus || (exports.AccountStatus = AccountStatus = {}));
let MasterIdentity = class MasterIdentity {
};
exports.MasterIdentity = MasterIdentity;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true, index: true }),
    __metadata("design:type", String)
], MasterIdentity.prototype, "userId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, lowercase: true, trim: true }),
    __metadata("design:type", String)
], MasterIdentity.prototype, "email", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        unique: true,
        index: true,
        lowercase: true,
        trim: true,
    }),
    __metadata("design:type", String)
], MasterIdentity.prototype, "normalizedEmail", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", String)
], MasterIdentity.prototype, "companyId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: String, index: true }),
    __metadata("design:type", String)
], MasterIdentity.prototype, "region", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: 'primary' }),
    __metadata("design:type", String)
], MasterIdentity.prototype, "databaseCluster", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        enum: Object.values(AccountStatus),
        default: AccountStatus.ACTIVE,
    }),
    __metadata("design:type", String)
], MasterIdentity.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: false }),
    __metadata("design:type", Boolean)
], MasterIdentity.prototype, "isEmailVerified", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], MasterIdentity.prototype, "verificationCode", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", Date)
], MasterIdentity.prototype, "verificationCodeExpiresAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], MasterIdentity.prototype, "passwordResetOtpHash", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", Date)
], MasterIdentity.prototype, "passwordResetOtpExpiresAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", Date)
], MasterIdentity.prototype, "lastLoginAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", Date)
], MasterIdentity.prototype, "lastSeen", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: false }),
    __metadata("design:type", Boolean)
], MasterIdentity.prototype, "isOnline", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], MasterIdentity.prototype, "userLocationRegion", void 0);
exports.MasterIdentity = MasterIdentity = __decorate([
    (0, mongoose_1.Schema)({ collection: 'master_identities', timestamps: true })
], MasterIdentity);
exports.MasterIdentitySchema = mongoose_1.SchemaFactory.createForClass(MasterIdentity);
exports.MasterIdentitySchema.index({ email: 1, region: 1 });
exports.MasterIdentitySchema.index({ companyId: 1, status: 1 });
//# sourceMappingURL=master.schema.js.map