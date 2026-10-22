import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { JwtPayload } from './jwt.strategy';
import { PasswordService } from './password.service';
import { RegionCode } from '../../common/constants/regions.constant';

export interface RefreshTokenPayload {
  userId: string;
  companyId: string;
  region: RegionCode;
  tokenVersion: number;
  tokenId: string;
}

export interface GeneratedTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  refreshExpiresIn: string;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly passwordService: PasswordService,
  ) {}

  // Issues a fresh Access Token and Refresh Token pair
  async generateTokens(
    payload: Omit<JwtPayload, 'tokenVersion'>,
    tokenVersion = 1,
  ): Promise<GeneratedTokens> {
    const accessSecret = this.configService.get<string>('JWT_ACCESS_SECRET')!;
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET')!;
    const accessExpiresIn = this.configService.get<string>(
      'JWT_ACCESS_EXPIRES_IN',
      '8h',
    );
    const refreshExpiresIn = this.configService.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
      '7d',
    );

    const accessPayload: JwtPayload = {
      ...payload,
      tokenVersion,
    };

    const accessToken = await this.jwtService.signAsync(accessPayload, {
      secret: accessSecret,
      expiresIn: accessExpiresIn as unknown as number,
    });

    const refreshPayload: RefreshTokenPayload = {
      userId: payload.userId,
      companyId: payload.companyId,
      region: payload.region,
      tokenVersion,
      tokenId: randomUUID(),
    };

    const refreshToken = await this.jwtService.signAsync(refreshPayload, {
      secret: refreshSecret,
      expiresIn: refreshExpiresIn as unknown as number,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: accessExpiresIn,
      refreshExpiresIn,
    };
  }

  // Verifies and decodes a refresh token using the refresh secret
  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET')!;
    try {
      return await this.jwtService.verifyAsync<RefreshTokenPayload>(token, {
        secret: refreshSecret,
      });
    } catch {
      throw new UnauthorizedException(
        'Refresh token is expired, invalid, or malformed',
      );
    }
  }

  // Hashes refresh token before storing in regional database
  async hashRefreshToken(token: string): Promise<string> {
    return this.passwordService.hash(token);
  }

  // Validates incoming raw refresh token against stored hash
  async verifyHashedRefreshToken(
    hash: string,
    token: string,
  ): Promise<boolean> {
    return this.passwordService.verify(hash, token);
  }
}
