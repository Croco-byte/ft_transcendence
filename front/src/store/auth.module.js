import AuthService from '../services/auth.service';
import UserService from '../services/user.service';
import authHeader from '../services/auth-header';
import io from 'socket.io-client'

const user = JSON.parse(localStorage.getItem('user'));
let initialState;

if (user) {
	const statusSocket =  io.connect('http://localhost:3000/connectionStatus', {query: `token=${authHeader().Authorization.split(' ')[1]}`});
	statusSocket.on('exception', (error) => {
		console.log("Caught an exception while interacting with Connection Status Websocket. Disconnecting client.")
		statusSocket.disconnect();
	})
	statusSocket.emit('getOnline', {});

	const friendSocket = io.connect('http://localhost:3000/friendRequests', {query: `token=${authHeader().Authorization.split(' ')[1]}`});

	initialState = { status: { loggedIn: true }, user, avatar: '', websockets: { connectionStatusSocket: statusSocket, friendRequestsSocket: friendSocket } };

} else {
	initialState = { status: { loggedIn: false }, user: null, avatar: '', websockets: { connectionStatusSocket: null, friendRequestsSocket: null } };
}

export const auth = {
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
			AuthService.logout();
			commit('logout');
		}
	},

	mutations: {
		loginSuccess(state, user) {
			state.status.loggedIn = true;
			state.user = user;
			
			if (!state.websockets.connectionStatusSocket) {
				state.websockets.connectionStatusSocket = io('http://localhost:3000/connectionStatus', {query: `token=${authHeader().Authorization.split(' ')[1]}`});
			}
			state.websockets.connectionStatusSocket.on('exception', (error) => {
				console.log("Caught an exception while interacting with Connection Status Websocket. Disconnecting client.")
				state.websockets.connectionStatusSocket.disconnect();
			})
			state.websockets.connectionStatusSocket.emit('getOnline', {});

			if (!state.websockets.friendRequestsSocket) {
				state.websockets.friendRequestsSocket = io('http://localhost:3000/friendRequests', {query: `token=${authHeader().Authorization.split(' ')[1]}`});
			}
		},
		loginFailure(state) {
			localStorage.removeItem('user');
			state.status.loggedIn = false;
			state.user = null;
			state.avatar = '';
			if (state.websockets.connectionStatusSocket) {
				state.websockets.connectionStatusSocket.disconnect();
			}
		},
		logout(state) {
			if (state.websockets.connectionStatusSocket) {
				state.websockets.connectionStatusSocket.disconnect();
			}
			state.status.loggedIn = false;
			state.user = null;
			state.avatar = '';
		},

		updateAvatar(state, avatar) {
			state.avatar = avatar;
		},
	},

	getters: {
	}
};
