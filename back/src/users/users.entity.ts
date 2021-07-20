import { Entity, Column, PrimaryGeneratedColumn, ManyToMany, JoinTable, BaseEntity } from 'typeorm';

@Entity()
export class User extends BaseEntity
{
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  username: string;

//@Column()
//avatar: string;

//  @Column({ type: "text"})
//  stat: string;

//  @Column({ type: "integer" })
//  score: number

  @Column({ type: "boolean", default: false })
  DFA: boolean

  @Column({type: "boolean", default: true})
  online: boolean

//  @ManyToMany(() => User)
//  @JoinTable()
//  friends: User[];
};
