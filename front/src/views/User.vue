<template>
	<div v-if="userNotFound" style="text-align: center;">
		<h2>{{ userNotFound }}</h2>
	</div>
	<div v-else-if="isDataLoaded" class="profile_page_container" >
		<div class="avatar">
			<img :src="avatar" fluid alt="User avatar"/>
		</div>
		<div class="header">
			<div>
				<h2><i class="fas fa-user"></i> Profile page of {{ displayName }}</h2>
				<div v-if="friendRequestStatus === 'accepted'">
					<UserStatus :status="status"/>
					<button class="Unfriend" v-on:click="unfriendUser">Unfriend</button>
				</div>
					<div v-if="friendRequestStatus === 'not-sent'">
					<button class="Send" type="button" v-on:click="sendFriendRequest">Send friend request</button>
				</div>
				<div v-if="friendRequestStatus === 'pending'">
					<button class="Send" type="button" disabled>Send friend request</button>
					<p>You already have sent a friend request to this user, which is pending</p>
				</div>
				<div v-if="friendRequestStatus === 'declined'">
					<button class="Send" type="button" disabled>Send friend request</button>
					<p>This friend request has been declined. Only the other user can send you a friend request now</p>
				</div>
				<div v-if="friendRequestStatus === 'declined-by-me'">
					<button class="Send" type="button" v-on:click="sendFriendRequest">Send friend request</button>
				</div>
				<div v-if="friendRequestStatus === 'waiting-for-current-user-response'">
				<button  class="Send" type="button" disabled>Send friend request</button>
					<p>This user has already sent you a friend request</p>
				</div>
				<br/>
				<div class="basic_info">
					<p><i class="fas fa-caret-right"></i> <b>42 login</b> : {{ name }}</p>
					<p><i class="fas fa-caret-right"></i> <b>Display name</b> : {{ displayName }}</p>
				</div>
				<br/>
				
			</div>
				<div class="stats">
					<h2><i class="fas fa-align-justify"></i> Player's stats</h2>
					<div class="score_info">
						<p><i class="fas fa-caret-right"></i> <b>Score</b> : <i class="fas fa-trophy"></i> {{ score }}</p>
						<p><i class="fas fa-caret-right"></i> <b>Wins</b> : <span style="color:#27AE60;"><b>{{ wins }}</b></span></p>
						<p><i class="fas fa-caret-right"></i> <b>Losses</b> : <span style="color:#FF0000;"><b>{{ loses }}</b></span></p>
					</div>
				</div>
		</div>
		
	</div>

</template>



<script lang="ts">

/* This view displays informations about a particular user. For example, this route : "/user/3" will display
** informations about the user with the ID "3".
** This page allows to see the status of the user, send him friend requests, or unfriend the user.
*/

import { defineComponent } from 'vue';
import UserService from '../services/user.service';
import authService from '../services/auth.service';
import UserStatus from '../components/UserStatus.vue';
import { UserStatusChangeData } from '../types/user.interface';
import { FriendStatusChangeData } from '../types/friends.interface';
import { createToast } from 'mosha-vue-toastify';
import 'mosha-vue-toastify/dist/style.css';

interface UserViewData
{
	currUserId: number;
	userId: number;
	name: string;
	displayName: string;
	status: string;
	avatar: string;
	score: number;
	wins: number;
	loses: number;
	userNotFound: string;
	friendRequestStatus: string;
}

export default defineComponent({
	name: 'User',
	components: {
		UserStatus
	},
	data(): UserViewData {
		return {
			currUserId: -1,
			userId: -1,
			name: '',
			displayName: '',
			status: '',
			avatar: '',
			score: 0,
			wins: 0,
			loses: 0,

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
		},

		confirmFriendRequest: function(data: { message: string }): void {
			createToast({
				title: 'Success',
				description: data.message
			},
			{
				position: 'top-right',
				type: 'success',
				transition: 'slide'
			})
		},

		errorFriendRequest: function(data: { message: string }): void {
			createToast({
				title: 'Error',
				description: data.message
			},
			{
				position: 'top-right',
				type: 'danger',
				transition: 'slide'
			})
		}

	},

	async created(): Promise<void> {
		this.currUserId = authService.parseJwt().id;
		this.userId = parseInt(this.$route.params.id as string);
		if (this.currUserId == this.userId) this.$router.push('/account');

		UserService.getUserInfo(this.$route.params.id).then(
			response => {
				this.name = response.data.username;
				this.displayName = response.data.displayName;
				this.status = response.data.status;
				this.score = response.data.score;
				this.wins = response.data.wins;
				this.loses = response.data.loses;
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

		this.$store.state.websockets.friendRequestsSocket.on('friendRequestConfirmation', this.confirmFriendRequest);
		this.$store.state.websockets.friendRequestsSocket.on('friendRequestError', this.errorFriendRequest);
	},

	beforeUnmount(): void {
		// ----- Stopping the listeners to update the target user connection status and the friend request status -----
		this.$store.state.websockets.connectionStatusSocket.off('statusChange', this.changeUserStatus);
		this.$store.state.websockets.friendRequestsSocket.off('friendStatusChanged', this.changeFriendRequestStatus);

		this.$store.state.websockets.friendRequestsSocket.off('friendRequestConfirmation', this.confirmFriendRequest);
		this.$store.state.websockets.friendRequestsSocket.off('friendRequestError', this.errorFriendRequest);
	}

})
</script>

<style scoped>

.profile_page_container
{
	width: 100%;
	min-height: 100%;
	margin: auto;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
}


.header
{
	display: flex;
	flex-wrap: wrap;
	justify-content: space-around;
}

.header > div
{
	margin: 1rem 2rem;
}

.avatar img
{
	width: 250px;
	height: 250px;
	border-radius: 100%;
}

.Send
{
	background: #39D88F;
    color: white;
    border: none;
    outline: none;
    padding: 0.25rem 1rem;
	margin: 0 1rem;
	cursor: pointer;
	border: solid 1px white;
	transition: all 0.25s;
}

.Send:enabled:hover
{
	background: white;
	border-color: #39D88F;
	color: #39D88F;
}

.Send:disabled
{
	background-color: grey;
	cursor: not-allowed;
}

.Unfriend
{
	padding: 0.25rem 1rem;
	background-color: #c40707;
	color: white;
	border-radius: 2rem;
	margin-right: 1rem;
	cursor: pointer;
	border: solid 1px #c40707;
	transition: all 0.25s;
}

.Unfriend:hover
{
	border-color: #c40707;
	color: #c40707;
	background-color: white;
}


</style>
