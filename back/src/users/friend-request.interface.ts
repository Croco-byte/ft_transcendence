import { User } from "./users.entity";


export type FriendRequest_Status = 'pending' | 'declined' | 'accepted';

export interface FriendRequestStatus {
	status?: FriendRequest_Status;
}

export interface FriendRequest {
	id?: number;
	creator?: User;
	receiver?: User;
	status?: FriendRequest_Status;
}
