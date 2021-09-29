import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Channel } from "../channel.entity";
import { InvitationLink } from "./invitation_link.entity";

@Injectable()
export class InvitationService
{
	constructor(@InjectRepository(InvitationLink) private repository: Repository<InvitationLink>)
	{

	}

	async getLink(id: string): Promise<InvitationLink>
	{
		return await this.repository.findOne({ relations: ["channel", "channel.users"], where: { path: id }});
	}

	async removeLink(link: InvitationLink)
	{
		await this.repository.remove([link]);
	}

	async insertLink(channel: Channel, hash: string): Promise<InvitationLink>
	{
		let link = new InvitationLink();
		link.channel = channel;
		link.path = hash;
		this.repository.save(link);
		return link
	}
}