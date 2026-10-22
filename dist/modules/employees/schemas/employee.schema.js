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
exports.EmployeeSchema = exports.Employee = exports.BankDetails = exports.EmployeeStatus = exports.EmploymentType = void 0;
const mongoose_1 = require("@nestjs/mongoose");
var EmploymentType;
(function (EmploymentType) {
    EmploymentType["FULL_TIME"] = "FULL_TIME";
    EmploymentType["PART_TIME"] = "PART_TIME";
    EmploymentType["CONTRACT"] = "CONTRACT";
    EmploymentType["INTERN"] = "INTERN";
})(EmploymentType || (exports.EmploymentType = EmploymentType = {}));
var EmployeeStatus;
(function (EmployeeStatus) {
    EmployeeStatus["ACTIVE"] = "ACTIVE";
    EmployeeStatus["INACTIVE"] = "INACTIVE";
    EmployeeStatus["ON_LEAVE"] = "ON_LEAVE";
    EmployeeStatus["INVITED"] = "INVITED";
    EmployeeStatus["RESIGNED"] = "RESIGNED";
    EmployeeStatus["TERMINATED"] = "TERMINATED";
})(EmployeeStatus || (exports.EmployeeStatus = EmployeeStatus = {}));
let BankDetails = class BankDetails {
};
exports.BankDetails = BankDetails;
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: '' }),
    __metadata("design:type", String)
], BankDetails.prototype, "bankName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: '' }),
    __metadata("design:type", String)
], BankDetails.prototype, "accountTitle", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: '' }),
    __metadata("design:type", String)
], BankDetails.prototype, "accountNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: '' }),
    __metadata("design:type", String)
], BankDetails.prototype, "iban", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: '' }),
    __metadata("design:type", String)
], BankDetails.prototype, "branchCode", void 0);
exports.BankDetails = BankDetails = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], BankDetails);
let Employee = class Employee {
};
exports.Employee = Employee;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true, index: true }),
    __metadata("design:type", String)
], Employee.prototype, "employeeId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", String)
], Employee.prototype, "companyId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, index: true }),
    __metadata("design:type", String)
], Employee.prototype, "userId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Employee.prototype, "firstName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Employee.prototype, "lastName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, lowercase: true, trim: true }),
    __metadata("design:type", String)
], Employee.prototype, "email", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], Employee.prototype, "phone", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], Employee.prototype, "avatarUrl", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], Employee.prototype, "dateOfBirth", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], Employee.prototype, "cnic", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], Employee.prototype, "address", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: BankDetails, default: () => ({}) }),
    __metadata("design:type", BankDetails)
], Employee.prototype, "bankDetails", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, index: true }),
    __metadata("design:type", String)
], Employee.prototype, "branchId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], Employee.prototype, "branchName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, index: true }),
    __metadata("design:type", String)
], Employee.prototype, "departmentId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], Employee.prototype, "departmentName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Employee.prototype, "designation", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        enum: Object.values(EmploymentType),
        default: EmploymentType.FULL_TIME,
    }),
    __metadata("design:type", String)
], Employee.prototype, "employmentType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, type: [String], default: [] }),
    __metadata("design:type", Array)
], Employee.prototype, "permissions", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: 'EMPLOYEE' }),
    __metadata("design:type", String)
], Employee.prototype, "roleName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, index: true }),
    __metadata("design:type", String)
], Employee.prototype, "roleId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: 0 }),
    __metadata("design:type", Number)
], Employee.prototype, "salary", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: Date.now }),
    __metadata("design:type", Date)
], Employee.prototype, "joiningDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        enum: Object.values(EmployeeStatus),
        default: EmployeeStatus.ACTIVE,
    }),
    __metadata("design:type", String)
], Employee.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], Employee.prototype, "invitationTokenHash", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", Date)
], Employee.prototype, "invitationExpiresAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", Date)
], Employee.prototype, "invitationAcceptedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", Date)
], Employee.prototype, "lastSeen", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: false }),
    __metadata("design:type", Boolean)
], Employee.prototype, "isOnline", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], Employee.prototype, "userLocationRegion", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", Number)
], Employee.prototype, "taxPercentage", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object, default: () => ({}) }),
    __metadata("design:type", Object)
], Employee.prototype, "customFields", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: [
            {
                name: { type: String, required: true },
                url: { type: String, required: true },
                fileType: { type: String, required: true },
                uploadedAt: { type: Date, default: Date.now },
            },
        ],
        default: [],
    }),
    __metadata("design:type", Array)
], Employee.prototype, "documents", void 0);
exports.Employee = Employee = __decorate([
    (0, mongoose_1.Schema)({ collection: 'employees', timestamps: true })
], Employee);
exports.EmployeeSchema = mongoose_1.SchemaFactory.createForClass(Employee);
exports.EmployeeSchema.index({ companyId: 1, email: 1 }, { unique: true });
exports.EmployeeSchema.index({ companyId: 1, departmentId: 1 });
exports.EmployeeSchema.index({ companyId: 1, status: 1 });
//# sourceMappingURL=employee.schema.js.map