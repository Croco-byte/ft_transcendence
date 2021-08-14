import axios from '../axios-instance';
import authHeader from './auth-header';

const API_URL = "http://127.0.0.1:3000/"

class UserService {
	getCurrUserId() {
		return axios.get(API_URL + 'user', { headers: authHeader() });
	}

	getUserInfo(userId) {
		return axios.get(API_URL + 'user/' + userId, { headers: authHeader() });
	}

	getUserAvatar(path) {
		return axios.post(API_URL + 'user/avatar', { path: path }, { headers: authHeader(), responseType: 'blob' });
	}

	getFriends(page = 1) {
		return axios.get(API_URL + 'user/friend-request/me/friends?limit=2&page=' + page, { headers: authHeader() });
	}

	getFriendRequestStatusFromCurrUser(userId) {
		return axios.get(API_URL + "user/friend-request/status/" + userId, { headers: authHeader() });
	}

	sendFriendRequest(userId) {
		return axios.post(API_URL + "user/friend-request/send/" + userId, {}, { headers: authHeader() });
	}

	getFriendRequestsFromRecipients(page = 1) {
		return axios.get(API_URL + "user/friend-request/me/received-requests?limit=2&page=" + page, { headers: authHeader() });
	}

	getFriendRequestsToRecipients(page = 1) {
		return axios.get(API_URL + "user/friend-request/me/sent-requests?limit=2&page=" + page, { headers: authHeader() });
	}

	acceptFriendRequest(friendRequestId) {
		return axios.put(API_URL + "user/friend-request/response/" + friendRequestId, { status: 'accepted' }, { headers: authHeader() });
	}

	declineFriendRequest(friendRequestId) {
		return axios.put(API_URL + "user/friend-request/response/" + friendRequestId, { status: 'declined' }, { headers: authHeader() });
	}

	unfriendUser(friendId) {
		return axios.post(API_URL + "user/unfriend/" + friendId, {}, { headers: authHeader() });
	}

	searchUser(username, page = 1) {
		return axios.get(API_URL + "user/users?limit=5&page=" + page + "&username=" + username, { headers: authHeader() });
	}

	// Should be replaced by signals to the websocket
	setOnline(currUserId) {
		return axios.post(API_URL + "user/change-status/" + currUserId, { status: 'online' }, { headers: authHeader() });
	}

	// Should be replaced by signals to the websocket
	setOffline(currUserId) {
		return axios.post(API_URL + "user/change-status/" + currUserId, { status: 'offline' }, { headers: authHeader() });
	}

	changeDisplayName(newDisplayName) {
		return axios.post(API_URL + 'user/displayName', { displayName: newDisplayName }, { headers: authHeader() });
	}
}

export default new UserService();
