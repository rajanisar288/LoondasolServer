"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CountryMiddleware = void 0;
const common_1 = require("@nestjs/common");
const sharding_config_1 = require("../../config/sharding.config");
let CountryMiddleware = class CountryMiddleware {
    use(req, res, next) {
        if (req.method === 'OPTIONS') {
            return next();
        }
        const path = req.originalUrl || req.url || '';
        if (path.includes('/api/docs') ||
            path.includes('/api/v1/health') ||
            path.includes('/subscriptions/webhook')) {
            req.countryCode = 'US';
            req.shard = sharding_config_1.shardingConfig.getShardForCountry('US').name;
            return next();
        }
        const rawCountryCode = req.headers['x-country-code'] || req.headers['X-Country-Code'];
        const countryCode = Array.isArray(rawCountryCode)
            ? rawCountryCode[0]
            : rawCountryCode;
        if (!countryCode || !countryCode.trim()) {
            return res.status(400).json({
                success: false,
                statusCode: 400,
                message: 'Country code is required in headers',
                errors: [
                    {
                        field: 'x-country-code',
                        message: 'Country code is required in headers',
                    },
                ],
            });
        }
        const trimmed = countryCode.trim();
        if (!/^[A-Za-z]{2}$/.test(trimmed)) {
            return res.status(400).json({
                success: false,
                statusCode: 400,
                message: 'Country code must be 2 letters (e.g., US, IN, PK)',
                errors: [
                    {
                        field: 'x-country-code',
                        message: 'Country code must be 2 letters (e.g., US, IN, PK)',
                    },
                ],
            });
        }
        const normalized = trimmed.toUpperCase();
        req.countryCode = normalized;
        req.shard = sharding_config_1.shardingConfig.getShardForCountry(normalized).name;
        next();
    }
};
exports.CountryMiddleware = CountryMiddleware;
exports.CountryMiddleware = CountryMiddleware = __decorate([
    (0, common_1.Injectable)()
], CountryMiddleware);
//# sourceMappingURL=country.middleware.js.map