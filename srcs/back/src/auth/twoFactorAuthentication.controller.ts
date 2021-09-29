import { Controller, Post, Res, UseGuards, Req, HttpCode, Body, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { TwoFactorAuthenticationService } from './twoFactorAuthentication.service';
import { UsersService } from 'src/users/users.service';
import { Response } from 'express';
import JwtAuthenticationGuard from './jwt-auth.guard';
import JwtTwoFactorGuard from './jwt-two-factor-auth.guard';
import { JwtService } from '@nestjs/jwt';


@Controller('2fa')
export class TwoFactorAuthenticationController {
	constructor(private readonly twoFactorAuthenticationService: TwoFactorAuthenticationService, private readonly usersService: UsersService, private readonly jwtService: JwtService) {}

	/* Endpoint generating a QR Code that allows to register the application to Google Authenticator, from the 2FA secret of the user. */
	@Post('generate')
	@UseGuards(JwtAuthenticationGuard)
	async register(@Res() response: Response, @Req() req) {
		const { otpauthUrl } = await this.twoFactorAuthenticationService.generateTwoFactorAuthenticationSecret(req.user);
		return this.twoFactorAuthenticationService.pipeQrCodeStream(response, otpauthUrl);
	}

	/* Endpoint allowing to activate 2FA. At the same time, it returns a JWT with isSecondFactorAuthenticated set to "true", since we don't want
	** to kick the user that just activated 2FA for his account
	*/
	@Post('turn-on')
	@HttpCode(200)
	@UseGuards(JwtAuthenticationGuard)
	async turnOnTwoFactorAuthentication(@Body('twoFactorAuthenticationCode') twoFactorAuthenticationCode : string, @Req() req) {
		try {
			await this.twoFactorAuthenticationService.isTwoFactorAuthenticationCodeValid(twoFactorAuthenticationCode, req.user.id);
		} catch {
			throw new ForbiddenException("Wrong authentication code to turn on 2FA");
		}
		await this.usersService.turnOnTwoFactorAuthentication(req.user.id);
		var returnObject: any = {};
		returnObject.username = req.user.username;
		returnObject.accessToken = this.jwtService.sign({ id: req.user.id, username: req.user.username, isSecondFactorAuthenticated: true }, { expiresIn: '24h' });
		return (returnObject);
	}

	/* Endpoint allowing to turn off 2FA */
	@Post('turn-off')
	@HttpCode(200)
	@UseGuards(JwtTwoFactorGuard)
	async turnOffTwoFactorAuthentication(@Req() req) {
		await this.usersService.turnOffTwoFactorAuthentication(req.user.id);
	}

	/* Endpoint allowing to authenticate with 2FA. This simply verifies the validity of the 2FA code passed in the body of the request,
	** and if it is valid, issues a 2FA JWT
	*/
	@Post('authenticate')
	@HttpCode(200)
	@UseGuards(JwtAuthenticationGuard)
	async authenticate(@Body('twoFactorAuthenticationCode') twoFactorAuthenticationCode: string, @Req() req) {
		try {
			await this.twoFactorAuthenticationService.isTwoFactorAuthenticationCodeValid(twoFactorAuthenticationCode, req.user.id);
		} catch {
			throw new ForbiddenException("Wrong authentication code to logging with 2FA");
		}

		var returnObject: any = {};
		returnObject.username = req.user.username;
		returnObject.accessToken = this.jwtService.sign({ id: req.user.id, username: req.user.username, isSecondFactorAuthenticated: true }, { expiresIn: '24h' });
		return (returnObject);
	}
}
