import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { shardingConfig } from '../../config/sharding.config';

declare global {
  namespace Express {
    interface Request {
      countryCode?: string;
      shard?: string;
    }
  }
}

/**
 * Middleware to validate x-country-code from headers and attach resolved shard to the request
 */
@Injectable()
export class CountryMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Pass through OPTIONS preflight requests without validation
    if (req.method === 'OPTIONS') {
      return next();
    }

    // Exclude documentation, health checks, and webhooks
    const path = req.originalUrl || req.url || '';
    if (
      path.includes('/api/docs') ||
      path.includes('/api/v1/health') ||
      path.includes('/subscriptions/webhook')
    ) {
      req.countryCode = 'US';
      req.shard = shardingConfig.getShardForCountry('US').name;
      return next();
    }

    // Get country code from header
    const rawCountryCode =
      req.headers['x-country-code'] || req.headers['X-Country-Code'];
    const countryCode = Array.isArray(rawCountryCode)
      ? rawCountryCode[0]
      : rawCountryCode;

    // Check if header exists
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

    // Validate format (must be 2 letters, e.g., US, IN, PK)
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

    // Attach to request for later use
    const normalized = trimmed.toUpperCase();
    req.countryCode = normalized;
    req.shard = shardingConfig.getShardForCountry(normalized).name;

    next();
  }
}
