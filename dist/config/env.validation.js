"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.envValidationSchema = void 0;
const Joi = __importStar(require("joi"));
exports.envValidationSchema = Joi.object({
    NODE_ENV: Joi.string()
        .valid('development', 'production', 'test')
        .default('development'),
    PORT: Joi.number().default(4000),
    API_PREFIX: Joi.string().default('api/v1'),
    CORS_ORIGIN: Joi.string().default('http://localhost:4200'),
    JWT_ACCESS_SECRET: Joi.string().min(16).required(),
    JWT_REFRESH_SECRET: Joi.string().min(16).required(),
    JWT_ACCESS_EXPIRES_IN: Joi.string().default('8h'),
    JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
    MONGODB_MASTER_URI: Joi.string().uri().required(),
    MONGODB_SHARD1_URI: Joi.string().uri().optional().allow(''),
    MONGODB_SHARD2_URI: Joi.string().uri().optional().allow(''),
    MONGODB_SHARD3_URI: Joi.string().uri().optional().allow(''),
    MONGODB_PK_URI: Joi.string().uri().optional().allow(''),
    MONGODB_IND_URI: Joi.string().uri().optional().allow(''),
    MONGODB_USA_URI: Joi.string().uri().optional().allow(''),
    MONGODB_EU_URI: Joi.string().uri().optional().allow(''),
    MONGODB_UAE_URI: Joi.string().uri().optional().allow(''),
    REDIS_HOST: Joi.string().default('localhost'),
    REDIS_PORT: Joi.number().default(6379),
    REDIS_PASSWORD: Joi.string().optional().allow(''),
    ENABLE_MULTI_REGION: Joi.boolean().default(true),
    ENABLE_WEBSOCKETS: Joi.boolean().default(true),
    ENABLE_EMAIL: Joi.boolean().default(false),
    ENABLE_AI: Joi.boolean().default(false),
    ENABLE_CLOUDINARY: Joi.boolean().default(false),
    ENABLE_STRIPE: Joi.boolean().default(false),
    STRIPE_SECRET_KEY: Joi.string().optional().allow(''),
    STRIPE_WEBHOOK_SECRET: Joi.string().optional().allow(''),
    STRIPE_PUBLISHABLE_KEY: Joi.string().optional().allow(''),
    EMAIL_HOST: Joi.string().optional().allow(''),
    EMAIL_PORT: Joi.number().optional(),
    EMAIL_SECURE: Joi.boolean().default(false),
    EMAIL_USER: Joi.string().optional().allow(''),
    EMAIL_PASS: Joi.string().optional().allow(''),
    EMAIL_FROM: Joi.string().optional().allow(''),
    APP_URL: Joi.string().optional().allow(''),
    CLOUDINARY_CLOUD_NAME: Joi.string().optional().allow(''),
    CLOUDINARY_API_KEY: Joi.string().optional().allow(''),
    CLOUDINARY_API_SECRET: Joi.string().optional().allow(''),
    AI_PROVIDER: Joi.string().valid('gemini', 'openai').default('gemini'),
    GEMINI_API_KEY: Joi.string().optional().allow(''),
    GEMINI_MODEL: Joi.string().optional().allow('').default('gemini-2.5-flash'),
    OPENAI_API_KEY: Joi.string().optional().allow(''),
});
//# sourceMappingURL=env.validation.js.map