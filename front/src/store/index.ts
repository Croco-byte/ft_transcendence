import VueX, { StoreOptions } from 'vuex';
import authHeader from '../services/auth-header';
import UserService from '../services/user.service';
import { io, Socket } from 'socket.io-client';
import { RootState } from '../types/store.interface';
import { LocalStorageUserInterface } from '../types/user.interface';
import { actions } from './auth.actions';
import { mutations } from './auth.mutations';


/* When the application loads, we check if the user already has a JWT in the local storage.
** If this is the case, the user is already connected from his last session. We initialize
** the websockets and the variables that indicates that the user is online.
** If there was no JWT, the said variables are initilized as empty or null, including the
** websockets.
*/


const user: LocalStorageUserInterface = JSON.parse(localStorage.getItem('user') as string);
let initialState: RootState;


if (user) {
	const statusSocket: Socket =  io('http://localhost:3000/connectionStatus', { query: { token: `${authHeader().Authorization.split(' ')[1]}` } });
	const friendSocket: Socket = io('http://localhost:3000/friendRequests', { query: { token: `${authHeader().Authorization.split(' ')[1]}` } });
	initialState = { status: { loggedIn: true }, user: user, avatar: '', websockets: { connectionStatusSocket: statusSocket, friendRequestsSocket: friendSocket } };

} else {
	initialState = { status: { loggedIn: false }, user: null, avatar: '', websockets: { connectionStatusSocket: null, friendRequestsSocket: null } };
}


const defineStore: StoreOptions<RootState> = {
	state: initialState,
	actions,
	mutations,
}

export default new VueX.Store<RootState>(defineStore);
