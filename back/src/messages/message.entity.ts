import { Channel } from "src/channels/channel.entity";
import { User } from "src/users/users.entity";
import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";


@Entity("message")
export class Message extends BaseEntity
{
    @PrimaryGeneratedColumn()
	id: number;

    @ManyToOne(() => User, user => user.messages)
    user: User;

    @ManyToOne(() => Channel, chan => chan.messages)
    channel: Channel;

    @Column()
    content: string;
};