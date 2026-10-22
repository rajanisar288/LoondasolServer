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
exports.TokenService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const crypto_1 = require("crypto");
const password_service_1 = require("./password.service");
let TokenService = class TokenService {
    constructor(jwtService, configService, passwordService) {
        this.jwtService = jwtService;
        this.configService = configService;
        this.passwordService = passwordService;
    }
    async generateTokens(payload, tokenVersion = 1) {
        const accessSecret = this.configService.get('JWT_ACCESS_SECRET');
        const refreshSecret = this.configService.get('JWT_REFRESH_SECRET');
        const accessExpiresIn = this.configService.get('JWT_ACCESS_EXPIRES_IN', '8h');
        const refreshExpiresIn = this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d');
        const accessPayload = {
            ...payload,
            tokenVersion,
        };
        const accessToken = await this.jwtService.signAsync(accessPayload, {
            secret: accessSecret,
            expiresIn: accessExpiresIn,
        });
        const refreshPayload = {
            userId: payload.userId,
            companyId: payload.companyId,
            region: payload.region,
            tokenVersion,
            tokenId: (0, crypto_1.randomUUID)(),
        };
        const refreshToken = await this.jwtService.signAsync(refreshPayload, {
            secret: refreshSecret,
            expiresIn: refreshExpiresIn,
        });
        return {
            accessToken,
            refreshToken,
            expiresIn: accessExpiresIn,
            refreshExpiresIn,
        };
    }
    async verifyRefreshToken(token) {
        const refreshSecret = this.configService.get('JWT_REFRESH_SECRET');
        try {
            return await this.jwtService.verifyAsync(token, {
                secret: refreshSecret,
            });
        }
        catch {
            throw new common_1.UnauthorizedException('Refresh token is expired, invalid, or malformed');
        }
    }
    async hashRefreshToken(token) {
        return this.passwordService.hash(token);
    }
    async verifyHashedRefreshToken(hash, token) {
        return this.passwordService.verify(hash, token);
    }
};
exports.TokenService = TokenService;
exports.TokenService = TokenService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService,
        password_service_1.PasswordService])
], TokenService);
//# sourceMappingURL=token.service.js.map