import { Entity, Column, PrimaryGeneratedColumn, OneToMany, JoinTable, BaseEntity } from 'typeorm';
import { FriendRequestEntity } from './friends-request.entity';

@Entity()
export class User extends BaseEntity
{
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  username: string;

  @Column({ default: "filler" })
  displayName?: string;

  @Column({ default: "default" })
  avatar?: string;

  @Column({ default: false })
  isTwoFactorAuthenticationEnabled?: boolean

  @Column({ nullable: true})
  twoFactorAuthenticationSecret?: string;

  @Column({ default: 'offline' })
  status?: string;

  @OneToMany(() => FriendRequestEntity, (friendRequestentity) => friendRequestentity.creator)
  sentFriendRequests?: FriendRequestEntity[];

  @OneToMany(() => FriendRequestEntity, (friendRequestentity) => friendRequestentity.receiver)
  receivedFriendRequests?: FriendRequestEntity[];
};
