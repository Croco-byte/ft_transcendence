<template>
<div id="container">
	<div class="friends_list">
		<FriendList/>
	</div>
	<div class="friends_search_requests_container">
		<UserSearch/>
		<FriendRequests/>
		<!-- <ReceivedFriendRequests/> -->
		<!-- <SentFriendRequests/> -->
	</div>
</div>
</template>

<script>

/* The view for the "Friends" page. Everything is implemented in the components. */

import { defineComponent } from 'vue'

import FriendList from "../components/FriendList_v2.vue"
import UserSearch from "../components/UserSearch_v2.vue"
import ReceivedFriendRequests from "../components/ReceivedFriendRequests.vue"
import SentFriendRequests from "../components/SentFriendRequests.vue"
import FriendRequests from '../components/FriendRequests.vue'

export default defineComponent({
	name: 'Friends',
	components: {
		FriendList,
		UserSearch,
		FriendRequests,
		// ReceivedFriendRequests,
		// SentFriendRequests
	}
})
</script>

<style>

body
{
	background: #F9F9F9;
}

#container
{
	display: flex;
	justify-content: space-around;
	padding: 2rem;
	width: 100%;
}

.friends_list
{
	width: 45%;
}

.friends_search_requests_container
{
	display: flex;
	flex-direction: column;
	width: 45%;
}

</style>
