import axios from '../axios-instance';
import authHeader from './auth-header';

const API_URL = "http://127.0.0.1:3000/"

class AccountService {
	getAccountInfo() {
		return axios.get(API_URL + 'profile', { headers: authHeader() });
	}

	uploadAvatar(formData) {
		return axios.post(API_URL + 'profile/avatar', formData, { headers: authHeader() });
	}

	getUserAvatar() {
		return axios.get(API_URL + 'profile/avatar', { headers: authHeader(), responseType: 'blob' });
	}
}

export default new AccountService();
