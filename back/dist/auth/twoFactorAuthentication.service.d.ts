import { Response } from 'express';
import { UsersService } from 'src/users/users.service';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/users.entity';
export declare class TwoFactorAuthenticationService {
    private readonly usersService;
    private readonly configService;
    constructor(usersService: UsersService, configService: ConfigService);
    generateTwoFactorAuthenticationSecret(user: User): Promise<{
        secret: string;
        otpauthUrl: string;
    }>;
    pipeQrCodeStream(stream: Response, otpauthUrl: string): Promise<any>;
    isTwoFactorAuthenticationCodeValid(twoFactorAuthenticationCode: string, id: number): Promise<true>;
}
