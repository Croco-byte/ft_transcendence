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

	async generateTwoFactorAuthenticationSecret(user: User) {
		let secret: string;
		const existingUser = await User.findOne({ where: { id: user.id } });
		if (existingUser && existingUser.twoFactorAuthenticationSecret) {
			console.log("Using existing secret");
			secret = existingUser.twoFactorAuthenticationSecret;
		}
		else {
			console.log("Generating a new secret");
			secret = authenticator.generateSecret();
			await this.usersService.setTwoFactorAuthenticationSecret(secret, user.id);
		}
		const otpauthUrl = authenticator.keyuri(user.username, this.configService.get('TWO_FACTOR_AUTHENTICATION_APP_NAME'), secret);

		return { secret, otpauthUrl };
	}

	async pipeQrCodeStream(stream: Response, otpauthUrl: string) {
		return toFileStream(stream, otpauthUrl);
	}

	async isTwoFactorAuthenticationCodeValid(twoFactorAuthenticationCode: string, id: number) {
		const user = await User.findOne({ where: { id: id } });
		if (!user) {
			throw new UnauthorizedException();
		}
		const result = authenticator.verify({ token: twoFactorAuthenticationCode, secret: user.twoFactorAuthenticationSecret });
		if (!result) {
			console.log("Verify function returned 'false' for code " + twoFactorAuthenticationCode + " and secret " + user.twoFactorAuthenticationSecret);
			throw new ForbiddenException();
		}
		return (result);
	}
}
