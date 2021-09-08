import { UsersService } from "src/users/users.service";
import { Controller, Get, UseGuards } from "@nestjs/common";
import JwtTwoFactorGuard from 'src/auth/jwt-two-factor-auth.guard';

@Controller('/ranking')
@UseGuards(JwtTwoFactorGuard)
export class RankingController
{
	constructor(private userService: UsersService)
	{

	}

	@Get()
	async getRanking()
	{
		return await this.userService.rankUsers();
	}
};