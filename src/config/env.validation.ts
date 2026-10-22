import * as Joi from 'joi';

// Schema validating environment configuration on application startup
export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(4000),
  API_PREFIX: Joi.string().default('api/v1'),
  CORS_ORIGIN: Joi.string().default('http://localhost:4200'),

  // JWT configuration
  JWT_ACCESS_SECRET: Joi.string().min(16).required(),
  JWT_REFRESH_SECRET: Joi.string().min(16).required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('8h'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  // Master Database URI
  MONGODB_MASTER_URI: Joi.string().uri().required(),

  // Sharded Databases
  MONGODB_SHARD1_URI: Joi.string().uri().optional().allow(''),
  MONGODB_SHARD2_URI: Joi.string().uri().optional().allow(''),
  MONGODB_SHARD3_URI: Joi.string().uri().optional().allow(''),

  // Regional Databases
  MONGODB_PK_URI: Joi.string().uri().optional().allow(''),
  MONGODB_IND_URI: Joi.string().uri().optional().allow(''),
  MONGODB_USA_URI: Joi.string().uri().optional().allow(''),
  MONGODB_EU_URI: Joi.string().uri().optional().allow(''),
  MONGODB_UAE_URI: Joi.string().uri().optional().allow(''),

  // Redis
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().optional().allow(''),

  // Feature Flags
  ENABLE_MULTI_REGION: Joi.boolean().default(true),
  ENABLE_WEBSOCKETS: Joi.boolean().default(true),
  ENABLE_EMAIL: Joi.boolean().default(false),
  ENABLE_AI: Joi.boolean().default(false),
  ENABLE_CLOUDINARY: Joi.boolean().default(false),
  ENABLE_STRIPE: Joi.boolean().default(false),

  // Stripe
  STRIPE_SECRET_KEY: Joi.string().optional().allow(''),
  STRIPE_WEBHOOK_SECRET: Joi.string().optional().allow(''),
  STRIPE_PUBLISHABLE_KEY: Joi.string().optional().allow(''),

  // Email
  EMAIL_HOST: Joi.string().optional().allow(''),
  EMAIL_PORT: Joi.number().optional(),
  EMAIL_SECURE: Joi.boolean().default(false),
  EMAIL_USER: Joi.string().optional().allow(''),
  EMAIL_PASS: Joi.string().optional().allow(''),
  EMAIL_FROM: Joi.string().optional().allow(''),
  APP_URL: Joi.string().optional().allow(''),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: Joi.string().optional().allow(''),
  CLOUDINARY_API_KEY: Joi.string().optional().allow(''),
  CLOUDINARY_API_SECRET: Joi.string().optional().allow(''),

  // AI
  AI_PROVIDER: Joi.string().valid('gemini', 'openai').default('gemini'),
  GEMINI_API_KEY: Joi.string().optional().allow(''),
  GEMINI_MODEL: Joi.string().optional().allow('').default('gemini-2.5-flash'),
  OPENAI_API_KEY: Joi.string().optional().allow(''),
});
