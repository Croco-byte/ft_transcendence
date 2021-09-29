export type User_Status = 'online' | 'offline' | 'in-game' | 'in-queue' | 'spectating';

export interface UserStatus {
	status?: User_Status;
}
