<script>

/* The view for the "Friends" page. Everything is implemented in the components. */

import { defineComponent } from 'vue'

import FriendList from "../components/FriendList.vue"
import UserSearch from "../components/UserSearch.vue"
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

<style scoped>

#container
{
	display: flex;
	justify-content: space-around;
	padding: 2rem;
	width: 100%;
	height: 100vh;
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

@media screen and (max-width: 850px)
{
	#container
	{
		flex-direction: column-reverse;
	}

	#container > div
	{
		width: 100%;
		margin: 0 auto;
	}
}

</style>
