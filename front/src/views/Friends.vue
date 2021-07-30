<template>
<div id="container">
	<div id="searchUser">
		<h2 style="text-align: center;">Search a user</h2>
		<form id="userSearchForm">
			<input type="text" name="searchUserInput" placeholder="Search a user" style="margin-right: 20px">
			<button type="button" v-on:click="searchUser()">Search</button>
		</form>

		<ul>
			<li v-for="result in searchResults" :key="result.username">
				<router-link v-bind:to="'/user/' + result.id" style="text-decoration: underlined;">{{ result.username }}</router-link>
			</li>
		</ul>

		<div id="paginationMenu" style = "text-align: center;">
			<p>
				<span v-if="searchResults.length > 0 && searchMeta.currentPage > 1">Previous</span>
				<span v-if="searchResults.length > 0">&nbsp;&nbsp;&nbsp;&nbsp;{{ searchMeta.currentPage }}/{{ searchMeta.totalPages }}&nbsp;&nbsp;&nbsp;&nbsp;</span>
				<span v-if="searchResults.length > 0 && searchMeta.currentPage < searchMeta.totalPages" v-on:click="changeSearchPage(searchMeta.currentPage + 1)">Next</span>
			</p>
		</div>
	</div>
	<div id="yourFriends">
		<h2 style="text-align: center;">Your friends</h2>
				<ul>
			<li v-for="friend in friends" :key="friend.id">
				Friend: <router-link v-bind:to="'/user/' + friend.id" style="text-decoration: underlined;">{{ friend.username }}</router-link>
			</li>
		</ul>
	</div>
	<div id="receivedFriendRequests">
		<h2 style="text-align: center;">Received friend requests</h2>
		<ul>
			<li v-for="request in receivedRequests" :key="request.id">
				<p>
					From: <router-link v-bind:to="'/user/' + request.creator.id" style="text-decoration: underlined;">{{ request.creator.username }}</router-link>
				</p>
				<p>
					<button @click="acceptFriendRequest(request)">Accept</button>
					<button @click="declineFriendRequest(request.id)">Decline</button>
				</p>
				<br/>
			</li>
		</ul>
	</div>
	<div id="sentFriendRequests">
		<h2 style="text-align: center;">Sent friend requests</h2>
		<ul>
			<li v-for="request in sentRequests" :key="request.id">
				<p>To: <router-link v-bind:to="'/user/' + request.receiver.id" style="text-decoration: underlined;">{{ request.receiver.username }}</router-link></p>
				<p>
					[Still Pending]
				</p>
				<br/>
			</li>
		</ul>
	</div>
</div>
</template>

<script>
import UserService from "../services/user.service"

export default {
  name: 'Friends',
  data() {
	  return {
		  receivedRequests: [],
		  sentRequests: [],
		  friends: [],

		  friendsAutoUpdate: '',
		  toRequestAutoUpdate: '',

		  searchResults: [],
		  searchLinks: {},
		  searchMeta: {},
		  searchUsername: ''
	  }
  },
  
  methods: {
	  getFriends: function() {
		  var ref = this;
		  UserService.getFriends().then(
			  response => { ref.friends = response.data; },
			  () => { console.log("Couldn't retrieve friends from backend") }
		  )
	  },

	  getFriendRequestsFromRecipients: function() {
		  var ref = this;
		  UserService.getFriendRequestsFromRecipients().then(
			  response => { ref.receivedRequests = response.data; },
			  () => { console.log("Couldn't retrieve received friend requests from backend")}
	  )},

	  getFriendRequestsToRecipients: function() {
		  var ref = this;
		  UserService.getFriendRequestsToRecipients().then(
			  response => { ref.sentRequests = response.data;},
			  () => { console.log("Couldn't retrieve sent friend requests from backend")}
	  )
	  },

	  acceptFriendRequest: function(request) {
		  let friendRequestId = request.id;
		  UserService.acceptFriendRequest(friendRequestId).then(
			  () => {
				  for (var i = 0; i < this.receivedRequests.length; i++) {
					  if (this.receivedRequests[i].id == friendRequestId) { this.friends.push(request.creator); this.receivedRequests.splice(i, 1);};
				  }
			  },
			  () => { console.log("Error encountered while accepting friend request " + friendRequestId) }
		  )
	  },

	  declineFriendRequest: function(friendRequestId) {
		  UserService.declineFriendRequest(friendRequestId).then(
			  () => {
				  for (var i = 0; i < this.receivedRequests.length; i++) {
					  if (this.receivedRequests[i].id == friendRequestId) { this.receivedRequests.splice(i, 1);};
				  }
			  },
			  () => { console.log("Error encountered while declining friend request " + friendRequestId) }
		  )
	  },

	  searchUser: function() {
		  var ref = this;
		  let data = new FormData(document.getElementById("userSearchForm"));
		  this.searchUsername = data.get('searchUserInput');
		  UserService.searchUser(this.searchUsername).then(
			  response => {
				  ref.searchResults = response.data.items;
				  ref.searchLinks = response.data.links;
				  ref.searchMeta = response.data.meta;
				},
			  () => { ref.searchUsername = ''; console.log("Couldn't get search results from backend") }
		  )
	  },

	  changeSearchPage: function(username, page) {
		  var ref = this;
		  UserService.searchUser(username, page).then(
			  response => {
				  ref.searchResults = response.data.items;
				  ref.searchLinks = response.data.links;
				  ref.searchMeta = response.data.meta;
				  console.log(response.data);
			  },
			  () => { console.log("Failed to change search result page") }
		  )
	  }
  },

  created() {
	  this.getFriendRequestsFromRecipients();
	  this.getFriendRequestsToRecipients();
	  this.getFriends();

	  /* Automatically refreshes friends and sent request every 10 seconds */
	  this.friendsAutoUpdate = setInterval(this.getFriends, 10000);
	  this.toRequestAutoUpdate = setInterval(this.getFriendRequestsToRecipients, 10000);
  },

  beforeDestroy() {
	  clearInterval(this.friendsAutoUpdate);
	  clearInterval(this.toRequestAutoUpdate);
  }
  
}
</script>

<style scoped>
	#container {
		display: flex;
	}

	#searchUser {
		border: solid;
		width: 50%;
		margin: 0 auto;
	}

	#yourFriends {
		width: 50%;
		margin: 0 auto;
		border: solid;
	}

	#receivedFriendRequests {
		width: 50%;
		margin: 0 auto;
		border: solid;
	}

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
