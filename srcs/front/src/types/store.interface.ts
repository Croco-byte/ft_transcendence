import { Socket } from 'socket.io-client';

export interface RootState
{
	status: { loggedIn: boolean };
	user: LocalStorageUserInterface | null;
	avatar: string;
	websockets: { connectionStatusSocket: Socket | null, friendRequestsSocket: Socket | null };
}
