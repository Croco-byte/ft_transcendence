import { Channel } from 'src/channels/channel.entity';
import { User } from 'src/users/users.entity';
import { Entity, Column, PrimaryGeneratedColumn, OneToOne, OneToMany, JoinColumn, JoinTable, ManyToOne, BaseEntity } from 'typeorm';

@Entity('Channel_banned_user')
export class Channel_banned_user extends BaseEntity
{
	@PrimaryGeneratedColumn()
	id: number;

	@ManyToOne(() => Channel)
	@JoinColumn()
	channel: Channel;

	@ManyToOne(() => User)
	@JoinColumn()
	user: User;

	@Column({type: 'date'})
	to: string
};