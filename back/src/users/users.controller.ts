import { Controller, Post, Get, UseGuards, Param } from "@nestjs/common";
import JwtTwoFactorGuard from "src/auth/jwt-two-factor-auth.guard";
import { UsersService } from "./users.service";

@Controller('/user')
export class UserController {
	constructor(private readonly userService: UsersService) {}

	@Get(':userId')
	@UseGuards(JwtTwoFactorGuard)
	findUserById(@Param('userId') userId: number) {
		return this.userService.findUserById(userId);
	}
}
