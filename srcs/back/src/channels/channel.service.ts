import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { tmpdir } from "os";
import ChannelBannedUserService from "./channel_banned_users/channel_banned_user.service";
import ChannelMutedUserRepository from "src/channels/channel_muted_users/channel_muted_user.repository";
import ChannelMutedUserService from "src/channels/channel_muted_users/channel_muted_user.service";
import { Message } from "src/messages/message.entity";
import MessageRepository from "src/messages/message.repository";
import MessageService from "src/messages/message.service";
import { User } from "src/users/users.entity";
import { Connection, getConnection, getRepository, Repository } from "typeorm";
import {Channel} from './channel.entity';
import { InvitationLink } from "./invitation_links/invitation_link.entity";
import { InvitationService } from "./invitation_links/invitation.service";
import * as bcrypt from 'bcrypt';

@Injectable()
export default class ChannelService
{
	private relations : Array<string> = ["users", "users.blocked", "administrators", "owner", "pending_users", "invitation_links"];
	constructor (
				@InjectRepository(Channel) private repository: Repository<Channel>,
				private readonly channelMutedUserService: ChannelMutedUserService,
				private readonly channelBannedUserService: ChannelBannedUserService,
				private readonly messageService: MessageService,
				private invitationService: InvitationService)
	{

	}

	async insert(channel: Channel): Promise<Channel>
	{
		return await this.repository.save(channel);
	}

	async findAllPublicChannels()
	{
		const result = await this.repository
							.createQueryBuilder("channel")
							.leftJoinAndSelect("channel.users", "users")
							.leftJoinAndSelect("channel.administrators", "admins")
							.leftJoinAndSelect("channel.owner", "owner")
							.where("channel.type = 'public'")
							.getMany()
		return result;
	}

	async findAllJoinedChannels(user: User)
	{
		return user.channels.filter(channel => !channel.isDirect);
	}

	async findAllDirectChannels(user: User): Promise<Channel[]>
	{
		let channels = user.channels.filter(channel => channel.isDirect);
		let ids = new Array<number>();
		let ret = new Array<Channel>();
		for (let channel of channels)
		{
			let c = await this.repository.find({relations: this.relations, where: { id: channel.id}});
			ret.push(c[0])
		}
		return ret;
	}

	async findAll(): Promise<Channel[]>
	{
		const result = await this.repository
					.createQueryBuilder("channel")
					.leftJoinAndSelect("channel.users", "users")
					.leftJoinAndSelect("channel.administrators", "admins")
					.leftJoinAndSelect("channel.owner", "owner")
					.getMany()
		return result;
	}
	
	async findOne(id: string): Promise<Channel>
	{
		return await this.repository.findOne({relations: this.relations, where: [{id: id}]});
	}

	async directExists(user_1: User, user_2: User): Promise<Channel>
	{
		let name = user_1.username + "_" + user_2.username;
		let name_2 = user_2.username + "_" + user_1.username;
		let channel = await this.repository.createQueryBuilder("channel")
			.where("name = :name or name = :name_2", {name: name, name_2: name_2})
			.getOne();
		return channel
	}
	
	async delete(id: string): Promise<void>
	{
		await this.repository.delete(id);
	}

	async save(channel: Channel)
	{
		return await this.repository.save(channel);
	}

	async addUser(channel: Channel, user: User, enable_pending: boolean = true)
	{
		if (channel.users == null)
		{
			channel.users = new Array();
		}
		if (channel.requirePassword && enable_pending)
		{
			if (!channel.pending_users)
				channel.pending_users = new Array<User>();
			channel.pending_users.push(user);
		}
		channel.users.push(user);
		user.channels.push(channel);
		this.repository.save(channel);
	}

	async addPassword(channel: Channel, password: string)
	{
		bcrypt.hash(password, 10, (err, hash) =>
		{
			channel.requirePassword = true;
			channel.password = hash;
			this.repository.save(channel);
		});
	}

	async check_password(channel: Channel, password: string)
	{
		return await bcrypt.compare(password, channel.password)
	}

	async removePassword(channel: Channel)
	{
		channel.requirePassword = false;
		channel.pending_users = [];
		this.repository.save(channel);
	}

	async addAdmin(channel: Channel, user: User)
	{
		if (channel.administrators == null)
			channel.administrators = new Array();
	
		channel.administrators.push(user);
		this.repository.save(channel);
	}

	async removeAdmin(channel: Channel, user: User)
	{
		let index = channel.administrators.findIndex(admin => admin.id == user.id);
		if (index != -1)
			channel.administrators.splice(index, 1);
		this.repository.save(channel);
	}

	async addMessage(channel: Channel, user: User, content: string)
	{
		let message = new Message();
		message.channel = channel;
		message.user = user;
		message.content = content;
		await this.messageService.save(message);
	}

	async getMessages(channel: Channel)
	{
		let messages = await this.messageService.findByChannel(channel);
		return messages;
	}

	async muteUser(channel: Channel, user: User)
	{
		this.channelMutedUserService.insert(channel, user, "2021-07-28 13:09:11.038+00");
	}

	async unmuteUser(channel: Channel, user: User)
	{
		this.channelMutedUserService.delete(channel, user);
	}

	async isMuted(channel: Channel, user: User)
	{
		return (await this.channelMutedUserService.isMuted(channel, user));
	}

	async banUser(channel: Channel, user: User)
	{
		this.channelBannedUserService.insert(channel, user, "2021-07-28 13:09:11.038+00");
	}

	async unbanUser(channel: Channel, user: User)
	{
		this.channelBannedUserService.delete(channel, user);
	}

	async isBanned(channel: Channel, user: User)
	{
		return (await this.channelBannedUserService.isBanned(channel, user));
	}

	async updateModifiedDate(channel: Channel)
	{
		channel.modifiedDate = new Date();
		this.repository.save(channel);
	}

	isOwner(channel: Channel, user: User): boolean
	{
		if (channel.owner && channel.owner.id == user.id)
			return true;
		return false;
	}

	isAdmin(channel: Channel, user: User): boolean
	{
		if (channel.owner && channel.owner.id == user.id)
			return true;
		if (!channel.administrators)
			return false;
		for (let admin of channel.administrators)
		{
			if (admin.id == user.id)
				return true;
		}
		return false;
	}

	isInChannel(channel: Channel, user: User)
	{
		if (channel.owner && channel.owner.id == user.id)
			return true;
		if (this.isAdmin(channel, user))
			return true;
		if (user.channels.findIndex(c => c.id == channel.id) != -1)
			return true;
		return false;
	}

	async removeUser(channel: Channel, user: User)
	{
		if (channel.owner && channel.owner.id == user.id)
			channel.owner = null;
		if (this.isAdmin(channel, user))
		{
			let index = channel.administrators.findIndex((admin) => admin.id == user.id);
			if (index != -1)
				channel.administrators.splice(index, 1);
		}
		let index = channel.users.findIndex((u) => u.id == user.id);
		if (index != -1)
			channel.users.splice(index, 1);
		await this.repository.save(channel);
	}

	isPendingUser(channel: Channel, user: User): boolean
	{
		if (channel.pending_users.findIndex(tmp_user => tmp_user.id == user.id) == -1)
			return false;
		return true;
	}

	async removePendingUser(channel: Channel, user: User): Promise<void>
	{
		let index = channel.pending_users.findIndex((tmp_user) => tmp_user.id == user.id);
		channel.pending_users.splice(index, 1);
		this.save(channel);
	}

	getUserRole(channel: Channel, user: User)
	{
		if (this.isAdmin(channel, user))
			return 'ADMIN';
		if (channel.owner && channel.owner.id == user.id)
			return 'OWNER';
		else
			return 'MEMBER';
	}

	async setChannelType(channel: Channel, type: 'public' | 'private')
	{
		channel.type = type;
		await this.repository.save(channel);
	}

	async generateInvitation(channel: Channel, user: User)
	{
		let hash = user.id + "-" + (Math.random() + 1).toString(36).substring(2, 10);
	
		let link = await this.invitationService.insertLink(channel, hash);
		channel.invitation_links.push(link);
		await this.repository.save(channel);
		return link.path;
	}

	async removeMessages(channel: Channel): Promise<Channel>
	{
		channel.messages = [];
		return await this.repository.save(channel);
	}

	async removeInvitations(channel: Channel): Promise<Channel>
	{
		channel.invitation_links = [];
		return await this.repository.save(channel);
	}

	async removeMutedUsers(channel: Channel): Promise<Channel>
	{
		channel.mutedUsers = [];
		return await this.repository.save(channel);
	}

	async removeBannedUsers(channel: Channel): Promise<Channel>
	{
		return await this.channelBannedUserService.removeAllFromChannel(channel);
	}

	async clean(channel: Channel): Promise<Channel>
	{
		channel = await this.removeMessages(channel);
		channel = await this.removeInvitations(channel);
		channel = await this.removeInvitations(channel);
		channel = await this.removeMutedUsers(channel);
		await this.removeBannedUsers(channel);
		return channel;
	}
}
