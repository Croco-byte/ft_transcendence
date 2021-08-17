import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import ChannelBannedUserService from "src/channel_banned_users/channel_banned_user.service";
import ChannelMutedUserRepository from "src/channel_muted_users/channel_muted_user.repository";
import ChannelMutedUserService from "src/channel_muted_users/channel_muted_user.service";
import { Message } from "src/messages/message.entity";
import MessageRepository from "src/messages/message.repository";
import MessageService from "src/messages/message.service";
import { User } from "src/users/users.entity";
import { Connection, getConnection, getRepository, Repository } from "typeorm";
import {Channel} from './channel.entity';
import ChannelRepository from "./channel.repository";

@Injectable()
export default class ChannelService
{
	constructor (
				@InjectRepository(ChannelRepository) private repository,
				private readonly channelMutedUserService: ChannelMutedUserService,
				private readonly channelBannedUserService: ChannelBannedUserService,
				private readonly messageService: MessageService)
	{

	}

	async insert(channel: Channel)
	{
		return this.repository.save(channel);
	}

	async findAll(): Promise<Channel[]>
	{
		return (await this.repository
		.createQueryBuilder()
		.select("channel.id")
		.addSelect("channel.name")
		.addSelect("channel.modifiedDate")
		.addSelect("channel.lastMessage")
		.from(Channel, "channel")
		.orderBy("channel.modifiedDate", "DESC")
		.getMany());
	}
	
	async findOne(id: string): Promise<Channel>
	{
		return await this.repository.findOne({relations: ["users", "administrators"], where: [{id: id}]});
	}
	
	async delete(id: string): Promise<void>
	{
		await this.repository.delete(id);
	}

	async save(channel: Channel)
	{
		return await this.repository.save(channel);
	}

	async addUser(channel: Channel, user: User)
	{
		if (channel.users == null)
			channel.users = new Array();
		channel.users.push(user);
		user.channels.push(channel)
		this.repository.save(channel);
	}

	async addAdmin(channel: Channel, user: User)
	{
		if (channel.administrators == null)
			channel.administrators = new Array();
	
		channel.administrators.push(user);
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
}