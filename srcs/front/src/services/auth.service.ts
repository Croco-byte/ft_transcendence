import axios from "../axios-instance";
import authHeader from './auth-header';
import { LocalStorageUserInterface } from '../types/user.interface'


const API_URL = "http://127.0.0.1:3000/";

class AuthService {

	/* Simple function to parse the JWT token and extract the user ID from the front.
	** If the JWT was modified to manipulate the ID, the user will be logged out on his next interaction with backend. */
	parseJwt(): { id: number, username: string, isSecondFactorAuthenticated: boolean } {
		const user: LocalStorageUserInterface = JSON.parse(localStorage.getItem('user') as string);
		return JSON.parse(atob(user.accessToken.split('.')[1]));
	}

	/* Sends the authentification request to backend, and return the resulting access token. */
	async login(code, state) {
			const response = await axios.post(API_URL + 'login', { code: code, state: state });
			if (response.data.accessToken) localStorage.setItem('user', JSON.stringify(response.data));
			else throw new Error();
			return response.data;
	}

	async loginUserBasicAuth(username: string, password: string) {
		const response = await axios.post(API_URL + "login/basic_auth_login", { username: username, password: password });
		if (response.data.accessToken) localStorage.setItem('user', JSON.stringify(response.data));
		else throw new Error();
		return response.data;
	}

	/* Sends the 2FA authentication request to backend, removes previous JWT (non-2FA JWT) and replaces it with a 2FA JWT. */
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

	/* Returns the QR Code to register the app via Google Authenticator */
	generateQRCode() {
		return axios.post(API_URL + "2fa/generate", '', { headers: authHeader(), responseType: 'blob' });
	}

	/* Allows to turn on 2FA with a correct 2FA code. Also returns a JWT with 2FA */
	turnOn2FA(code) {
		return axios.post(API_URL + "2fa/turn-on", { twoFactorAuthenticationCode: code } , { headers: authHeader() });
	}

	/* Allows to turn off 2FA */
	turnOff2FA() {
		return axios.post(API_URL + "2fa/turn-off", '', { headers: authHeader() });
	}

	registerUserBasicAuth(username: string, password: string) {
		return axios.post(API_URL + "login/basic_auth_register", { username: username, password: password });
	}
}

export default new AuthService();
