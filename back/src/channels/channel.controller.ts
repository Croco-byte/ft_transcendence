import { Controller, Req, Logger, Get, Post, Patch, Delete, Query, Param, Body, UseGuards, Request, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { Channel } from './channel.entity';
import ChannelService from './channel.service';
import StringUtils from 'src/utils/string';
import { UsersService } from 'src/users/users.service';
import { AppGateway } from 'src/app.gateway';
import JwtTwoFactorGuard from 'src/auth/jwt-two-factor-auth.guard';
import { request } from 'express';
import { User } from 'src/users/users.entity';
import MessageService from 'src/messages/message.service';

@Controller('channels')
@UseGuards(JwtTwoFactorGuard)
export class ChannelController
{
	private readonly logger = new Logger(ChannelController.name);

	constructor(private readonly channelService: ChannelService,
				private readonly userService: UsersService,
				private readonly messageService: MessageService,
				private readonly websocketGateway: AppGateway)
	{

	}

	@Get("/test")
	async test(@Request() req)
	{
		let user = await this.userService.findByUsername("yel-alou");
		return await this.userService.getBiDirectionalBlockedUsers(user);
	}

	@Post()
	async createChannel(@Request() req, @Body() body)
	{
		let channel : Channel;
		channel = new Channel;

		let user = await this.userService.findById(req.user.id)

		channel.type = 'group';
		channel.name = body.name;
		channel.requirePassword = true;
		channel.password = 'abcdef';
		channel.creationDate = new Date();
		channel.isDirect = false;
		channel.modifiedDate = new Date();
		channel.lastMessage = null;
		channel.users = [user];
		channel.administrators = [];
		channel.owner = user;

		channel = await this.channelService.insert(channel);

		this.websocketGateway.joinChannel(channel, user);

		this.logger.log("Create new channel named '" + body.name + "'");
		return {message: "Channel " + body.name + " successfully created"};
	}

	@Get()
	async getChannels(@Request() req)
	{
		let user = await this.userService.findById(req.user.id);
		if (!user)
			throw new UnauthorizedException();

		let ret: Object[];
		let channels = user.channels;
		ret = new Array();

		for (let i = 0; i < channels.length; i++)
		{
			ret.push(
				{
					id: channels[i].id,
					name: channels[i].name,
					lastMessage: channels[i].lastMessage,
					modifiedDate: channels[i].modifiedDate.toLocaleString().replace(',', ''),
					userRole: this.channelService.getUserRole(channels[i], user)
				}
			);
		}
		return ret;
	}

	@Delete(":channelID")
	async deleteChannel(@Param("channelID") channelID: string, @Request() req)
	{

		await this.channelService.delete(channelID).then(res =>
		{
			return {message: "Channel deleted successfully"};
		});
	}

	@Get(":channelID/info")
	async getInfo(@Param('channelID') channelID: string, @Request() req)
	{
		let user = await this.userService.findOne(req.user.id);
		if (!user)
			throw new UnauthorizedException();
		return await this.channelService.findOne(channelID).then(async c =>
		{
			if (c.pending_users.findIndex(tmp_user => tmp_user.id == user.id) != -1)
				throw new UnauthorizedException();

			let channel = {...c};
			delete channel.pending_users;
			Object.assign(channel.users, await Promise.all(c.users.map(async (user) =>
			{
				let ret = user.toPublic();
				ret["isMuted"] = await this.channelService.isMuted(c, user);
				ret["isBanned"] = await this.channelService.isBanned(c, user);
				return (ret);
			})));
			Object.assign(channel.administrators, c.administrators.map((user) => user.toPublic()));
			return channel;
		});
	}

	@Post(":channelID/members")
	async addMember(@Param('channelID') channelID: string, @Body() body, @Request() req)
	{
		let curr_user: User;
		curr_user = await this.userService.findById(req.user.id);
		let channel = await this.channelService.findOne(channelID).then(async (channel) =>
		{
			if (this.channelService.isAdmin(channel, curr_user))
				throw new UnauthorizedException("You must be an administrator to perform this action");
			let username = body.username;
		
			return await this.userService.findByUsername(username).then((new_user) =>
			{
				this.channelService.addUser(channel, new_user);

				this.logger.log("Add user '" + new_user.username + "' to this channel");
				return {message: "User " + username + " added successfully"};
			});
		});
	}

	@Get(":channelID/members")
	async getMembers(@Param('channelID') channelID: string, @Request() req)
	{
		return await this.channelService.findOne(channelID).then(async (channel) =>
		{
			return channel.users.map((user) => user.toPublic());
		});
	}

	@Get(":channelID/admin")
	async getAdmin(@Param('channelID') channelID: string, @Request() req)
	{
		return await this.channelService.findOne(channelID).then(async (channel) =>
		{
			return channel.administrators.map((admin) => admin.toPublic());
		});
	}

	@Post(":channelID/admin")
	async addAdmin(@Param('channelID') channelID: string, @Body() body, @Request() req)
	{
		let user: User;
		user = await this.userService.findById(req.user.id);

		return await this.channelService.findOne(channelID).then(async (channel) =>
		{
			let username = body.username;
		
			if (!channel.owner || channel.owner.id != user.id)
				throw new UnauthorizedException("You must be the owner to perform this action");

			return await this.userService.findByUsername(username).then((admin) =>
			{
				this.channelService.addAdmin(channel, admin);

				this.logger.log("New admin (user : '" + admin.username + "') in channel " + channel.name);
				return {message: "Administrator '" + admin.username + "' added successfully"};
			});
		});
	}

	@Post(":channelID/members/:username/mute")
	@UseGuards(JwtTwoFactorGuard)
	async muteUser(@Param('channelID') channelID: string, @Param('username') username: string, @Request() req)
	{
		let curr_user: User;
		curr_user = await this.userService.findById(req.user.id);

		await this.userService.findByUsername(username).then(async user => 
		{
			await this.channelService.findOne(channelID).then(async channel =>
			{
				if (!(await this.channelService.isAdmin(channel, curr_user)))
					throw new UnauthorizedException("You must be an administrator to perform this action.");

				if ((await this.channelService.isMuted(channel, user)) == false)
					this.channelService.muteUser(channel, user);
			});
		});
		this.logger.log("Mute user '" + username + "' to this channel");
		return {message: "User " + username + " muted successfully"};
	}

	@Delete(":channelID/members/:username/unmute")
	async unmuteUser(@Param('channelID') channelID: string, @Param('username') username: string, @Request() req)
	{
		let curr_user: User;
		curr_user = await this.userService.findById(req.user.id);
		await this.userService.findByUsername(username).then(async user => 
		{
			await this.channelService.findOne(channelID).then(async channel =>
			{
				if (!(await this.channelService.isAdmin(channel, curr_user)))
					throw new UnauthorizedException("You must be an administrator to perform this action.");
				this.channelService.unmuteUser(channel, user);
			});
		});
		this.logger.log("Mute user '" + username + "' to this channel");
		return {message: "User " + username + " muted successfully"};
	}

	@Post(":channelID/members/:username/ban")
	async banUser(@Param('channelID') channelID: string, @Param('username') username: string, @Request() req)
	{
		let curr_user: User;
		curr_user = await this.userService.findById(req.user.id);
		await this.userService.findByUsername(username).then(async user => 
		{
			await this.channelService.findOne(channelID).then(async channel =>
			{
				if (!(await this.channelService.isAdmin(channel, curr_user)))
					throw new UnauthorizedException("You must be an administrator to perform this action.");

				if ((await this.channelService.isBanned(channel, user)) == false)
					this.channelService.banUser(channel, user);
				await this.websocketGateway.leaveChannel(channel, user);
			});
		});
		this.logger.log("Ban user '" + username + "' to this channel");
		return {message: "User " + username + " banned successfully"};
	}

	@Delete(":channelID/members/:username/unban")
	async unbanUser(@Param('channelID') channelID: string, @Param('username') username: string, @Request() req)
	{
		let curr_user: User;
		curr_user = await this.userService.findById(req.user.id);
		await this.userService.findByUsername(username).then(async user => 
		{
			await this.channelService.findOne(channelID).then(async channel =>
			{
				if (!(await this.channelService.isAdmin(channel, curr_user)))
					throw new UnauthorizedException("You must be an administrator to perform this action.");
				if (await this.channelService.isBanned(channel, user))
				{
					this.channelService.unbanUser(channel, user);
					await this.websocketGateway.joinChannel(channel, user);
				}
			});
		});
		this.logger.log("Ban user '" + username + "' to this channel");
		return {message: "User " + username + " banned successfully"};
	}

	@Post(":channelID/messages")
	async sendMessage(@Param('channelID') channelID: string, @Body() data, @Request() req)
	{
		let channel: Channel;
		channel = await this.channelService.findOne(data.channel);

		// Change with the true user
		let user: User;
		user = await this.userService.findById(req.user.id);
		
		if (await this.channelService.isMuted(channel, user)
			|| await this.channelService.isBanned(channel, user)
			|| this.channelService.isPendingUser(channel, user))
		{
			throw new UnauthorizedException("User cannot send message in this channel");
		}
		else
		{
			await this.messageService.add(channel, user, data.content).then(async (message) =>
			{
				await this.channelService.updateModifiedDate(channel);
				this.websocketGateway.sendNewMessage('channel_' + data.channel, {id: message.id, channel: data.channel, user: user.username, content: message.content, user_id: user.id}, user, channel);
			});
		}
	}

	@Get(":channelID/messages")
	async getMessages(@Param('channelID') channelID: string, @Request() req)
	{
		let user = await this.userService.findById(req.user.id);
		let messages = await this.channelService.findOne(channelID).then(async (channel) =>
		{
			if (!channel)
			{
				console.log("Error with " + channelID);
				throw new NotFoundException("Channel not found");
			}
			if (await this.channelService.isBanned(channel, user))
				throw new UnauthorizedException();
			if (this.channelService.isPendingUser(channel, user))
				throw new UnauthorizedException({message:"User is on pending in this channel.", authentify_in_channel: true});
			
			return await this.channelService.getMessages(channel);
		});
		for (let i = 0; i < messages.length; i++)
		{
			messages[i].user_id = messages[i].user.id;
			messages[i].user = messages[i].user.username;
			delete messages[i].channel;  //messages[i].channel_id = messages[i].channel.id;
		}
		return messages;
	}

	@Patch(":channelID/name")
	async changeName(@Param('channelID') channelID: string, @Body() body, @Request() req)
	{
		
		let newName = body.new_name;

		let channel = await this.channelService.findOne(channelID);
		channel.name = newName;
		this.channelService.save(channel);

		this.logger.log("Channel " + channelID + " renamed '" + newName + "'");
		return {message: "Channel " + channelID + " renamed '" + newName + "'"};
	}

	@Patch(":channelID/password")
	async changePassword(@Param('channelID') channelID: string, @Body() body, @Request() req)
	{
		let password = body.password;

		let channel = await this.channelService.findOne(channelID);

		let user = await this.userService.findById(req.user.id);
		if (!channel.owner || channel.owner.id != user.id)
			throw new UnauthorizedException("You must be the owner of this channel to perform this action");

		this.channelService.addPassword(channel, password);

		this.logger.log("Set password of this channel to '" + password + "'");
		return {message: "Password changed successfully to '" + password + "'"};
	}

	@Delete(":channelID/password")
	async removePassword(@Param('channelID') channelID: string, @Body() body, @Request() req)
	{
		let channel = await this.channelService.findOne(channelID);

		let user = await this.userService.findById(req.user.id);
		if (!channel.owner || channel.owner.id != user.id)
			throw new UnauthorizedException("You must be the owner of this channel to perform this action");

		this.channelService.removePassword(channel);

		this.logger.log("Password removed for this channel");
		return {message: "Password removed successfully"};
	}

	@Post(":channelID/check_password")
	async checkPassword(@Param('channelID') channelID: string, @Body() body, @Request() req)
	{
		let user = await this.userService.findById(req.user.id);
		if (!user)
			throw new UnauthorizedException();

		let channel = await this.channelService.findOne(channelID);
		if (!channel)
			throw new NotFoundException("Channel not found");

		if (channel.password == body.password)
		{
			this.channelService.removePendingUser(channel, user);
			return ;
		}
		else
			throw new UnauthorizedException();
	}

	@Delete("/:channelID/members")
	async leaveChannel(@Param("channelID") channelID: string, @Request() req)
	{
		let user = await this.userService.findById(req.user.id);
		let channel = await this.channelService.findOne(channelID);
		if (channel.users.findIndex((u) => u.id == user.id) == -1)
			throw new NotFoundException("User not in this channel");
		await this.channelService.removeUser(channel, user);
	}
}
