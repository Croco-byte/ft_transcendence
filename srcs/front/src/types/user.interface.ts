export interface User
{
	id: number;
	username: string;
	status: string;
	displayname: string;
	avatar?: string;
	score?: number;
}

export interface LeaderboardUser
{
	user: User;
	rank: number;
}

export interface LocalStorageUserInterface
{
	username: string;
	accessToken: string;
	twoFARedirect?: boolean;
}

export interface UserStatusChangeData
{
	userId: number;
	status: string;
}
