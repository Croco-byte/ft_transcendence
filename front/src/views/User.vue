<template>
	<div v-if="userNotFound" style="text-align: center;">
		<h2>{{ userNotFound }}</h2>
	</div>
	<div v-else-if="isDataLoaded" style="text-align: center;">
		<h2>Profile page of {{ username }}</h2>
		<img :src="avatar" fluid alt="User avatar" width="200" height="200"/>
		<p>Username --> {{ username }}</p>
		<p v-if="online">Status --> ONLINE</p>
		<p v-else>Status --> OFFLINE</p>
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
			<p>This friend request has been declined</p>
			</div>
			<div v-if="friendRequestStatus === 'accepted'">
			<button type="button" disabled>Send friend request</button>
			<p>This friend request has been accepted : you're already friends !</p>
			</div>
			<div v-if="friendRequestStatus === 'waiting-for-current-user-response'">
			<button type="button" disabled>Send friend request</button>
			<p>This user has already sent you a friend request</p>
			</div>
		</div>

	</div>

</template>



<script>
import UserService from '../services/user.service'

export default {
  name: 'Home',
  	data () {
		return {
			userId: this.$route.params.id,
			username: '',
			online: false,
			avatar: '',

			userNotFound: '',

			friendRequestStatus: ''
		}
	},

	methods: {
		sendFriendRequest: async function() {
			UserService.sendFriendRequest(this.$route.params.id).then(
				response => {
					this.friendRequestStatus = response.data.status;
				},
				error => { console.log("Couldn't send the friend request !")}
			)
		}
	},

	async beforeCreate() {
		const currUserId = await UserService.getCurrUserId();
		if (currUserId.data.id === parseInt(this.$route.params.id)) {
			this.$router.push('/account');
		}
		UserService.getUserInfo(this.$route.params.id).then(
			response => {
				this.username = response.data.username;
				this.online = response.data.online;
				UserService.getUserAvatar(response.data.avatar).then(
					response => {
						const urlCreator = window.URL || window.webkitURL;
						this.avatar = urlCreator.createObjectURL(response.data);
					},
					error => { console.log("Couldn't load user's avatar") }
				)
			},
			error => { this.userNotFound = "This user doesn't exist" }
		)
		UserService.getFriendRequestStatusFromCurrUser(this.$route.params.id).then(
			response => {
				this.friendRequestStatus = response.data.status;
			},
			error => { console.log("Couldn't get friend request status from backend for specified user") }
		)
	},

	computed: {
		isDataLoaded() {
			return this.username && this.avatar && this.friendRequestStatus;
		}
	}

}
</script>
