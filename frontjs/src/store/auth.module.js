import AuthService from '../services/auth.service';
import authHeader from '../services/auth-header';
import axios from 'axios';

const user = JSON.parse(localStorage.getItem('user'));
let id;

const initialState = user ? { status: { loggedIn: true }, user, avatar: '', id } : { status: { loggedIn: false }, user: null, avatar: '', id };

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
		setId(state, id) {
			console.log("Setting user id");
			state.id = id;
		},
		loginSuccess(state, user) {
			state.status.loggedIn = true;
			state.user = user;
		},
		loginFailure(state) {
			state.status.loggedIn = false;
			state.user = null;
		},
		logout(state) {
			state.status.loggedIn = false;
			state.user = null;
		},

		updateAvatar(state, avatar) {
			state.avatar = avatar;
		}
	}
};
