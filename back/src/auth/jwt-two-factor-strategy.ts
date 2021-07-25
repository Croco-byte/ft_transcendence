import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable } from "@nestjs/common";
import { User } from '../users/users.entity';

@Injectable()
export class JwtTwoFactorStrategy extends PassportStrategy(Strategy, 'jwt-two-factor') {
	constructor() {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKey: 'sup3r_secret_JWT_s3cret_strIng',
		});
	}

	async validate(payload: any) {
		const user = await User.findOne({ where: { id: payload.user_id } });
		if (!user.isTwoFactorAuthenticationEnabled) {
			return { user_id: payload.user_id, username: payload.username };
		}
		if (payload.isSecondFactorAuthenticated) {
			return { user_id: payload.user_id, username: payload.username };
		}
		console.log("Token expired, or 2FA enabled, but the user isn't logged in via 2FA. Bouncing him !")
	}
}
