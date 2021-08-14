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



<script>
import UserService from '../services/user.service'
import authService from '../services/auth.service'

export default {
  name: 'Home',
  	data () {
		return {
			currUserId: 0,
			userId: this.$route.params.id,
			displayName: '',
			status: '',
			avatar: '',

			userNotFound: '',

			friendRequestStatus: ''
		}
	},

	computed: {
		isDataLoaded() {
			return this.displayName && this.avatar && this.friendRequestStatus;
		}
	},

	methods: {
		sendFriendRequest: function() {
			this.$store.state.auth.websockets.friendRequestsSocket.emit('sendFriendRequest', { receiverId: this.userId, user: null });
		},

		unfriendUser: function() {
			this.$store.state.auth.websockets.friendRequestsSocket.emit('unfriendUser', { friendId: this.userId, user: null });
		},

		getFriendRequestStatusFromCurrUser: function() {
			var ref = this;
			UserService.getFriendRequestStatusFromCurrUser(this.$route.params.id).then(
			response => { ref.friendRequestStatus = response.data.status; },
			error => { console.log("Couldn't get friend request status from backend for specified user") })
		}
	},

	async created() {
		this.currUserId = authService.parseJwt().id;
		if (this.currUserId == parseInt(this.$route.params.id)) this.$router.push('/account');

		UserService.getUserInfo(this.$route.params.id).then(
			response => {
				this.displayName = response.data.displayName;
				this.status = response.data.status;
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

		this.getFriendRequestStatusFromCurrUser();
	},

	mounted() {
	  // ----- Listeners to update the target user connection status -----
		this.$store.state.auth.websockets.connectionStatusSocket.on('userOnline', (userId) => {
			if (userId == this.userId) this.status = "online";
	  })
	  this.$store.state.auth.websockets.connectionStatusSocket.on('userOffline', (userId) => {
		  if (userId == this.userId) this.status = "offline";
	  })
	  this.$store.state.auth.websockets.connectionStatusSocket.on('userInGame', (userId) => {
		  if (userId == this.userId) this.status = "in-game";
	  })

	  // ----- Listeners to update friend request status on user page -----
	  this.$store.state.auth.websockets.friendRequestsSocket.on('friendRequestAccepted', (friendRequest) => {
		  if ((this.userId == friendRequest.creatorId && this.currUserId == friendRequest.receiverId) || (this.userId == friendRequest.receiverId && this.currUserId == friendRequest.creatorId)) {
			  this.getFriendRequestStatusFromCurrUser();
		  }
	  })
	  this.$store.state.auth.websockets.friendRequestsSocket.on('friendRequestDeclined', (friendRequest) => {
		  if ((this.userId == friendRequest.creatorId && this.currUserId == friendRequest.receiverId) || (this.userId == friendRequest.receiverId && this.currUserId == friendRequest.creatorId)) {
			  this.getFriendRequestStatusFromCurrUser();
		  }
	  })
	  this.$store.state.auth.websockets.friendRequestsSocket.on('sentFriendRequest', (friendRequest) => {
		  if ((this.userId == friendRequest.creatorId && this.currUserId == friendRequest.receiverId) || (this.userId == friendRequest.receiverId && this.currUserId == friendRequest.creatorId)) {
			  this.getFriendRequestStatusFromCurrUser();
		  }
	  })
	  this.$store.state.auth.websockets.friendRequestsSocket.on('userUnfriended', (result) => {
		  if ((this.userId == result.userOne && this.currUserId == result.userTwo) || (this.userId == result.userTwo && this.currUserId == result.userOne)) {
			  this.getFriendRequestStatusFromCurrUser();
		  }
	  })
	}

}
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
