/* eslint-disable prettier/prettier */
import { Injectable, BadRequestException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { HttpService } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { map } from 'rxjs/operators';
import { User } from '../users/users.entity';


@Injectable()
export class AuthService {
	constructor(private readonly httpService: HttpService, private readonly jwtService: JwtService, private readonly configService: ConfigService) {}

	/* This function allows to authenticate the user. It takes the code returned by 42 OAuth, and verifies that it is valid
	** by retrieving an OAuth token with it. Once we confirmed the validity of the code, this means that the user correctly
	** logged in with 42 OAuth mechanism. We use the token to retrieve the user's 42 username (which is unique). If there
	** isn't already a user with this username in database, we create it. We then use the user ID and username to create a
	** JWT.
	** This JWT didn't go through the 2FA process. For users that have 2FA activated, it will only allow them to get to the
	** 2FA page. We indicate that the user needs further 2FA processing if the user has 2FA activated, so the front can redirect
	** to the 2FA page. 
	*/

	async authenticateUser(code: string, state: string) {
		try {
			const url = this.configService.get<string>('OAUTH_URL');
			const postData = { grant_type: 'authorization_code',
								client_id: this.configService.get<string>('CLIENT_ID'),
								client_secret: this.configService.get<string>('CLIENT_SECRET'),
								code: code,
								redirect_uri: this.configService.get<string>('REDIRECT_URI') }
			const result = await this.httpService.post(url, postData).pipe(map(resp => resp.data)).toPromise();
			const infos = await this.getInfoFromAPI(result.access_token);
			const existingUser = await User.findOne({ where: { username: infos.username } });
			if (!existingUser) {
				console.log("We don\'t have the user " + infos.username + ". Creating it in database.");
				const newUser = User.create();
				newUser.username = infos.username;
				newUser.displayName = infos.username;
				await User.save(newUser);
			}
			const user = await User.findOne({ where: { username: infos.username } });
			let returnObject : { username?: string, accessToken?: string, twoFARedirect?: boolean };
			returnObject = {};
			returnObject.username = infos.username;
			returnObject.accessToken = this.jwtService.sign({ id: user.id, username: user.username, isSecondFactorAuthenticated: false }, { expiresIn: '24h' });
			if (user.isTwoFactorAuthenticationEnabled === true) {
				returnObject.twoFARedirect = true;
			}

			return returnObject;
		} catch(e) {
			throw e;
		}
	}

	/* This function uses a valid OAuth token from 42 to retrieve some information about the user. */
	async getInfoFromAPI(access_token: string) {
		const headersRequest = { 'Authorization': 'Bearer ' + access_token };
		const info = await this.httpService.get(this.configService.get<string>('42_API'), { headers: headersRequest }).pipe(
			map(resp => resp.data)
		).toPromise();

		var infos: any = {};
		infos.username = info.login;
		return infos;
	}

	/* A simple function that verifies the validity of a JWT, and returns the corresponding User object */
	async validateToken(access_token: string): Promise<User> {
		try {
			const decoded = await this.jwtService.verify(access_token);
			const user = User.findOne(decoded.id);
			return user;
		} catch {
			throw new UnauthorizedException();
		}
	}

	async customWsGuard(access_token: string): Promise<User | null> {
		try {
			const user = await this.validateToken(access_token);
			return user;
		} catch {
			return null;
		}
	}
}
