import { Controller, Req, Logger, Get, Post, Patch, Delete, Query, Param, Body, UseGuards, Request, UnauthorizedException, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { Channel } from './channel.entity';
import ChannelService from './channel.service';
import StringUtils from 'src/utils/string';
import { UsersService } from 'src/users/users.service';
import { AppGateway } from 'src/channels/channel.gateway';
import JwtTwoFactorGuard from 'src/auth/jwt-two-factor-auth.guard';
import { request } from 'express';
import { User } from 'src/users/users.entity';
import MessageService from 'src/messages/message.service';
import { CreateChannelDto, EditTypeDto } from './dto/channel.dto';
import * as bcrypt from 'bcrypt';

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
	async createChannel(@Request() req, @Body() body: CreateChannelDto)
	{
		let channel : Channel;
		channel = new Channel;

		let user = await this.userService.findById(req.user.id)

		channel.type = 'public'
		channel.name = body.name;
		const invalidChars = /^[a-zA-Z0-9-_]+$/;
		if (channel.name.search(invalidChars) === -1 || channel.name.length > 15) throw new ForbiddenException("Invalid characters in channel name or channel name too long");
		channel.requirePassword = false;
		channel.password = '';
		channel.creationDate = new Date();
		channel.isDirect = body.isDirect;
		channel.modifiedDate = new Date();
		channel.lastMessage = null;
		channel.users = [user];
		channel.administrators = [];
		channel.owner = user;

		if (channel.isDirect)
		{
			let to = await this.userService.findByUsername(body.to_user);
			if (!to)
				throw new NotFoundException("User " + body.to_user + " not found !");
			channel.type = "private";
			channel.users.push(to);
			channel.administrators = channel.users;
			channel.name = user.username + '_' + to.username; 
			let exists = await this.channelService.directExists(user, to);
			if (exists)
				return {id: exists.id};
		}
		channel = await this.channelService.insert(channel);

		this.websocketGateway.joinChannel(channel, user);
		if (channel.type == "public")
			this.websocketGateway.createChannel();
		else if (channel.type == "private" && channel.isDirect)
			this.websocketGateway.joinChannel(channel, channel.users[1]);
		return {message: "Channel " + body.name + " successfully created", id: channel.id};
	}

	@Get()
	async getChannels(@Request() req)
	{
		let user = await this.userService.findById(req.user.id);
		if (!user)
			throw new UnauthorizedException("You are not authorized to perform this action.");

		let ret: Object[];
		let channels = await this.channelService.findAll();
		ret = new Array();

		for (let i = 0; i < channels.length; i++)
		{
			let channel = 
				{
					id: channels[i].id,
					name: channels[i].name,
					type: channels[i].type,
					lastMessage: channels[i].lastMessage,
					modifiedDate: channels[i].modifiedDate.toLocaleString().replace(',', ''),
					creationDate: channels[i].creationDate.toLocaleDateString().replace(',', ''),
					userRole: this.channelService.getUserRole(channels[i], user),
					isJoined: this.channelService.isInChannel(channels[i], user),
					requirePassword: channels[i].requirePassword,
					owner: (channels[i].owner ? channels[i].owner.toPublic() : null),
					members: [],
					administrators: [],
				};
			Object.assign(channel.members, await Promise.all(channels[i].users.map(async (user) =>
			{
				let ret = user.toPublic();
				ret["isMuted"] = await this.channelService.isMuted(channels[i], user);
				ret["isBanned"] = await this.channelService.isBanned(channels[i], user);
				ret["isAdmin"] = this.channelService.isAdmin(channels[i], user);
				return (ret);
			})));
			Object.assign(channel.administrators, await Promise.all(channels[i].administrators.map(async (user) =>
			{
				let ret = user.toPublic();
				ret["isMuted"] = await this.channelService.isMuted(channels[i], user);
				ret["isBanned"] = await this.channelService.isBanned(channels[i], user);
				return (ret);
			})));
			ret.push(channel);
		}
		return {channels: ret};
	}

	@Get("public")
	async getPublicChannels(@Req() req)
	{
		let user = await this.userService.findById(req.user.id);
		if (!user)
			throw new UnauthorizedException("You are not authorized to perform this action.");

		let ret: Object[];
		let channels = await this.channelService.findAllPublicChannels();
		ret = new Array();

		for (let i = 0; i < channels.length; i++)
		{
			ret.push(
				{
					id: channels[i].id,
					name: channels[i].name,
					lastMessage: channels[i].lastMessage,
					modifiedDate: channels[i].modifiedDate.toLocaleString().replace(',', ''),
					userRole: this.channelService.getUserRole(channels[i], user),
					isJoined: this.channelService.isInChannel(channels[i], user),
					requirePassword: channels[i].requirePassword,
					isDirect: false
				}
			);
		}
		return ret;
	}

	@Get("joined")
	async getJoinedChannels(@Req() req)
	{
		let user = await this.userService.findById(req.user.id);
		if (!user)
			throw new UnauthorizedException("You are not authorized to perform this action.");

		let ret: Object[];
		let channels = await this.channelService.findAllJoinedChannels(user);
		ret = new Array();

		for (let i = 0; i < channels.length; i++)
		{
			ret.push(
				{
					id: channels[i].id,
					name: channels[i].name,
					lastMessage: channels[i].lastMessage,
					modifiedDate: channels[i].modifiedDate.toLocaleString().replace(',', ''),
					userRole: this.channelService.getUserRole(channels[i], user),
					isJoined: true,
					requirePassword: channels[i].requirePassword,
					isDirect: false
				}
			);
		}
		return ret;
	}

	@Get("direct")
	async getDirects(@Req() req)
	{
		let user = await this.userService.findById(req.user.id);
		if (!user)
			throw new UnauthorizedException("You are not authorized to perform this action.");

		let ret: Object[];
		let channels = await this.channelService.findAllDirectChannels(user);
		ret = new Array();

		for (let i = 0; i < channels.length; i++)
		{
			let isBlocked = false;
			let u1 = channels[i].users[0];
			let u2 = channels[i].users[1];
			if (u1.blocked.findIndex(b => b.id == u2.id) != -1)
				isBlocked = true;
			if (u2.blocked.findIndex(b => b.id == u1.id) != -1)
				isBlocked = true;

			if (isBlocked)
				continue ;

			let second_user = channels[i].users.filter(u => u.id != user.id)[0];
			ret.push(
				{
					id: channels[i].id,
					name: second_user.displayname,
					lastMessage: channels[i].lastMessage,
					modifiedDate: channels[i].modifiedDate.toLocaleString().replace(',', ''),
					userRole: this.channelService.getUserRole(channels[i], user),
					isJoined: true,
					requirePassword: false,
					isDirect: true,
					members:
					[
						user.toPublic(),
						second_user.toPublic()
					]
				}
			);
		}
		return ret;
	}

	@Delete(":channelID")
	async deleteChannel(@Param("channelID") channelID: string, @Request() req)
	{
		let user = await this.userService.findOne(req.user.id);
		if (!user)
			throw new UnauthorizedException("User not found");
		let channel = await this.channelService.findOne(channelID);
		if (!channel)
			throw new NotFoundException("Channel not found");
		if (user.is_admin !== 'owner' && user.is_admin !== 'moderator')
			throw new ForbiddenException("You must be the website admin to perform this action");
		// If user is not admin of website - unauthorized
		channel = await this.channelService.clean(channel);
		await this.channelService.delete(channelID).then(() =>
		{
			this.websocketGateway.destroyChannel(channelID, channel.users, channel.name);
			return {message: "Channel deleted successfully"};
		});
	}

	@Get(":channelID/info")
	async getInfo(@Param('channelID') channelID: string, @Request() req)
	{
		let user = await this.userService.findOne(req.user.id);
		if (!user)
			throw new UnauthorizedException("You are not authorized to perform this action.");
		return await this.channelService.findOne(channelID).then(async c =>
		{
			if (!c)
				throw new NotFoundException("Channel not found");
			if (c.pending_users.findIndex(tmp_user => tmp_user.id == user.id) != -1)
				throw new UnauthorizedException("You must authenticate to access to this channel !");

			let channel = {...c};
			delete channel.pending_users;
			Object.assign(channel.users, await Promise.all(c.users.map(async (user) =>
			{
				let ret = user.toPublic();
				ret["isMuted"] = await this.channelService.isMuted(c, user);
				ret["isBanned"] = await this.channelService.isBanned(c, user);
				ret["isAdmin"] = this.channelService.isAdmin(c, user);
				ret["displayname"] = user.displayname;
				return (ret);
			})));
			Object.assign(channel.administrators, await Promise.all(c.administrators.map(async (user) =>
			{
				let ret = user.toPublic();
				ret["isMuted"] = await this.channelService.isMuted(c, user);
				ret["isBanned"] = await this.channelService.isBanned(c, user);
				return (ret);
			})));
			return channel;
		});
	}

	@Post(":channelID/members")
	async addMember(@Param('channelID') channelID: string, @Body() body, @Request() req)
	{
		let user = await this.userService.findById(req.user.id);
		if (!user)
			throw new NotFoundException("User not found");
		let channel = await this.channelService.findOne(channelID);
		if (!channel)
			throw new NotFoundException("Channel not found");
			
		if (channel.requirePassword && !body.password)
			throw new BadRequestException("A password is required to join this channel");
		
		if (channel.requirePassword && !(await this.channelService.check_password(channel, body.password)))
			throw new UnauthorizedException("Invalid Password for channel '" + channel.name + "'");

		this.channelService.addUser(channel, user, false);
		this.websocketGateway.joinChannel(channel, user);
		this.websocketGateway.addMember("channel_" + channel.id, user.username + " join this channel !", channel);
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

		if (!user)
			throw new NotFoundException("User not found");
		let channel = await this.channelService.findOne(channelID)
		if (!channel)
			throw new NotFoundException("Channel not found");
		let username = body.username;
	
		if ((!channel.owner || channel.owner.id != user.id)
			&& !(user.is_admin == "owner" || user.is_admin == "moderator"))
			throw new UnauthorizedException("You must be the owner to perform this action");

		return await this.userService.findByUsername(username).then((admin) =>
		{
			if (!this.channelService.isInChannel(channel, admin))
				throw new NotFoundException("Member " + admin.username + " not found in this channel");
			this.channelService.addAdmin(channel, admin);
			return {message: "Administrator '" + admin.displayname + "' added successfully"};
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
				if (!this.channelService.isAdmin(channel, curr_user)
					&& !this.channelService.isOwner(channel, curr_user)
					&& !(curr_user.is_admin == "owner" || curr_user.is_admin == "moderator"))
					throw new UnauthorizedException("You must be an administrator to perform this action.");

				if (this.channelService.isAdmin(channel, user)
					&& !this.channelService.isOwner(channel, curr_user)
					&& !(curr_user.is_admin == "owner" || curr_user.is_admin == "moderator"))
					throw new UnauthorizedException("You must be the owner of this channel to mute Admin");

				if ((await this.channelService.isMuted(channel, user)) == false)
					this.channelService.muteUser(channel, user);
			});
		});
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
				if (!this.channelService.isAdmin(channel, curr_user)
					&& !this.channelService.isOwner(channel, curr_user)
					&& !(curr_user.is_admin == "owner" || curr_user.is_admin == "moderator"))
					throw new UnauthorizedException("You must be an administrator to perform this action.");

				if (this.channelService.isAdmin(channel, user)
					&& !this.channelService.isOwner(channel, curr_user)
					&& !(curr_user.is_admin == "owner" || curr_user.is_admin == "moderator"))
					throw new UnauthorizedException("You must be the owner of this channel to unmute Admin");

				this.channelService.unmuteUser(channel, user);
			});
		});
		return {message: "User " + username + " unmuted successfully"};
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
				if (!this.channelService.isAdmin(channel, curr_user)
					&& !this.channelService.isOwner(channel, curr_user)
					&& !(curr_user.is_admin == "owner" || curr_user.is_admin == "moderator"))
					throw new UnauthorizedException("You must be an administrator to perform this action.");

				if (this.channelService.isAdmin(channel, user)
					&& !this.channelService.isOwner(channel, curr_user)
					&& !(curr_user.is_admin == "owner" || curr_user.is_admin == "moderator"))
					throw new UnauthorizedException("You must be the owner of this channel to ban Admin");

				if ((await this.channelService.isBanned(channel, user)) == false)
					this.channelService.banUser(channel, user);
				await this.websocketGateway.leaveChannel(channel, user);
			});
		});
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
				if (!this.channelService.isAdmin(channel, curr_user)
					&& !this.channelService.isOwner(channel, curr_user)
					&& !(curr_user.is_admin == "owner" || curr_user.is_admin == "moderator"))
					throw new UnauthorizedException("You must be an administrator to perform this action.");

				if (this.channelService.isAdmin(channel, user)
					&& !this.channelService.isOwner(channel, curr_user)
					&& !(curr_user.is_admin == "owner" || curr_user.is_admin == "moderator"))
					throw new UnauthorizedException("You must be the owner of this channel to unban Admin");

				if (await this.channelService.isBanned(channel, user))
				{
					this.channelService.unbanUser(channel, user);
					await this.websocketGateway.joinChannel(channel, user);
				}
			});
		});
		return {message: "User " + username + " unbanned successfully"};
	}

	@Post(":channelID/messages")
	async sendMessage(@Param('channelID') channelID: string, @Body() data, @Request() req)
	{
		let channel: Channel;
		channel = await this.channelService.findOne(data.channel);

		let user = await this.userService.findById(req.user.id);

		if (!channel)
			throw new NotFoundException("Channel not found !");
		if (!user)
			throw new NotFoundException("User not found !");
		if (!this.channelService.isInChannel(channel, user))
			throw new UnauthorizedException("You must join this channel to perform this action !");
		
		if (await this.channelService.isMuted(channel, user)
			|| await this.channelService.isBanned(channel, user)
			|| this.channelService.isPendingUser(channel, user))
			throw new UnauthorizedException("User cannot send message in this channel");
		
		if (channel.isDirect)
		{
			let isBlocked = false;
			let u1 = channel.users[0];
			let u2 = channel.users[1];
			if (u1.blocked.findIndex(b => b.id == u2.id) != -1)
				isBlocked = true;
			if (u2.blocked.findIndex(b => b.id == u1.id) != -1)
				isBlocked = true;
			if (isBlocked)
				throw new ForbiddenException("You can't send message to this user.");
		}
		await this.messageService.add(channel, user, data.content).then(async (message) =>
		{
			await this.channelService.updateModifiedDate(channel);
			this.websocketGateway.sendNewMessage('channel_' + data.channel, {id: message.id, channel: data.channel, user: user.displayname, content: message.content, user_id: user.id}, user, channel);
		});
	}

	@Get(":channelID")
	async getChannel(@Param('channelID') channelID: string, @Request() req)
	{
		let user = await this.userService.findById(req.user.id);
		let channel = await this.channelService.findOne(channelID);

		if (!channel)
			throw new NotFoundException("Channel not found");
		if (!this.channelService.isInChannel(channel, user))
			throw new NotFoundException("You must join this channel !")
		if (await this.channelService.isBanned(channel, user))
			throw new UnauthorizedException("You are not authorized to perform this action.");
		if (this.channelService.isPendingUser(channel, user))
			throw new UnauthorizedException({message: "You must authenticate to access to this channel !", authentify_in_channel: true});
			
		let messages = await this.channelService.getMessages(channel);
		let blockedUsers = await this.userService.getBiDirectionalBlockedUsers(user);
		messages = messages.filter(msg => (blockedUsers.findIndex(u => u.id == msg.user.id) == -1));
		for (let i = 0; i < messages.length; i++)
		{
			messages[i].user_id = messages[i].user.id;
			messages[i].user = messages[i].user.displayname;
			delete messages[i].channel;  //messages[i].channel_id = messages[i].channel.id;
		}
		let role: "MEMBER" | "ADMIN" | "OWNER";
		if (this.channelService.isOwner(channel, user))
			role = "OWNER";
		else if (this.channelService.isAdmin(channel, user))
			role = "ADMIN";
		else
			role = "MEMBER";
		return {messages: messages, user_role: role};
	}

	@Patch(":channelID/name")
	async changeName(@Param('channelID') channelID: string, @Body() body, @Request() req)
	{
		let user = await this.userService.findById(req.user.id);
		if (!user)
			throw new UnauthorizedException("You must be an administrator to perform this action");
		let newName = body.new_name;

		let channel = await this.channelService.findOne(channelID);

		if (!this.channelService.isAdmin(channel, user))
			throw new UnauthorizedException("You must be an administrator to perform this action");
		channel.name = newName;
		await this.channelService.save(channel);

		return {message: "Channel " + channelID + " renamed '" + newName + "'"};
	}

	@Patch(":channelID/password")
	async changePassword(@Param('channelID') channelID: string, @Body() body, @Request() req)
	{
		let password = body.password;

		if (!password || password.length == 0)
			throw new BadRequestException("Password cannot be empty");

		let channel = await this.channelService.findOne(channelID);

		let user = await this.userService.findById(req.user.id);
		if (!channel.owner || channel.owner.id != user.id)
			throw new UnauthorizedException("You must be the owner of this channel to perform this action");

		await this.channelService.addPassword(channel, password);
		this.websocketGateway.activePassword(channel);
		return {message: "Password changed successfully to '" + password + "'"};
	}

	@Delete(":channelID/password")
	async removePassword(@Param('channelID') channelID: string, @Body() body, @Request() req)
	{
		let channel = await this.channelService.findOne(channelID);

		let user = await this.userService.findById(req.user.id);
		if (!channel.owner || channel.owner.id != user.id)
			throw new UnauthorizedException("You must be the owner of this channel to perform this action");

		await this.channelService.removePassword(channel);

		this.websocketGateway.deletePassword(channel);

		return {message: "Password removed successfully"};
	}

	@Post(":channelID/check_password")
	async checkPassword(@Param('channelID') channelID: string, @Body() body, @Request() req)
	{
		let user = await this.userService.findById(req.user.id);
		if (!user)
			throw new UnauthorizedException("You are not authorized to perform this action.");

		let channel = await this.channelService.findOne(channelID);
		if (!channel)
			throw new NotFoundException("Channel not found");

		if (this.channelService.check_password(channel, body.channel))
			await this.channelService.removePendingUser(channel, user);
		else
			throw new UnauthorizedException("Invalid password");
	}

	@Delete("/:channelID/members")
	async leaveChannel(@Param("channelID") channelID: string, @Request() req)
	{
		let user = await this.userService.findById(req.user.id);
		let channel = await this.channelService.findOne(channelID);
		if (!user)
			throw new UnauthorizedException();
		if (!channel)
			throw new NotFoundException("Channel not found");
		if (!this.channelService.isInChannel(channel, user))
			throw new NotFoundException("User not in this channel");
		await this.channelService.removeUser(channel, user);
		this.websocketGateway.leaveChannel(channel, user);
		this.websocketGateway.notifChannel("channel_" + channel.id, "member_leave", user.username + " leave channel " + channel.name, channel);
	}
	
	@Delete("/:channelID/members/:username")
	async kickMember(@Param("channelID") channelID: string, @Param("username") username: string, @Request() req)
	{
		let user = await this.userService.findById(req.user.id);
		let channel = await this.channelService.findOne(channelID);
		if (!user)
			throw new UnauthorizedException();
		if (!channel)
			throw new NotFoundException("Channel not found");
		if (!this.channelService.isAdmin(channel, user) && !this.channelService.isOwner(channel, user))
			throw new UnauthorizedException("You must be an administrator to perform this action.");
		let kicked_user = await this.userService.findByUsername(username);
		if (!kicked_user)
			throw new NotFoundException("User not found");
		if (!this.channelService.isInChannel(channel, kicked_user))
			throw new NotFoundException("User not in this channel");
		if (this.channelService.isAdmin(channel, kicked_user) && !this.channelService.isOwner(channel, user))
			throw new UnauthorizedException("You must be the owner to perform this action");
		if (channel.owner && channel.owner.id == kicked_user.id)
			throw new UnauthorizedException("You cannot kick owner of a channel !");
		await this.channelService.removeUser(channel, kicked_user);
		this.websocketGateway.kickMember(kicked_user, channel);
		this.websocketGateway.leaveChannel(channel, kicked_user);
		this.websocketGateway.notifChannel("channel_" + channel.id, "member_leave", kicked_user.username + " leave channel " + channel.name, channel);
	}

	@Delete("/:channelID/admin/:username")
	async deleteAdmin(@Param("channelID") channelID: string, @Param("username") username: string, @Request() req)
	{
		let user = await this.userService.findUserById(req.user.id);
		let channel = await this.channelService.findOne(channelID);
		if (!user)
			throw new UnauthorizedException("User not found");
		if (!channel)
			throw new NotFoundException("Channel not found");
		if (!this.channelService.isOwner(channel, user)
			&& !(user.is_admin == "owner" || user.is_admin == "moderator"))
			throw new UnauthorizedException("You must be the owner of this channel to perform this action.");
		let ex_admin = await this.userService.findByUsername(username);
		if (!ex_admin || !this.channelService.isInChannel(channel, ex_admin))
			throw new NotFoundException("User not found");
		this.channelService.removeAdmin(channel, ex_admin);
	}

	@Get("/:channelID/invitation")
	async generateLink(@Param("channelID") channelID: string, @Request() req)
	{
		let user = await this.userService.findById(req.user.id);
		if (!user)
			throw new NotFoundException("User not found");
		let channel = await this.channelService.findOne(channelID);
		if (!channel)
			throw new NotFoundException("Channel not found");
		if (!this.channelService.isInChannel(channel, user))
			throw new UnauthorizedException("User not in this channel");
		let link = await this.channelService.generateInvitation(channel, user);
		return {link: "/invitations/" + link}
	}

	@Patch(":channelID/type")
	async editType(@Param("channelID") channelID: string, @Body() body: EditTypeDto, @Request() req)
	{
		let user = await this.userService.findById(req.user.id);
		if (!user)
			throw new NotFoundException("User not found");
		let channel = await this.channelService.findOne(channelID);
		if (!channel)
			throw new NotFoundException("Channel not found");
		if (!this.channelService.isOwner(channel, user))
			throw new UnauthorizedException("You must be the owner of this channel to perform this action");
		await this.channelService.setChannelType(channel, body.type);
		this.websocketGateway.changeType(channel);
	}
}
