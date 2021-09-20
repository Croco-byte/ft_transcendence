import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Channel } from "../channel.entity";

@Entity()
export class InvitationLink extends BaseEntity
{
	@PrimaryGeneratedColumn()
	id: number;

	@ManyToOne(() => Channel, c => c.invitation_links)
	channel: Channel;

	@Column()
	path: string;
}