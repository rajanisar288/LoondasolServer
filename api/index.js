const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');
const { ValidationPipe } = require('@nestjs/common');
const helmet = require('helmet');
const compression = require('compression');
const express = require('express');
const { ExpressAdapter } = require('@nestjs/platform-express');

let cachedServer;

async function bootstrapServer() {
  if (cachedServer) {
    return cachedServer;
  }

  const expressApp = express();
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),
    {
      logger: ['error', 'warn', 'log'],
    },
  );

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(compression());

  const rawCors =
    process.env.CORS_ORIGIN ||
    'http://localhost:4200,http://localhost:3000,https://loondasol.com,https://www.loondasol.com,https://workspace.loondasol.com';
  const allowedOrigins = rawCors.split(',').map((o) => o.trim());

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.loondasol.com') ||
        origin.includes('localhost')
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Region',
      'X-Request-ID',
      'x-country-code',
      'X-Country-Code',
    ],
  });

  const prefix = process.env.API_PREFIX || 'api/v1';
  app.setGlobalPrefix(prefix);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const { ConfigService } = require('@nestjs/config');
  const { RedisIoAdapter } = require('../dist/common/adapters/redis-io.adapter');
  const configService = app.get(ConfigService);
  const enableWs = configService.get('ENABLE_WEBSOCKETS', true);
  if (enableWs) {
    const redisIoAdapter = new RedisIoAdapter(app, configService);
    await redisIoAdapter.connectToRedis();
    app.useWebSocketAdapter(redisIoAdapter);
  }

  await app.init();
  cachedServer = expressApp;
  return cachedServer;
}

module.exports = async (req, res) => {
  const server = await bootstrapServer();
  return server(req, res);
};
