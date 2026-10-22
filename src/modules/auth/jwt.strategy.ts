import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { RegionCode } from '../../common/constants/regions.constant';

export interface JwtPayload {
  userId: string;
  email: string;
  companyId: string;
  region: RegionCode;
  role: string;
  permissions: string[];
  tokenVersion: number;
  isOwner?: boolean;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    const secret = configService.get<string>('JWT_ACCESS_SECRET');
    if (!secret) {
      throw new Error('JWT_ACCESS_SECRET must be configured');
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        ExtractJwt.fromUrlQueryParameter('token'),
      ]),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  // Validates JWT payload and injects authenticated user context into request
  validate(payload: JwtPayload): JwtPayload {
    if (!payload.userId || !payload.companyId || !payload.region) {
      throw new UnauthorizedException('Malformed authentication token payload');
    }
    return payload;
  }
}
