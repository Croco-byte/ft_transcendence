import { Channel } from 'src/channels/channel.entity';
import { User } from 'src/users/users.entity';
import { Entity, Column, PrimaryGeneratedColumn, OneToOne, OneToMany, JoinColumn, JoinTable, ManyToOne } from 'typeorm';

@Entity('Channel_administrator')
export class Channel_administrator
{
	@PrimaryGeneratedColumn()
	id: number;

	@ManyToOne(() => Channel, chan => chan.administrators)
	channel: Channel;

	@OneToOne(() => User)
	@JoinColumn()
	user: User;
};