import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable } from "@nestjs/common";

/* This AuthGuard simply verifies the validity of a JWT Token passed as a header of a request.
** DO NOT USE THIS ONE : it is only used to allow a user having 2FA activated to reach the page
** where he can input his 2FA code. For every other endpoint, use the JwtTwoFactorGuard, that works
** whether the user activated 2FA or not.
*/

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor() {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKey: 'sup3r_secret_JWT_s3cret_strIng',
		});
	}

	async validate(payload: any) {
		return { id: payload.id, username: payload.username };
	}
}
