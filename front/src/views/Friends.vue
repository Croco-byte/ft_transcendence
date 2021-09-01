<template>
<div id="container">
	<UserSearch/>
	<FriendList/>
	<ReceivedFriendRequests/>
	<SentFriendRequests/>
</div>
</template>

<script>

/* The view for the "Friends" page. Everything is implemented in the components. */

import { defineComponent } from 'vue'

import FriendList from "../components/FriendList.vue"
import UserSearch from "../components/UserSearch.vue"
import ReceivedFriendRequests from "../components/ReceivedFriendRequests.vue"
import SentFriendRequests from "../components/SentFriendRequests.vue"

export default defineComponent({
	name: 'Friends',
	components: {
		FriendList,
		UserSearch,
		ReceivedFriendRequests,
		SentFriendRequests
	}
})
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
