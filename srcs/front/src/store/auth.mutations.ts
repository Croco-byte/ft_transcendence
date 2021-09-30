import { MutationTree } from 'vuex';
import { RootState } from '../types/store.interface';
import { io } from 'socket.io-client';
import authHeader from '../services/auth-header';
import UserService from '../services/user.service';
import router from '../router/index';
import store from './index';
import Swal from 'sweetalert2';
import axios from '../axios-instance';
import GameService from '../services/game.service';
import { createToast } from 'mosha-vue-toastify';
import 'mosha-vue-toastify/dist/style.css';

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
		
		state.websockets.connectionStatusSocket.on('unauthorized', function(data: { message: string }) {
			store.commit('disconnectUser', { message: data.message });
		});
		state.websockets.connectionStatusSocket.on('serverDown', function() {
			store.commit('disconnectUser', { message: "Serveur is down or was rebooted. Please wait a bit before logging in again."})
		});
		state.websockets.friendRequestsSocket.on('unauthorized', function(data: { message: string }) {
			store.commit('disconnectUser', { message: data.message });
		});


		// -------------------------------------------------------
		// ------------------ PRIVATE GAME PART ------------------ 
		
		/**
		 * Private game invitation with db id of the targeted friend. If db id matches, alerting
		 * the user and asking him if he wants to join or not the private game.
		 */
		state.websockets.connectionStatusSocket.on('acceptChallenge', async (obj) => {

			const result = await UserService.getCurrUserId();
			if (obj.friendId === result.data.id && state.websockets.connectionStatusSocket) {
				state.websockets.connectionStatusSocket.emit('getInQueue', {});
				
				// eslint-disable-next-line
				const resultCheckBox: any = await Swal.fire({
					title: 'Someone\'s challenging you!',
					text: `Your friend ${obj.username} is inviting you to play a private game! Do you accept it?`,
					icon: 'question',
					showDenyButton: true,
				})
					
				if (resultCheckBox.value != false) {
					const userThatMadeRequest = await UserService.getUserInfo(obj.userId);
				
					if (userThatMadeRequest.data.roomId === obj.newRoomId) {
						await axios.post("http://" + window.location.hostname + ":3000" + '/game/joinChallenge/' 
						+ obj.friendId, { newRoomId: obj.newRoomId }, {headers: authHeader()});

						router.push(({name: 'Game', params: { 
							RenderGameOption: 'false',
							RenderGameJoin: 'true',
							status: 'private',
							random: GameService.generateRandomStr(),
						}}));
					}

					else {
						state.websockets.connectionStatusSocket.emit('getOnline', {});
						createToast({
							title: 'Error',
							description: 'The invitation has expired',
						},
						{
							position: 'top-right',
							type: 'danger',
							transition: 'slide'
						});
					}

				}
				else if (state.websockets.connectionStatusSocket) {
					state.websockets.connectionStatusSocket.emit('getOnline', {});
					state.websockets.connectionStatusSocket.emit('challengeDeclined', obj.userId);
				}
			}
		});

		/**
		 *	If the friend targeted by the private game invitation refused it, removing the user that made
		 *	the invitation from the queue.
		*/
		state.websockets.connectionStatusSocket.on('cancelPrivateGame', async (userId) => {
			
			const result = await UserService.getCurrUserId();

			if (userId === result.data.id) {
				
				const result = await UserService.getCurrUserStatus();
				if (result.data.status === 'in-queue') {
					router.push(({name: 'Home'}));
				}

				createToast({
					title: 'Error',
					description: 'Your friend refused your invitation',
				},
				{
					position: 'top-right',
					type: 'danger',
					transition: 'slide'
				});
			}
		});

		state.websockets.connectionStatusSocket.on('goToChallenge', async () => {
			router.push(({name: 'Game', params: { 
				RenderGameOption: 'false',
				RenderGameJoin: 'true',
				status: 'private',
				random: GameService.generateRandomStr(),
			}}));
		});
		
		state.websockets.connectionStatusSocket.on('errorChallengingHimself', async () => {
			createToast({
				title: 'Error',
				description: 'You can\'t challenge yourself!',
			},
			{
				position: 'top-right',
				type: 'danger',
				transition: 'slide'
			});

			router.push({name: 'Home'});
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
		router.push(({name: 'Home', params: { message: payload.message }}));
	},

	notAdminRedirect() {
		Swal.fire('Error', 'You are not authorized to access this resource', 'error');
		router.push(({name: 'Home'}));
	},

	updateAvatar(state, avatar) {
		state.avatar = avatar;
	}
}
