import { Channel } from 'src/channels/channel.entity';
import { User } from 'src/users/users.entity';
import { Entity, Column, PrimaryGeneratedColumn, OneToOne, OneToMany, JoinColumn, JoinTable, ManyToOne } from 'typeorm';

@Entity('Channel_muted_user')
export class Channel_muted_user
{
	@PrimaryGeneratedColumn()
	id: number;

	@ManyToOne(() => Channel, chan => chan.administrators)
	channel: Channel;

	@OneToOne(() => User)
	@JoinColumn()
	user: User;

	@Column({type: 'date'})
	to: string
};