<template>
<div id="container">
	<UserSearch/>
	<FriendList/>
	<ReceivedFriendRequests/>
	<SentFriendRequests/>
</div>
</template>

<script>
import UserService from "../services/user.service"
import FriendList from "../components/FriendList.vue"
import UserSearch from "../components/UserSearch.vue"
import ReceivedFriendRequests from "../components/ReceivedFriendRequests.vue"
import SentFriendRequests from "../components/SentFriendRequests.vue"

export default {
  name: 'Friends',
  components: {
	  FriendList,
	  UserSearch,
	  ReceivedFriendRequests,
	  SentFriendRequests
  },
  data() {
	  return {
		  sentRequests: [],

		  friendsAutoUpdate: '',
		  toRequestAutoUpdate: '',
		  fromRequestAutoUpdate: '',
	  }
  },

  methods: {

	  getFriendRequestsToRecipients: function() {
		  var ref = this;
		  UserService.getFriendRequestsToRecipients().then(
			  response => { ref.sentRequests = response.data;},
			  () => { console.log("Couldn't retrieve sent friend requests from backend"); clearInterval(ref.toRequestAutoUpdate);}
	  )
	  },

	  sendFriendListRefreshSignal: function() {
		  this.emitter.emit("REFRESH_FRIEND_LIST");
	  },
	  sendFromRequestsRefreshSignal: function() {
		  this.emitter.emit("REFRESH_FROM_REQUESTS");
	  },
	  sendToRequestsRefreshSignal: function() {
		  this.emitter.emit("REFRESH_TO_REQUESTS");
	  }
  },

  created() {
	  this.getFriendRequestsToRecipients();

	  /* Automatically refreshes friend list, received requests and sent request every 10 seconds */
	  this.friendsAutoUpdate = setInterval(this.sendFriendListRefreshSignal, 10000);
	  this.toRequestAutoUpdate = setInterval(this.sendToRequestsRefreshSignal, 10000);
	  this.fromRequestAutoUpdate = setInterval(this.sendFromRequestsRefreshSignal, 10000);
  },

  beforeUnmount() {
	  clearInterval(this.friendsAutoUpdate);
	  clearInterval(this.toRequestAutoUpdate);
  }
  
}
</script>

<style scoped>
	#container {
		display: flex;
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
