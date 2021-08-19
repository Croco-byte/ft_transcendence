export interface User
{
	id: number;
	username: string;
	status: string;
	displayName: string;
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
