<template>
	<div id="sentFriendRequests">
		<h2 style="text-align: center;">Sent friend requests</h2>
		<div v-if="sentRequests.length > 0">
		<ul>
			<li v-for="request in sentRequests" :key="request.id">
				<p>
					To: <router-link v-bind:to="'/user/' + request.receiver.id" style="text-decoration: underlined;">{{ request.receiver.username }}</router-link>
				</p>
				<p>
					[Still Pending]
				</p>
				<br/>
			</li>
		</ul>
		<div id="paginationMenu" v-if="sentRequests.length > 0">
			<p style="display: flex; justify-content: space-around;">
				<button :disabled="hidePreviousPageButton" v-on:click="getFriendRequestsToRecipients(sentRequestsMeta.currentPage - 1)">Previous</button>
				<span style="display: flex;">&nbsp;&nbsp;&nbsp;&nbsp;<form id="goToSentRequestsPage"><input name="goToSentRequestsPageInput" v-model.number="sentRequestsMeta.currentPage" v-on:input="goToSentRequestsPage" style="width: 30px"></form><span style="padding-top: 5px;">/{{ sentRequestsMeta.totalPages }}</span>&nbsp;&nbsp;&nbsp;&nbsp;</span>
				<button :disabled="hideNextPageButton" v-on:click="getFriendRequestsToRecipients(sentRequestsMeta.currentPage + 1)">Next</button>
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
	name: "SentFriendRequests",
	data() {
		return {
			currUserId: 0,
			sentRequests: [],
			sentRequestsMeta: {},
		}
	},

	computed: {
		hidePreviousPageButton: function() {
		  if(typeof(this.sentRequestsMeta.currentPage) !== 'number' || this.sentRequestsMeta.currentPage <= 1 || this.sentRequestsMeta.currentPage > this.sentRequestsMeta.totalPages) {
			  return true;
		  }
		  return false;
	  },
	  
	    hideNextPageButton: function() {
		  if(typeof(this.sentRequestsMeta.currentPage) !== 'number' || this.sentRequestsMeta.currentPage >= this.sentRequestsMeta.totalPages || this.sentRequestsMeta.currentPage < 1) {
			  return true;
		  }
		  return false;
		}
	  },

	methods: {
		getFriendRequestsToRecipients: function(page = 1) {
			var ref = this;
			if (this.sentRequestsMeta.totalPages > 0 && (Number.isNaN(page) || page < 1 || page > this.sentRequestsMeta.totalPages)) return ;
			UserService.getFriendRequestsToRecipients(page).then(
				response => {
					ref.sentRequests = response.data.items; ref.sentRequestsMeta = response.data.meta;
					if (ref.sentRequestsMeta.itemCount < 1 && ref.sentRequestsMeta.currentPage > 1) {
					  ref.getFriendRequestsToRecipients(ref.sentRequestsMeta.currentPage - 1);
				  }
				},
				() => { console.log("Couldn't retrieve sent friend requests from backend")})
		},

	  goTosentRequestsPage: function() {
		  let data = new FormData(document.getElementById("goToSentRequestsPage"));
		  const destinationPage = data.get('goToSentRequestsPageInput');
		  if (!Number.isNaN(destinationPage) && destinationPage >= 1 && destinationPage <= this.sentRequestsMeta.totalPages) {
			  this.getFriendRequestsToRecipients(destinationPage);
		  }
	  },

	},

	created() {
		this.getFriendRequestsToRecipients();
		this.currUserId = authService.parseJwt().id;
	},

	mounted() {
		this.$store.state.auth.websockets.friendRequestsSocket.on('friendRequestAccepted', (friendRequest) => {
			if (friendRequest.creatorId == this.currUserId) this.getFriendRequestsToRecipients(this.sentRequestsMeta.currentPage);
		})

		this.$store.state.auth.websockets.friendRequestsSocket.on('friendRequestDeclined', (friendRequest) => {
			if (friendRequest.creatorId == this.currUserId) this.getFriendRequestsToRecipients(this.sentRequestsMeta.currentPage);
		})

		this.$store.state.auth.websockets.friendRequestsSocket.on('sentFriendRequest', (result) => {
			if (result.creatorId == this.currUserId) this.getFriendRequestsToRecipients(this.sentRequestsMeta.currentPage);
		})
	}


}
</script>

<style scoped>
	#sentFriendRequests {
		width: 50%;
		margin: 0 auto;
		border: solid;
	}

	li a {
		text-decoration: underline;
		color: blue;
	}
</style>
