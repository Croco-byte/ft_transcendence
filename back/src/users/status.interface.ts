export type User_Status = 'online' | 'offline' | 'in-game' | 'spectating';

export interface UserStatus {
	status?: User_Status;
}
