import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Channel } from "src/channels/channel.entity";
import { User } from "src/users/users.entity";
import { Channel_muted_user } from './channel_muted_user.entity';
import ChannelMutedUserRepository from "./channel_muted_user.repository";



@Injectable()
export default class ChannelMutedUserService
{
	constructor (@InjectRepository(ChannelMutedUserRepository) private repository)
	{

	}

	async isMuted(channel: Channel, user: User)
	{

		let ret = await this.repository.find({relations: ["channel", "user"], select: ["id", "to"], where: [
			{
				user: user,
				channel: channel
			}]});
		return (ret[0] !== undefined);
	}

	async insert(channel: Channel, user: User, to: string)
	{
		let muted_item = new Channel_muted_user;
		muted_item.channel = channel;
		muted_item.user = user;
		muted_item.to = to;
		await this.repository.save(muted_item);
	}

	async delete(channel: Channel, user: User)
	{
		let tmp = await this.repository.find({relations: ["channel", "user"], where: {channel: channel, user: user}});
		return await this.repository.remove(tmp);
	}
}