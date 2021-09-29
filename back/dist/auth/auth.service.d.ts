import { HttpService } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/users.entity';
export declare class AuthService {
    private readonly httpService;
    private readonly jwtService;
    private readonly configService;
    constructor(httpService: HttpService, jwtService: JwtService, configService: ConfigService);
    private logger;
    authenticateUser(code: string, state: string): Promise<{
        username?: string;
        accessToken?: string;
        twoFARedirect?: boolean;
    }>;
    getInfoFromAPI(access_token: string): Promise<any>;
    validateToken(access_token: string): Promise<User>;
    customWsGuard(access_token: string): Promise<User | null>;
    registerUserBasicAuth(username: string, password: string): Promise<User>;
    authenticateUserBasicAuth(username: string, password: string): Promise<{
        username?: string;
        accessToken?: string;
        twoFARedirect?: boolean;
    }>;
}
