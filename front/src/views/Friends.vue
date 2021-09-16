<template>
<div id="container">
	<div class="friends_list">
		<FriendList/>
	</div>
	<div class="friends_search_requests_container">
		<UserSearch/>
		<FriendRequests/>
	</div>
</div>
</template>

<script>

/* The view for the "Friends" page. Everything is implemented in the components. */

import { defineComponent } from 'vue'

import FriendList from "../components/FriendList_v2.vue"
import UserSearch from "../components/UserSearch_v2.vue"
import FriendRequests from '../components/FriendRequests.vue'

export default defineComponent({
	name: 'Friends',
	components: {
		FriendList,
		UserSearch,
		FriendRequests,
	}
})
</script>

<style scoped>

#container
{
	display: flex;
	justify-content: space-around;
	padding: 2rem;
	width: 100%;
	background-color: white;
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
	height: 80vh;
}

</style>
