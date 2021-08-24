<template>
	<div v-if="userNotFound" style="text-align: center;">
		<h2>{{ userNotFound }}</h2>
	</div>
	<div v-else-if="isDataLoaded" style="text-align: center;">
		<h2>Profile page of {{ displayName }}</h2>
		<img :src="avatar" fluid alt="User avatar" width="200" height="200"/>
		<p>Display name chosen by user : {{ displayName }}</p>
		
		<span v-if="status === 'online'" class="green-dot"></span>
		<span v-if="status === 'offline'" class="red-dot"></span>
		<span v-if="status === 'in-game'" class="orange-dot"></span>
		({{status}})

		<div v-if="friendRequestStatus">
			<div v-if="friendRequestStatus === 'not-sent'">
			<button type="button" v-on:click="sendFriendRequest">Send friend request</button>
			</div>
			<div v-if="friendRequestStatus === 'pending'">
			<button type="button" disabled>Send friend request</button>
			<p>You already have sent a friend request to this user, which is pending</p>
			</div>
			<div v-if="friendRequestStatus === 'declined'">
			<button type="button" disabled>Send friend request</button>
			<p>This friend request has been declined. Only the other user can send you a friend request now</p>
			</div>
			<div v-if="friendRequestStatus === 'declined-by-me'">
			<button type="button" v-on:click="sendFriendRequest">Send friend request</button>
			<p>You have already declined a friend request coming from this user. Only you can re-send this user a friend request</p>
			</div>
			<div v-if="friendRequestStatus === 'accepted'">
			<button type="button" disabled>Send friend request</button>
			<p>This friend request has been accepted : you're already friends !</p>
			<button v-on:click="unfriendUser">Unfriend</button>
			</div>
			<div v-if="friendRequestStatus === 'waiting-for-current-user-response'">
			<button type="button" disabled>Send friend request</button>
			<p>This user has already sent you a friend request</p>
			</div>
		</div>

	</div>

</template>



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
	displayName: string;
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
			displayName: '',
			status: '',
			avatar: '',

			userNotFound: '',

			friendRequestStatus: ''
		}
	},

	computed: {
		isDataLoaded(): boolean {
			if (this.displayName && this.avatar && this.friendRequestStatus && this.userId !== -1 && this.currUserId !== -1) return true;
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
				this.displayName = response.data.displayName;
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

<style scoped>
	.green-dot {
		height: 25px;
		width: 25px;
		background-color: green;
		border-radius: 50%;
		display: inline-block;
		margin-top: 5px;
	}

	.red-dot {
		height: 25px;
		width: 25px;
		background-color: red;
		border-radius: 50%;
		display: inline-block;
		margin-top: 5px;
	}

	.orange-dot {
		height: 25px;
		width: 25px;
		background-color: orange;
		border-radius: 50%;
		display: inline-block;
		margin-top: 5px;
	}
</style>
