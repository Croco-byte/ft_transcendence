<template>
	<div id="receivedFriendRequests">
		<h2 style="text-align: center;">Received friend requests</h2>
		<div v-if="receivedRequests.length > 0">
		<ul>
			<li v-for="request in receivedRequests" :key="request.id">
				<p>
					From: <router-link v-bind:to="'/user/' + request.creator.id" style="text-decoration: underlined;">{{ request.creator.username }}</router-link>
				</p>
				<p>
					<button @click="acceptFriendRequest(request.id)">Accept</button>
					<button @click="declineFriendRequest(request.id)">Decline</button>
				</p>
				<br/>
			</li>
		</ul>
		<div id="paginationMenu" v-if="receivedRequests.length > 0">
			<p style="display: flex; justify-content: space-around;">
				<button :disabled="hidePreviousPageButton" v-on:click="getFriendRequestsFromRecipients(receivedRequestsMeta.currentPage - 1)">Previous</button>
				<span style="display: flex;">&nbsp;&nbsp;&nbsp;&nbsp;<form id="goToReceivedRequestsPage"><input name="goToReceivedRequestsPageInput" v-model.number="receivedRequestsMeta.currentPage" v-on:input="goToReceivedRequestsPage" style="width: 30px"></form><span style="padding-top: 5px;">/{{ receivedRequestsMeta.totalPages }}</span>&nbsp;&nbsp;&nbsp;&nbsp;</span>
				<button :disabled="hideNextPageButton" v-on:click="getFriendRequestsFromRecipients(receivedRequestsMeta.currentPage + 1)">Next</button>
			</p>
		</div>
		</div>
		<div v-else>
			<p>Nothing to show here</p>
		</div>
	</div>
</template>

<script>
import authService from '../services/auth.service';
import UserService from "../services/user.service"

export default {
	name: "ReceivedFriendRequests",
	data() {
		return {
			currUserId: 0,
			receivedRequests: [],
			receivedRequestsMeta: {},
		}
	},

	computed: {
		hidePreviousPageButton: function() {
		  if(typeof(this.receivedRequestsMeta.currentPage) !== 'number' || this.receivedRequestsMeta.currentPage <= 1 || this.receivedRequestsMeta.currentPage > this.receivedRequestsMeta.totalPages) {
			  return true;
		  }
		  return false;
	  },
	  
	    hideNextPageButton: function() {
		  if(typeof(this.receivedRequestsMeta.currentPage) !== 'number' || this.receivedRequestsMeta.currentPage >= this.receivedRequestsMeta.totalPages || this.receivedRequestsMeta.currentPage < 1) {
			  return true;
		  }
		  return false;
		}
	  },

	methods: {
		getFriendRequestsFromRecipients: function(page = 1) {
			var ref = this;
			if (this.receivedRequestsMeta.totalPages > 0 && (Number.isNaN(page) || page < 1 || page > this.receivedRequestsMeta.totalPages)) return ;
			UserService.getFriendRequestsFromRecipients(page).then(
				response => {
					ref.receivedRequests = response.data.items; ref.receivedRequestsMeta = response.data.meta;
					if (ref.receivedRequestsMeta.itemCount < 1 && ref.receivedRequestsMeta.currentPage > 1) {
					  ref.getFriendRequestsFromRecipients(ref.receivedRequestsMeta.currentPage - 1);
				  }
				},
				() => { console.log("Couldn't retrieve received friend requests from backend")})
		},

	  goToReceivedRequestsPage: function() {
		  let data = new FormData(document.getElementById("goToReceivedRequestsPage"));
		  const destinationPage = data.get('goToReceivedRequestsPageInput');
		  if (!Number.isNaN(destinationPage) && destinationPage >= 1 && destinationPage <= this.receivedRequestsMeta.totalPages) {
			  this.getFriendRequestsFromRecipients(destinationPage);
		  }
	  },

	  acceptFriendRequest: function(friendRequestId) {
		  var ref = this;
		  this.$store.state.auth.websockets.friendRequestsSocket.emit('acceptFriendRequest', { friendRequestId });
	  },

	  declineFriendRequest: function(friendRequestId) {
		  var ref = this;
		  this.$store.state.auth.websockets.friendRequestsSocket.emit('declineFriendRequest', { friendRequestId });
	  },
	},

	created() {
		this.getFriendRequestsFromRecipients();
		this.currUserId = authService.parseJwt().id;
	},
	mounted() {
		this.$store.state.auth.websockets.friendRequestsSocket.on('friendRequestAccepted', (friendRequest) => {
			if (friendRequest.receiverId == this.currUserId) this.getFriendRequestsFromRecipients(this.receivedRequestsMeta.currentPage);
		})

		this.$store.state.auth.websockets.friendRequestsSocket.on('friendRequestDeclined', (friendRequest) => {
			if (friendRequest.receiverId == this.currUserId) this.getFriendRequestsFromRecipients(this.receivedRequestsMeta.currentPage);
		})

		this.$store.state.auth.websockets.friendRequestsSocket.on('sentFriendRequest', (result) => {
			if (result.receiverId == this.currUserId) this.getFriendRequestsFromRecipients(this.receivedRequestsMeta.currentPage);
		})
	},
}
</script>

<style scoped>
	#receivedFriendRequests {
		width: 50%;
		margin: 0 auto;
		border: solid;
	}

	li a {
		text-decoration: underline;
		color: blue;
	}
</style>
