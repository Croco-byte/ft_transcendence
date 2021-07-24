import { Injectable, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { map } from 'rxjs/operators';
import { User } from '../users/users.entity';


@Injectable()
export class AuthService {
	constructor(private readonly httpService: HttpService, private readonly jwtService: JwtService, private readonly configService: ConfigService) {}

	async authenticateUser(code: string, state: string) {
		try {
			const url = this.configService.get<string>('OAUTH_URL');
			const postData = { grant_type: 'authorization_code',
								client_id: this.configService.get<string>('CLIENT_ID'),
								client_secret: this.configService.get<string>('CLIENT_SECRET'),
								code: code,
								redirect_uri: this.configService.get<string>('REDIRECT_URI') }
			const result = await this.httpService.post(url, postData).pipe(map(resp => resp.data)).toPromise();

			const infos = await this.getUserInfo(result.access_token);
			const existingUser = await User.findOne({ where: { username: infos.username } });
			if (!existingUser) {
				console.log("We don\'t have the user " + infos.username + ". Creating it in database.");
				const newUser = User.create();
				newUser.username = infos.username;
				await User.save(newUser);
			}
			const user = await User.findOne({ where: { username: infos.username } });
			var returnObject: any = {};
			returnObject.username = infos.username;
			returnObject.accessToken = this.jwtService.sign({ user_id: user.id, username: user.username, isSecondFactorAuthenticated: false }, { expiresIn: '24h' });
			if (user.isTwoFactorAuthenticationEnabled === true) {
				returnObject.twoFARedirect = true;
			}

			return returnObject;
		} catch(e) {
			console.log(e);
			throw new BadRequestException();
		}
	}

	
	async getUserInfo(access_token: string) {
		const headersRequest = { 'Authorization': 'Bearer ' + access_token };
		const info = await this.httpService.get(this.configService.get<string>('42_API'), { headers: headersRequest }).pipe(
			map(resp => resp.data)
		).toPromise();

		var infos: any = {};
		infos.username = info.login;

		return infos;
	}
}
