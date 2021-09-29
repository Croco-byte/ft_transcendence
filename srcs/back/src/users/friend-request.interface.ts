import { User } from "./users.entity";


export type FriendRequest_Status = 'not-sent' | 'pending' | 'declined' | 'accepted' | 'waiting-for-current-user-response' | 'declined-by-me';

export interface FriendRequestStatus {
	status?: FriendRequest_Status;
}

export interface FriendRequest {
	id?: number;
	creator?: User;
	receiver?: User;
	status?: FriendRequest_Status;
}
