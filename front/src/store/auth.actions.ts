import { ActionTree } from 'vuex';
import { RootState } from '../types/store.interface';
import { User } from '../types/user.interface';
import AuthService from '../services/auth.service';


export const actions: ActionTree<RootState, RootState> = {
	
	// eslint-disable-next-line
	async login({ commit }, payload: { code: string, state: string }): Promise<User | string> {
		try {
			const user = await AuthService.login(payload.code, payload.state);
			return Promise.resolve(user);
		} catch(error) {
			throw new Error();
		}
	},

	// eslint-disable-next-line
	async basicAuthLogin({ commit }, payload: { username: string, password: string }): Promise<User | string> {
		try {
			const user = await AuthService.loginUserBasicAuth(payload.username, payload.password);
			return Promise.resolve(user);
		} catch(error) {
			throw new Error(error.response.data.message);
		}
	},

	// eslint-disable-next-line
	async twoFALogin({ commit }, payload: { code: string }): Promise<User | string> {
		try {
			const user = await AuthService.twoFALogin(payload.code);
			return Promise.resolve(user);
		} catch(error) {
			return Promise.reject(error);
		}
	},

	logout({ commit }) {
		commit('logout');
	},
}
