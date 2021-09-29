import { User } from "./users.entity";
import { BaseEntity } from "typeorm";
export declare class MatchHistoryEntity extends BaseEntity {
    id: number;
    time?: string;
    winner: User;
    looser: User;
    winnerScore: number;
    looserScore: number;
    gameOptions: string;
    looserdisconnected: boolean;
}
