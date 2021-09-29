import { LocalStorageUserInterface } from '../types/user.interface'

export default function authHeader(): { Authorization: string } | Record<string, never> {
	try {
		const user: LocalStorageUserInterface = JSON.parse(localStorage.getItem('user') as string);
		if (user && user.accessToken) {
			return { Authorization: 'Bearer ' + user.accessToken.trim() };
		}
		return {};
	} catch(e) {
		return {};
	}
}
