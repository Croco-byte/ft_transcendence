<template>
	<div id="yourFriends">
		<h2 style="text-align: center;">Your friends</h2>
		<div v-if="friends.length > 0">
			<ul>
				<li v-for="friend in friends" :key="friend.id">
					Friend: <router-link v-bind:to="'/user/' + friend.id">{{ friend.displayName }}</router-link>&nbsp;&nbsp;&nbsp;&nbsp;<button v-on:click="unfriendUser(friend.id)">Unfriend</button>
					<UserStatus :status="friend.status"/>
				</li>
			</ul>
		<div id="paginationMenu" v-if="friends.length > 0">
			<p style="display: flex; justify-content: space-around;">
				<button :disabled="hidePreviousPageButton" v-on:click="getFriends(friendsMeta.currentPage - 1)">Previous</button>
				<span style="display: flex;">&nbsp;&nbsp;&nbsp;&nbsp;<form id="goToFriendsPage"><input name="goToFriendsPageInput" v-model.number="friendsMeta.currentPage" v-on:input="goToFriendsPage" style="width: 30px"></form><span style="padding-top: 5px;">/{{ friendsMeta.totalPages }}</span>&nbsp;&nbsp;&nbsp;&nbsp;</span>
				<button :disabled="hideNextPageButton" v-on:click="getFriends(friendsMeta.currentPage + 1)">Next</button>
			</p>
		</div>
		</div>
		<div v-else>
			<p>No friends found</p>
		</div>
	</div>
</template>

<script>
import authService from '../services/auth.service';
import UserService from '../services/user.service';
import UserStatus from '../components/UserStatus.vue';

export default {
	name: 'FriendList',
	components: {
		UserStatus
	},
	data() {
		return {
			currUserId: 0,
			friends: [],
			friendsMeta: {},

		}
	},
	
	computed: {
		hidePreviousPageButton: function() {
		  if(typeof(this.friendsMeta.currentPage) !== 'number' || this.friendsMeta.currentPage <= 1 || this.friendsMeta.currentPage > this.friendsMeta.totalPages) {
			  return true;
		  }
		  return false;
	  },
	  
	    hideNextPageButton: function() {
		  if(typeof(this.friendsMeta.currentPage) !== 'number' || this.friendsMeta.currentPage >= this.friendsMeta.totalPages || this.friendsMeta.currentPage < 1) {
			  return true;
		  }
		  return false;
		}
	  },
	
	methods: {
	  getFriends: function(page = 1) {
		  var ref = this;
		  if (ref.friendsMeta.totalPages > 0 && (Number.isNaN(page) || page < 1 || page > this.friendsMeta.totalPages)) return ;
		  UserService.getFriends(page).then(
			  response => {
				  ref.friends = response.data.items; ref.friendsMeta = response.data.meta;
				  if (ref.friendsMeta.itemCount < 1 && ref.friendsMeta.currentPage > 1) {
					  ref.getFriends(ref.friendsMeta.currentPage - 1);
				  }
				},
			  () => { console.log("Couldn't retrieve friends from backend"); })
	  },

	  goToFriendsPage: function() {
		  let data = new FormData(document.getElementById("goToFriendsPage"));
		  const destinationPage = data.get('goToFriendsPageInput');
		  if (!Number.isNaN(destinationPage) && destinationPage >= 1 && destinationPage <= this.friendsMeta.totalPages) {
			  this.getFriends(destinationPage);
		  }
	  },

	  unfriendUser: function(friendId) {
		  this.$store.state.auth.websockets.friendRequestsSocket.emit('unfriendUser', { friendId, user: null });
	  }
	},

	created() {
		this.currUserId = authService.parseJwt().id;
		this.getFriends();
  },

  mounted() {
	  this.$store.state.auth.websockets.friendRequestsSocket.on('friendRequestAccepted', (friendRequest) => {
			if (friendRequest.creatorId == this.currUserId || friendRequest.receiverId == this.currUserId) {
				this.getFriends(this.friendsMeta.currentPage);
			}
		})
	  
	  this.$store.state.auth.websockets.friendRequestsSocket.on('userUnfriended', (result) => {
		  if (this.currUserId == result.userOne || this.currUserId == result.userTwo) this.getFriends(this.friendsMeta.currentPage);
	  })

	  this.$store.state.auth.websockets.connectionStatusSocket.on('userOnline', (userId) => {
		  for(var i=0; i < this.friends.length; i++) {
			  if (this.friends[i].id == userId) {
				  this.friends[i].status = 'online';
			  }
		  }
	  })
	  this.$store.state.auth.websockets.connectionStatusSocket.on('userOffline', (userId) => {
		  for(var i=0; i < this.friends.length; i++) {
			  if (this.friends[i].id == userId) {
				  this.friends[i].status = 'offline';
			  }
		  }
	  })
	  this.$store.state.auth.websockets.connectionStatusSocket.on('userInGame', (userId) => {
		  for(var i=0; i < this.friends.length; i++) {
			  if (this.friends[i].id == userId) {
				  this.friends[i].status = 'in-game';
			  }
		  }
	  })
  },
}
</script>

<style scoped>
	#yourFriends {
		width: 50%;
		margin: 0 auto;
		border: solid;
	}

	li a {
		text-decoration: underline;
		color: blue;
	}
</style>
