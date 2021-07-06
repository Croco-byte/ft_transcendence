import { User } from 'src/users/users.entity';
import { Channel_administrator } from 'src/channel_administrators/channel_administrator.entity';
import { Entity, Column, PrimaryGeneratedColumn, OneToOne, OneToMany, JoinColumn, JoinTable } from 'typeorm';
import { Channel_banned_user } from 'src/channel_banned_users/channel_banned_user.entity';
import { Channel_muted_user } from 'src/channel_muted_users/channel_muted_user.entity';

@Entity('Channel')
export class Channel
{
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	type: string;

	@Column()
	requirePassword: boolean;

	@Column({nullable: true})
	password: string;

	@OneToOne(() => User)
	@JoinColumn()
	owner: User;

	@Column({type: 'date'})
	creationDate: string;

	@Column()
	isDirect: boolean;

	@OneToMany(() => Channel_administrator, admin => admin.channel)
	administrators: Channel_administrator[];
	
	@OneToMany(() => Channel_banned_user, banned => banned.channel)
	bannedUsers: Channel_banned_user[];

	@OneToMany(() => Channel_muted_user, muted => muted.channel)
	mutedUsers: Channel_muted_user[];
};