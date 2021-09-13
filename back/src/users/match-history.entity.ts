import { User } from "./users.entity";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('matchHistory')
export class MatchHistoryEntity {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
	time?: string;

	@ManyToOne(() => User, (userEntity) => userEntity.matchesWon)
	winner: User;

	@ManyToOne(() => User, (userEntity) => userEntity.matchesLost)
	looser: User;

	@Column()
	winnerScore: number;

	@Column()
	looserScore: number;

	@Column({ nullable: true })
	gameOptions: string;
}
