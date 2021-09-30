import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { HttpException, Injectable } from "@nestjs/common";
import { User } from '../users/users.entity';

/* This is the main AuthGuard that allows to ensure that the user is properly authenticated before accessing
** resources in the backend. This Guard :
** >> Decodes the JWT passed as a header of a request.
** >> Extracts the user associated with the JWT from the database.
** >> If this user doesn't have 2FA enabled, it allows access (the JWT was valid so no further check is needed).
** >> If this user has 2FA enabled, it only allows access if the JWT has "isSecondFactorAuthenticated" set to true.
*/

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
		if (payload && payload.id) {
			const user = await User.findOne({ where: { id: payload.id } });
			if (user && user.is_blocked) throw new HttpException("You are blocked from the website", 444);
			if (user && !user.isTwoFactorAuthenticationEnabled) {
				return { id: user.id, username: user.username, is_admin: user.is_admin };
			}
			if (user && payload && payload.isSecondFactorAuthenticated) {
				return { id: user.id, username: user.username, is_admin: user.is_admin };
			}
		}
		console.log("Token expired, or 2FA enabled, but the user isn't logged in via 2FA. Bouncing him !")
	}
}
