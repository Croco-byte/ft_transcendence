import AuthService from '../services/auth.service';

const user = JSON.parse(localStorage.getItem('user'));
const initialState = user ? { status: { loggedIn: true }, user } : { status: { loggedIn: false }, user: null };

export const auth = {
	namespaced: true,
	state: initialState,

	actions: {
		async login({ commit }, code, state) {
			try {
				const user = await AuthService.login(code, state);
				commit('loginSuccess', user);
				return Promise.resolve(user);
			} catch(error) {
				commit('loginFailure');
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
		},
		loginFailure(state) {
			state.status.loggedIn = false;
			state.user = null;
		},
		logout(state) {
			state.status.loggedIn = false;
			state.user = null;
		}
	}
};
