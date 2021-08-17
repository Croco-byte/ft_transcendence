import { User } from 'src/users/users.entity';
import { Entity, Column, PrimaryGeneratedColumn, OneToOne, OneToMany, JoinColumn, JoinTable, BaseEntity, ManyToMany } from 'typeorm';
import { Channel_banned_user } from 'src/channel_banned_users/channel_banned_user.entity';
import { Channel_muted_user } from 'src/channel_muted_users/channel_muted_user.entity';
import { Message } from 'src/messages/message.entity';

@Entity('Channel')
class Channel extends BaseEntity
{
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	type: string;

	@Column()
	name: string;

	@Column()
	requirePassword: boolean;

	@Column({nullable: true})
	password: string;

	@Column({nullable: true})
	lastMessage: string;

	@Column({type: 'timestamptz', nullable: true})
	modifiedDate: Date

	@OneToOne(() => User)
	@JoinColumn()
	owner: User;

	@Column({ type: 'timestamptz' }) // Recommended
	creationDate: Date;

	@Column()
	isDirect: boolean;

	@ManyToMany(() => User, user => user.channels)
	@JoinTable()
	users: User[];

	@ManyToMany(() => User)
	@JoinTable()
	administrators: User[];
	
	// @OneToMany(() => Channel_banned_user, banned => banned.channel)
	// bannedUsers: Channel_banned_user[];

	// @OneToMany(() => Channel_muted_user, muted => muted.channel)
	// mutedUsers: Channel_muted_user[];

	@OneToMany(() => Message, msg => msg.channel)
	messages: Message[];

	@OneToMany(() => Channel_muted_user, muted => muted.channel)
	mutedUsers: Channel_muted_user[];

	toJSON()
	{
		return {
			id: this.id,
			type: this.type,
			name: this.name,
			requirePassword: this.requirePassword,
			password: this.password,
			creationDate: this.creationDate,
			users: [],
			isDirect: this.isDirect
		}
	}''
};

export {Channel};