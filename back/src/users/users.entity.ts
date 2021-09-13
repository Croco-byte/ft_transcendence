/* eslint-disable prettier/prettier */
import { Channel } from 'src/channels/channel.entity';
import { Channel_muted_user } from 'src/channel_muted_users/channel_muted_user.entity';
import { Message } from 'src/messages/message.entity';
import { FriendRequestEntity } from './friends-request.entity';
import { Entity, Column, PrimaryGeneratedColumn, ManyToMany, JoinTable, BaseEntity, OneToMany } from 'typeorm';

@Entity()
export class User extends BaseEntity
{
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	username: string;

	@Column({ default: "default" })
	avatar: string;

	@Column({ type: "text", nullable: true})
	stat: string;

	@Column({ type: "integer", nullable: false, default: 0})
	score: number

	@Column({ default: 'offline' })
	status?: string;

	@OneToMany(() => Message, msg => msg.user)
    messages: Message[];

	@ManyToMany(() => User, (user: User) => user.blocked)
	@JoinTable({ name: "blocked_users" })
	blocked: User[];

	@ManyToMany(() => Channel, channel => channel.users)
	channels: Channel[];

	@OneToMany(() => Channel, channel => channel.owner)
	own_channels: Channel[];

	@Column({ default: false })
	isTwoFactorAuthenticationEnabled?: boolean

	@Column({ nullable: true})
	twoFactorAuthenticationSecret?: string;

	@Column({ default: "filler" })
	displayName?: string;

	@OneToMany(() => FriendRequestEntity, (friendRequestentity) => friendRequestentity.creator)
	sentFriendRequests?: FriendRequestEntity[];

	@OneToMany(() => FriendRequestEntity, (friendRequestentity) => friendRequestentity.receiver)
	receivedFriendRequests?: FriendRequestEntity[];

	@Column({ default: 0 })
	wins: number;
	
	@Column({ default: 0 })
	loses: number;
	
	@Column({ default: 'none' })
	roomId: string;

	@ManyToMany(()=> Channel, channel => channel.pending_users)
	pending_channels: Channel[];

	toPublic()
	{
		return {
			id: this.id,
			username: this.username,
			avatar: this.avatar,
			score: this.score,
		}
	}
};
