import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { authenticator } from 'otplib';
import { toFileStream } from 'qrcode';
import { Response } from 'express';
import { UsersService } from 'src/users/users.service';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/users.entity';

@Injectable()
export class TwoFactorAuthenticationService {
	constructor(private readonly usersService: UsersService, private readonly configService: ConfigService) {}

	/* This function generates a new secret, that is required to register our app to Google Authenticator
	** (either with the secret itself, or with a QR code generated with this secret).
	** If the user already generated a secret, we use the existing secret.
	*/

	async generateTwoFactorAuthenticationSecret(user: User) {
		let secret: string;
		const existingUser = await User.findOne({ where: { id: user.id } });
		if (existingUser && existingUser.twoFactorAuthenticationSecret) {
			secret = existingUser.twoFactorAuthenticationSecret;
		}
		else {
			secret = authenticator.generateSecret();
			await this.usersService.setTwoFactorAuthenticationSecret(secret, user.id);
		}
		const otpauthUrl = authenticator.keyuri(user.username, this.configService.get('TWO_FACTOR_AUTHENTICATION_APP_NAME'), secret);

		return { secret, otpauthUrl };
	}

	/* This function creates then returns a QR Code from a secret */
	async pipeQrCodeStream(stream: Response, otpauthUrl: string) {
		return toFileStream(stream, otpauthUrl);
	}

	/* This function verifies the validity of a 2FA code */
	async isTwoFactorAuthenticationCodeValid(twoFactorAuthenticationCode: string, id: number) {
		const user = await User.findOne({ where: { id: id } });
		if (!user) {
			throw new UnauthorizedException();
		}
		const result = authenticator.verify({ token: twoFactorAuthenticationCode, secret: user.twoFactorAuthenticationSecret });
		if (!result) {
			throw new ForbiddenException();
		}
		return (result);
	}
}
