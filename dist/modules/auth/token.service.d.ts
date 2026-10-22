import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
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
export declare class TokenService {
    private readonly jwtService;
    private readonly configService;
    private readonly passwordService;
    constructor(jwtService: JwtService, configService: ConfigService, passwordService: PasswordService);
    generateTokens(payload: Omit<JwtPayload, 'tokenVersion'>, tokenVersion?: number): Promise<GeneratedTokens>;
    verifyRefreshToken(token: string): Promise<RefreshTokenPayload>;
    hashRefreshToken(token: string): Promise<string>;
    verifyHashedRefreshToken(hash: string, token: string): Promise<boolean>;
}
