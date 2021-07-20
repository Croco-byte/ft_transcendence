import axios from '../axios-instance';
import authHeader from './auth-header';

const API_URL = "http://127.0.0.1:3000/"

class AccountService {
	getAccountInfo() {
		return axios.get(API_URL + 'profile', { headers: authHeader() });
	}
}

export default new AccountService();
