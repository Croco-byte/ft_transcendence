export default function authHeader(): { Authorization: string } | Record<string, never> {
	try {
		const user: { username: string, accessToken: string, twoFARedirect?: boolean } = JSON.parse(localStorage.getItem('user') as string);
		if (user && user.accessToken) {
			return { Authorization: 'Bearer ' + user.accessToken };
		}
		return {};
	} catch(e) {
		return {};
	}
}
