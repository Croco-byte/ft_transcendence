import axios from "../axios-instance";

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
			throw new Error("Login failure boys");
		}
	}

	logout() {
		localStorage.removeItem('user');
	}
}

export default new LoginService();
