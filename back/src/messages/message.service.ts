import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Channel } from "src/channels/channel.entity";
import MessageRepository from "src/messages/message.repository";
import { User } from "src/users/users.entity";
import { Message } from './message.entity';



@Injectable()
export default class MessageService
{
	constructor (@InjectRepository(MessageRepository) private repository)
	{

	}

    async add(channel: Channel, user: User, content: string)
    {
        let message = new Message;
        message.channel = channel;
        message.user = user;
        message.content = content;
        return await this.insert(message);
    }

	async insert(message: Message)
	{
		return this.repository.save(message);
	}

	async findAll(): Promise<Message[]>
	{
		return (await this.repository.find({order: {id: "ASC"}}));
	}
	
	async findOne(id: string): Promise<Message>
	{
		return this.repository.findOne(id);
	}

	async findByChannel(channel: Channel)
	{
		return await this.repository.find({relations: ["user", "channel"], where: [{channel: channel}], order: {id: "ASC"}});
	}
	
	async delete(id: string): Promise<void>
	{
		await this.repository.delete(id);
	}

	async save(message: Message)
	{
		await this.repository.save(message);
	}
}