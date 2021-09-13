import { ActionTree } from 'vuex';
import { RootState } from '../types/store.interface';
import { User } from '../types/user.interface';
import AuthService from '../services/auth.service';


export const actions: ActionTree<RootState, RootState> = {
	async login({ commit }, payload: { code: string, state: string }): Promise<User | string> {
		try {
			const user = await AuthService.login(payload.code, payload.state);
			return Promise.resolve(user);
		} catch(error) {
			commit('loginFailure');
			return Promise.reject(error.message);
		}
	},

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
	}
}
