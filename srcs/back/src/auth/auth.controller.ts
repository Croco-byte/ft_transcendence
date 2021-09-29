import { Controller, Post, Body, BadRequestException } from "@nestjs/common";
import { AuthService } from "./auth.service";


@Controller('/login')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	/* The authentication endpoint, that simply calls "authenticateUser" and catches errors */
	@Post()
	authenticateUser(@Body('code') code: string, @Body('state') state: string) {
		if (code == '' || state == '') {
			throw new BadRequestException();
		} else {
			try {
				return this.authService.authenticateUser(code, state);
			} catch(e) {
				throw e;
			}
		}
	}

	@Post('basic_auth_register')
	registerUserBasicAuth(@Body('username') username: string, @Body('password') password: string) {
		try {
			return this.authService.registerUserBasicAuth(username, password);
		} catch (e) {
			throw e;
		}
	}

	@Post('basic_auth_login')
	loginUserBasicAuth(@Body('username') username: string, @Body('password') password: string) {
		try {
			return this.authService.authenticateUserBasicAuth(username, password);
		} catch (e) {
			throw e;
		}
	}

}
