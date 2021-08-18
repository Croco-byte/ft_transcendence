export interface User
{
	id: number;
	username: string;
	status: string;
	displayName: string;
}

export interface AuthState
{
	status: { loggedIn: boolean };
	user: LocalStorageUserInterface | null;
	avatar: string;
	websockets: { connectionStatusSocket: any, friendRequestsSocket: any };
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
