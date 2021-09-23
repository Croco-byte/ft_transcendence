import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Channel } from "src/channels/channel.entity";
import { User } from "src/users/users.entity";
import { Channel_banned_user } from './channel_banned_user.entity';
import ChannelBannedUserReoisitory from "./channel_banned_user.repository";



@Injectable()
export default class ChannelBannedUserService
{
	constructor (@InjectRepository(ChannelBannedUserReoisitory) private repository)
	{

	}

	async isBanned(channel: Channel, user: User)
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
		let banned_item = new Channel_banned_user;
		banned_item.channel = channel;
		banned_item.user = user;
		banned_item.to = to;
		await this.repository.save(banned_item);
	}

	async delete(channel: Channel, user: User)
	{
		let tmp = await this.repository.find({relations: ["channel", "user"], where: {channel: channel, user: user}});
		return await this.repository.remove(tmp);
	}

	async removeAllFromChannel(channel: Channel): Promise<Channel>
	{
		return await this.repository.delete({channel: channel});
	}
}