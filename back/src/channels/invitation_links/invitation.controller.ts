import { Controller, Delete, Get, NotFoundException, Param, Req, UnauthorizedException, UseGuards } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import JwtTwoFactorGuard from "src/auth/jwt-two-factor-auth.guard";
import { UsersService } from "src/users/users.service";
import { Repository } from "typeorm";
import { Channel } from "../channel.entity";
import ChannelService from "../channel.service";
import { InvitationService } from "./invitation.service";
import { InvitationLink } from "./invitation_link.entity";

@Controller("invitations")
@UseGuards(JwtTwoFactorGuard)
export class InvitationController
{
	constructor(
				private service: InvitationService,
				private userService: UsersService,
				private channelService: ChannelService
				)
	{

	}

	@Delete("/:id")
	async joinChannel(@Param("id") invitation_id: string, @Req() req)
	{
		let user = await this.userService.findById(req.user.id);
		if (!user)
			throw new UnauthorizedException("You must be logged in to perform this action !");

		let link = await this.service.getLink(invitation_id);
		if (!link)
			throw new NotFoundException("Invitiation link not found or expired !");
		await this.channelService.addUser(link.channel, user);
		await this.service.removeLink(link);
		return {channel_name: link.channel.name};
	}
}