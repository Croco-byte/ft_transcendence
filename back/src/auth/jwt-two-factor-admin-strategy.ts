import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { HttpException, Injectable } from "@nestjs/common";
import { User } from '../users/users.entity';

@Injectable()
export class JwtTwoFactorAdminStrategy extends PassportStrategy(Strategy, 'jwt-two-factor-admin') {
	constructor() {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKey: 'sup3r_secret_JWT_s3cret_strIng',
		});
	}

	async validate(payload: any) {
		const user = await User.findOne({ where: { id: payload.id } });
		if (user && user.is_blocked) throw new HttpException("You are blocked from the website", 444);
		if (user && user.is_admin !== "owner" && user.is_admin !== "moderator") throw new HttpException("You are not authorized to access this resource", 445);

		if (user && !user.isTwoFactorAuthenticationEnabled) {
			return { id: user.id, username: user.username, is_admin: user.is_admin };
		}
		if (payload && payload.isSecondFactorAuthenticated) {
			return { id: user.id, username: user.username, is_admin: user.is_admin };
		}
		console.log("Token expired, or 2FA enabled, but the user isn't logged in via 2FA. Bouncing him !")
	}
}
