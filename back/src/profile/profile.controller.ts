import { Controller, Get, Res, UnauthorizedException, UseGuards, Request, Post, UseInterceptors, UploadedFile } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Express } from 'express';
import { ProfileService } from "./profile.service";
import  JwtAuthenticationGuard from '../auth/jwt-auth.guard';
import JwtTwoFactorGuard from '../auth/jwt-two-factor-auth.guard'
import { User } from "src/users/users.entity";
import { diskStorage } from "multer";

@Controller('/profile')
export class ProfileController {
	constructor(private readonly profileService: ProfileService) {}
	
	@Get()
	@UseGuards(JwtTwoFactorGuard)
	async getAccount(@Request() req) {
		try {
			const result =  await this.profileService.getAccountInfo(req.user.user_id);
			return result;
		} catch {
			throw new UnauthorizedException();
		}
	}

	@Post('avatar')
	@UseGuards(JwtTwoFactorGuard)
	@UseInterceptors(FileInterceptor('avatar', {
		storage: diskStorage({
			destination: './images',
		})
	}))
	async saveAvatar(@Request() req, @UploadedFile() file: Express.Multer.File) {
		await this.profileService.updateAvatar(req.user.user_id, file.filename);
		console.log("Updated avatar");
	}

	@Get('avatar')
	@UseGuards(JwtTwoFactorGuard)
	async getAvatar(@Request() req, @Res() res) {
		const user = await User.findOne(({ where: { id: req.user.user_id } }));
		console.log("Trying to send avatar with name " + user.avatar);
		res.sendFile(user.avatar, { root: 'images' });
	}
}
