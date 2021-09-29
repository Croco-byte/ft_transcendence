import { User } from './user.interface'

export interface FriendStatusChangeData
{
	creatorId: number;
	receiverId: number;
}

export interface FriendRequest
{
	id: number;
	status: string;
	creator: User;
	receiver: User;
}
