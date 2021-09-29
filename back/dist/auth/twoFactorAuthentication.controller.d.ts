import { TwoFactorAuthenticationService } from './twoFactorAuthentication.service';
import { UsersService } from 'src/users/users.service';
import { Response } from 'express';
import { JwtService } from '@nestjs/jwt';
export declare class TwoFactorAuthenticationController {
    private readonly twoFactorAuthenticationService;
    private readonly usersService;
    private readonly jwtService;
    constructor(twoFactorAuthenticationService: TwoFactorAuthenticationService, usersService: UsersService, jwtService: JwtService);
    register(response: Response, req: any): Promise<any>;
    turnOnTwoFactorAuthentication(twoFactorAuthenticationCode: string, req: any): Promise<any>;
    turnOffTwoFactorAuthentication(req: any): Promise<void>;
    authenticate(twoFactorAuthenticationCode: string, req: any): Promise<any>;
}
