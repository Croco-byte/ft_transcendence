import { MutationTree } from 'vuex';
import { RootState } from '../types/store.interface';
import io from 'socket.io-client';
import authHeader from '../services/auth-header';
import userService from '../services/user.service';
import router from '../router/index';


export const mutations: MutationTree<RootState> = {
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
				if (state.websockets.connectionStatusSocket) state.websockets.connectionStatusSocket.disconnect();
				if (state.websockets.friendRequestsSocket) state.websockets.friendRequestsSocket.disconnect();
				router.push(({name: 'Login', params: { message: 'Multiple connection requests for this account. Kicking everyone :)' }}));
			}
		})
		state.websockets.connectionStatusSocket.emit('getOnline', {});
		state.websockets.friendRequestsSocket = io('http://localhost:3000/friendRequests', { query: { token: `${authHeader().Authorization.split(' ')[1]}` } });
		router.push('/account');
	},
	loginFailure(state) {
		if (state.websockets.connectionStatusSocket) state.websockets.connectionStatusSocket.disconnect();
		if (state.websockets.friendRequestsSocket) state.websockets.friendRequestsSocket.disconnect();
		localStorage.removeItem('user');
		state.status.loggedIn = false;
		state.user = null;
		state.avatar = '';
	},
	logout(state) {
		localStorage.removeItem('user');
		if (state.websockets.connectionStatusSocket) state.websockets.connectionStatusSocket.disconnect();
		if (state.websockets.friendRequestsSocket) state.websockets.friendRequestsSocket.disconnect();
		state.status.loggedIn = false;
		state.user = null;
		state.avatar = '';
	},

	updateAvatar(state, avatar) {
		state.avatar = avatar;
	}
}
