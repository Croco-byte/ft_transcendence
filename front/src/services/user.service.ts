import axios from '../axios-instance';
import authHeader from './auth-header';

const API_URL = "http://127.0.0.1:3000/"

class UserService {
	getWebsiteOwner() {
		return axios.get(API_URL + 'user/administration/owner', { headers: authHeader() });
	}

	getWebsiteModerators(page: number) {
		return axios.get(API_URL + 'user/administration/moderators?limit=3&page=' + page, { headers: authHeader() });
	}

	getWebsiteBlockedUsers(page: number) {
		return axios.get(API_URL + 'user/administration/blocked_users?limit=3&page=' + page, { headers: authHeader() });
	}

	blockUserFromWebsite(userId: number) {
		return axios.post(API_URL + 'user/administration/block_user', { targetUserId: userId }, { headers: authHeader() });
	}

	unblockUserFromWebsite(userId: number) {
		return axios.post(API_URL + 'user/administration/unblock_user', { targetUserId: userId }, { headers: authHeader() });
	}

	makeModerator(userId: number) {
		return axios.post(API_URL + 'user/administration/make_moderator', { targetUserId: userId }, { headers: authHeader() });
	}

	makeRegularUser(userId: number) {
		return axios.post(API_URL + 'user/administration/make_regular', { targetUserId: userId }, { headers: authHeader() });
	}
	
	getCurrUserId() {
		return axios.get(API_URL + 'user', { headers: authHeader() });
	}

	getUserInfo(userId) {
		return axios.get(API_URL + 'user/' + userId, { headers: authHeader() });
	}

	getCurrUserInfo() {
		return axios.get(API_URL + 'user/info/me', { headers: authHeader() });
	}

	getCurrUserStatus() {
		return axios.get(API_URL + 'user/status/me', { headers: authHeader() });
	}

	getUserAvatar(path) {
		return axios.post(API_URL + 'user/avatar', { path: path }, { headers: authHeader(), responseType: 'blob' });
	}

	getCurrUserAvatar() {
		return axios.get(API_URL + 'user/avatar/me', { headers: authHeader(), responseType: 'blob' });
	}

	uploadAvatar(formData) {
		return axios.post(API_URL + 'user/avatar/update', formData, { headers: authHeader() });
	}

	getFriends(page = 1) {
		return axios.get(API_URL + 'user/friend-request/me/friends?limit=5&page=' + page, { headers: authHeader() });
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

	getHistory(page = 1) {
		return axios.get(API_URL + "user/history/me?limit=3&page=" + page, { headers: authHeader() });
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
		if (username == null) return axios.get(API_URL + "user/users?limit=5&page=" + page, { headers: authHeader() });
		return axios.get(API_URL + "user/users?limit=5&page=" + page + "&username=" + username, { headers: authHeader() });
	}

	changedisplayname(newdisplayname) {
		return axios.post(API_URL + 'user/displayname', { displayname: newdisplayname }, { headers: authHeader() });
	}

	getLeaderboardUsers(page = 1) {
		return axios.get(API_URL + "user/users/leaderboard?limit=7&page=" + page);
	}
}

export default new UserService();
