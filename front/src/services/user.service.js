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

	getFriends() {
		return axios.get(API_URL + 'user/friend-request/me/friends', { headers: authHeader() });
	}

	getFriendRequestStatusFromCurrUser(userId) {
		return axios.get(API_URL + "user/friend-request/status/" + userId, { headers: authHeader() });
	}

	sendFriendRequest(userId) {
		return axios.post(API_URL + "user/friend-request/send/" + userId, {}, { headers: authHeader() });
	}

	getFriendRequestsFromRecipients() {
		return axios.get(API_URL + "user/friend-request/me/received-requests", { headers: authHeader() });
	}

	getFriendRequestsToRecipients() {
		return axios.get(API_URL + "user/friend-request/me/sent-requests", { headers: authHeader() });
	}

	acceptFriendRequest(friendRequestId) {
		return axios.put(API_URL + "user/friend-request/response/" + friendRequestId, { status: 'accepted' }, { headers: authHeader() });
	}

	declineFriendRequest(friendRequestId) {
		return axios.put(API_URL + "user/friend-request/response/" + friendRequestId, { status: 'declined' }, { headers: authHeader() });
	}

	searchUser(username, page = 1) {
		return axios.get(API_URL + "user/all?limit=2&page=" + page + "&username=" + username, { headers: authHeader() });
	}
}

export default new UserService();