import { MutationTree } from 'vuex';
import { RootState } from '../types/store.interface';
import { io } from 'socket.io-client';
import authHeader from '../services/auth-header';
import UserService from '../services/user.service';
import router from '../router/index';
import store from './index'
import Swal from 'sweetalert2'


export const mutations: MutationTree<RootState> = {
	/* On logging success, we set the variables that indicate that the user is online ; we also set the websocket listeners. */
	loginSuccess(state, user) {
		state.status.loggedIn = true;
		state.user = user;
		state.websockets.connectionStatusSocket = io('http://localhost:3000/connectionStatus', { query: { token: `${authHeader().Authorization.split(' ')[1]}` } });
		state.websockets.connectionStatusSocket.on('multipleConnectionsOnSameUser', async function (data) {
			const result = await UserService.getCurrUserId();
			if (data.userId == result.data.id) {
				store.commit('disconnectUser', { message: "Multiple connexions detected for this user. Please log in again" });
			}
		})
		state.websockets.friendRequestsSocket = io('http://localhost:3000/friendRequests', { query: { token: `${authHeader().Authorization.split(' ')[1]}` } });
		state.websockets.connectionStatusSocket.on('unauthorized', function() {
			store.commit('disconnectUser', { message: "Session expired !" });
		});
		state.websockets.connectionStatusSocket.on('serverDown', function() {
			store.commit('disconnectUser', { message: "Serveur is down or was rebooted. Please wait a bit before logging in again."})
		});
		state.websockets.friendRequestsSocket.on('unauthorized', function() {
			store.commit('disconnectUser', { message: "Session expired !" });
		});
		router.push('/account');
	},

	logout(state) {
		localStorage.removeItem('user');
		if (state.websockets.connectionStatusSocket) state.websockets.connectionStatusSocket.disconnect();
		if (state.websockets.friendRequestsSocket) state.websockets.friendRequestsSocket.disconnect();
		state.status.loggedIn = false;
		state.user = null;
		state.avatar = '';
	},

	disconnectUser(state, payload) {
		localStorage.removeItem('user');
		state.status.loggedIn = false;
		state.user = null;
		state.avatar = '';
		if (state.websockets.connectionStatusSocket) state.websockets.connectionStatusSocket.disconnect();
		if (state.websockets.friendRequestsSocket) state.websockets.friendRequestsSocket.disconnect();
		Swal.fire('Error', payload.message, 'error');
		router.push(({name: 'Login', params: { message: payload.message }}));
	},

	updateAvatar(state, avatar) {
		state.avatar = avatar;
	}
}
