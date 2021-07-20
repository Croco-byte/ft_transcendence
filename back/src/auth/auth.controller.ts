import { Controller, Post, Body, BadRequestException } from "@nestjs/common";
import { AuthService } from "./auth.service";


@Controller('/login')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post()
	authenticateUser(@Body('code') code: string, @Body('state') state: string) {
		if (code == '' || state == '') {
			return new BadRequestException();
		} else {
			return this.authService.authenticateUser(code, state);
		}
	}
}
