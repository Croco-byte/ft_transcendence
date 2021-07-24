import axios from "../axios-instance";
import authHeader from './auth-header';

const API_URL = "http://127.0.0.1:3000/";

class LoginService {
	async login(code, state) {
		try {
			const response = await axios.post(API_URL + 'login', { code: code, state: state });
			if (response.data.accessToken) {
				localStorage.setItem('user', JSON.stringify(response.data));
			}
			return response.data;
		} catch (e) {
			console.log("Caught an error when trying to login !");
			throw new Error("Login failure");
		}
	}

	async twoFALogin(twoFACode) {
		try {
			const response = await axios.post(API_URL + '2fa/authenticate', { twoFactorAuthenticationCode: twoFACode }, { headers: authHeader() });
			if (response.data.accessToken) {
				localStorage.removeItem('user');
				localStorage.setItem('user', JSON.stringify(response.data));
			}
			return response.data;
		} catch {
			throw new Error("2FA login failure");
		}
	}

	logout() {
		localStorage.removeItem('user');
	}

	generateQRCode() {
		return axios.post(API_URL + "2fa/generate", '', { headers: authHeader(), responseType: 'blob' });
	}

	turnOn2FA(code) {
		return axios.post(API_URL + "2fa/turn-on", { twoFactorAuthenticationCode: code } , { headers: authHeader() });
	}

	turnOff2FA() {
		return axios.post(API_URL + "2fa/turn-off", '', { headers: authHeader() });
	}
}

export default new LoginService();
