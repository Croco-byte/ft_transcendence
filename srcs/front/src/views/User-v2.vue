<script lang="ts">

/* This view displays informations about a particular user. For example, this route : "/user/3" will display
** informations about the user with the ID "3".
** This page allows to see the status of the user, send him friend requests, or unfriend the user.
*/

import { defineComponent } from 'vue'
import UserService from '../services/user.service'
import authService from '../services/auth.service'
import { UserStatusChangeData } from '../types/user.interface';
import { FriendStatusChangeData } from '../types/friends.interface';

interface UserViewData
{
	currUserId: number;
	userId: number;
	displayname: string;
	status: string;
	avatar: string;
	userNotFound: string;
	friendRequestStatus: string;
}

export default defineComponent({
	name: 'User',
	data(): UserViewData {
		return {
			currUserId: -1,
			userId: -1,
			displayname: '',
			status: '',
			avatar: '',

			userNotFound: '',

			friendRequestStatus: ''
		}
	},

	computed: {
		isDataLoaded(): boolean {
			if (this.displayname && this.avatar && this.friendRequestStatus && this.userId !== -1 && this.currUserId !== -1) return true;
			return false;
		}
	},

	methods: {
		sendFriendRequest: function(): void {
			this.$store.state.websockets.friendRequestsSocket.emit('sendFriendRequest', { receiverId: this.userId, user: null });
		},

		unfriendUser: function(): void {
			this.$store.state.websockets.friendRequestsSocket.emit('unfriendUser', { friendId: this.userId, user: null });
		},

		getFriendRequestStatusFromCurrUser: function(): void {
			var ref = this;
			UserService.getFriendRequestStatusFromCurrUser(this.$route.params.id).then(
			response => { ref.friendRequestStatus = response.data.status; },
			() => { console.log("Couldn't get friend request status from backend for specified user") })
		},

		changeUserStatus: function(data: UserStatusChangeData): void {
			if (data.userId == this.userId) this.status = data.status;
		},

		changeFriendRequestStatus: function(data: FriendStatusChangeData): void {
			if ((this.userId == data.creatorId && this.currUserId == data.receiverId) || (this.userId == data.receiverId && this.currUserId == data.creatorId)) {
				this.getFriendRequestStatusFromCurrUser();
			}
		}

	},

	async created(): Promise<void> {
		this.currUserId = authService.parseJwt().id;
		this.userId = parseInt(this.$route.params.id as string);
		if (this.currUserId == this.userId) this.$router.push('/account');

		UserService.getUserInfo(this.$route.params.id).then(
			response => {
				this.displayname = response.data.displayname;
				this.status = response.data.status;
				UserService.getUserAvatar(response.data.avatar).then(
					response => {
						const urlCreator = window.URL || window.webkitURL;
						this.avatar = urlCreator.createObjectURL(response.data);
					},
					() => { console.log("Couldn't load user's avatar") }
				)
			},
			() => { this.userNotFound = "This user doesn't exist" }
		)

		this.getFriendRequestStatusFromCurrUser();
	},

	mounted(): void {
		// ----- Listener to update the target user connection status and the friend request status -----
		this.$store.state.websockets.connectionStatusSocket.on('statusChange', this.changeUserStatus);
		this.$store.state.websockets.friendRequestsSocket.on('friendStatusChanged', this.changeFriendRequestStatus);
	},

	beforeUnmount(): void {
		// ----- Stopping the listeners to update the target user connection status and the friend request status -----
		this.$store.state.websockets.connectionStatusSocket.off('statusChange', this.changeUserStatus);
		this.$store.state.websockets.friendRequestsSocket.off('friendStatusChanged', this.changeFriendRequestStatus);
	}

})
</script>

<template>
	<div class="user_view">
		<div v-if="userNotFound">
			<h1>User not found</h1>
		</div>
		<div>
			<div class="head">
				<div class="image_container">
					<img :src="avatar"/>
				</div>
				<p>{{ displayname }}</p>
				<p class="status" :class="status">{{ status }}</p>
			</div>
			<div class="stat">
				<h2>Stats :</h2>
				<table class="stat_container">
					<tbody>
						<!-- For each stat item -->
						<tr>
							<td class="name">Win</td>
							<td class="value">12</td>
						</tr>
						<tr class="stat_item" v-for="item in 4" :key="item">
							<td class="name">Win</td>

							<td class="value">12</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
	</div>
</template>

<style scoped>

.user_view
{
	margin: 2rem auto;
	padding: 1rem;
	background-color: white;
	height: 100%;
}

.head
{
	display: flex;
	align-items: center;
	width: fit-content;
	margin: 0 auto;
	padding: 2rem 1rem;
}

.head .image_container
{
	width: 7rem;
	margin: 0 1rem;
	border-radius: 100%;
}

.head img
{
	width: 100%;
}

.head p
{
	margin: 0 0.5rem;
	padding: 0 1rem;
	font-size: 1.5rem;
}

.head .status
{
	position: relative;
	padding-left: 1.25rem;
}

.head .status:before
{
	content: ' ';
	position: absolute;
	top: 50%;
	left: 0;
	transform: translateY(-50%);
	width: 1rem;
	height: 1rem;
	background-color: #39D88F;
	border-radius: 100%;
}

.head .status.offline:before
{
	background-color: red;
}

.stat
{
	width: fit-content;
	margin: 2rem auto;
}

h2
{
	text-decoration: underline;
}

table
{
	width: 10rem;
	margin: 0 auto;
	border-spacing: 0 0.75rem;
}

td
{
	font-size: 1rem;
}

</style>
