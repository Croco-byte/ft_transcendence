import { User } from "./users.entity";

export interface UserWithRank {
	user: User;
	rank: number;
}
