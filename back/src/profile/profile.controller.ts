import { Controller, Get, Headers, UnauthorizedException, UseGuards } from "@nestjs/common";
import { ProfileService } from "./profile.service";
import  JwtAuthenticationGuard from '../auth/jwt-auth.guard';


@Controller('/profile')
export class ProfileController {
	constructor(private readonly profileService: ProfileService) {}

	@Get()
	@UseGuards(JwtAuthenticationGuard)
	async getAccount() {
		try {
			const result =  await this.profileService.getAccountInfo();
			return result;
		} catch {
			throw new UnauthorizedException();
		}
	}
}
