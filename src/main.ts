import dns from 'node:dns';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { RedisIoAdapter } from './common/adapters/redis-io.adapter';

// Configure resilient DNS nameservers for cloud cluster resolutions
dns.setServers(['8.8.8.8', '1.1.1.1']);

// bootstrap: initializes and starts the NestJS HTTP & WebSocket server
async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 4000);
  const prefix = configService.get<string>('API_PREFIX', 'api/v1');
  const rawCorsOrigin = configService.get<string>(
    'CORS_ORIGIN',
    'http://localhost:4200,http://localhost:3000,https://loondasol.com,https://workspace.loondasol.com',
  );
  const corsOrigins = rawCorsOrigin.split(',').map((origin) => origin.trim());

  // Security Headers via Helmet
  app.use(helmet());

  // Response Compression
  app.use(compression());

  // CORS Configuration
  app.enableCors({
    origin: (requestOrigin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!requestOrigin) return callback(null, true);
      if (
        corsOrigins.includes(requestOrigin) ||
        requestOrigin.endsWith('.loondasol.com') ||
        requestOrigin === 'http://localhost:3000' ||
        requestOrigin === 'http://localhost:4200'
      ) {
        return callback(null, true);
      }
      return callback(null, true); // Dev resilient
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

  // Global Versioned API Prefix
  app.setGlobalPrefix(prefix);

  // Strict Request Body Validation Pipe
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

  // Swagger OpenAPI Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('WorkivLab Enterprise SaaS API')
    .setDescription('Multi-Tenant Region-Aware Company Operations Platform API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  // Redis Socket Adapter for Horizontal Real-Time WebSocket Scaling
  const redisIoAdapter = new RedisIoAdapter(app, configService);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);

  await app.listen(port);
  logger.log(`Server running on port ${port} with prefix /${prefix}`);
  logger.log(
    `Swagger documentation available at http://localhost:${port}/api/docs`,
  );
}

void bootstrap();
