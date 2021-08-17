import AuthService from '../services/auth.service';
import authHeader from '../services/auth-header';
import io from 'socket.io-client'
import router from '../router/index';
import store from './index';
import userService from '../services/user.service';

/* When the application loads, we check if the user already has a JWT in the local storage.
** If this is the case, the user is already connected from his last session. We initialize
** the websockets and the variables that indicates that the user is online.
** If there was no JWT, the said variables are initilized as empty or null, including the
** websockets.
*/


const user: { username: string, accessToken: string, twoFARedirect?: boolean } = JSON.parse(localStorage.getItem('user') as string);
let initialState: any;


if (user) {
	console.log("HELLO !" + user);
	const statusSocket =  io('http://localhost:3000/connectionStatus', { query: { token: `${authHeader().Authorization.split(' ')[1]}` } });
	const friendSocket = io('http://localhost:3000/friendRequests', { query: { token: `${authHeader().Authorization.split(' ')[1]}` } });

	statusSocket.on('multipleConnectionsOnSameUser', async function(data) {
		const result = await userService.getCurrUserId();
		if (data.userId == result.data.id) {
			localStorage.removeItem('user');
			(store.state as any).auth.status.loggedIn = false;
			(store.state as any).auth.user = null;
			(store.state as any).auth.avatar = '';
			(store.state as any).auth.websockets.connectionStatusSocket.disconnect();
			(store.state as any).auth.websockets.friendRequestsSocket.disconnect();
			router.push(({name: 'Login', params: { message: 'Multiple connection requests for this account. Kicking everyone :)' }}));
		}
	})
	statusSocket.emit('getOnline', {});
	initialState = { status: { loggedIn: true }, user: user, avatar: '', websockets: { connectionStatusSocket: statusSocket, friendRequestsSocket: friendSocket } };

} else {
	initialState = { status: { loggedIn: false }, user: null, avatar: '', websockets: { connectionStatusSocket: null, friendRequestsSocket: null } };
}

export const auth: any = {
	namespaced: true,
	state: initialState,

	actions: {
		async login({ commit }, code, state) {
			try {
				const user = await AuthService.login(code, state);
				return Promise.resolve(user);
			} catch(error) {
				commit('loginFailure');
				return Promise.reject(error);
			}
		},

		async twoFALogin({ commit }, twoFACode) {
			try {
				const user = await AuthService.twoFALogin(twoFACode);
				return Promise.resolve(user);
			} catch(error) {
				return Promise.reject(error);
			}
		},

		logout({ commit }) {
			commit('logout');
		}
	},

	mutations: {

		/* On logging success, we set the variables that indicate that the user is online ; we also set the websocket listeners. */
		loginSuccess(state, user) {
			state.status.loggedIn = true;
			state.user = user;
			
			state.websockets.connectionStatusSocket = io('http://localhost:3000/connectionStatus', { query: { token: `${authHeader().Authorization.split(' ')[1]}` } });
			state.websockets.connectionStatusSocket.on('multipleConnectionsOnSameUser', async function (data) {
				const result = await userService.getCurrUserId();
				if (data.userId == result.data.id) {
					localStorage.removeItem('user');
					state.status.loggedIn = false;
					state.user = null;
					state.avatar = '';
					state.websockets.connectionStatusSocket.disconnect();
					state.websockets.friendRequestsSocket.disconnect();
					router.push(({name: 'Login', params: { message: 'Multiple connection requests for this account. Kicking everyone :)' }}));
				}
			})
			state.websockets.connectionStatusSocket.emit('getOnline', {});
			state.websockets.friendRequestsSocket = io('http://localhost:3000/friendRequests', { query: { token: `${authHeader().Authorization.split(' ')[1]}` } });
			router.push('/account');
		},
		loginFailure(state) {
			state.websockets.connectionStatusSocket.disconnect();
			state.websockets.friendRequestsSocket.disconnect();
			localStorage.removeItem('user');
			state.status.loggedIn = false;
			state.user = null;
			state.avatar = '';
		},
		logout(state) {
			localStorage.removeItem('user');
			state.websockets.connectionStatusSocket.disconnect();
			state.websockets.friendRequestsSocket.disconnect();
			state.status.loggedIn = false;
			state.user = null;
			state.avatar = '';
		},

		updateAvatar(state, avatar) {
			state.avatar = avatar;
		},
	},
};
