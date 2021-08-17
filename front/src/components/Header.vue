<template>
	<header>
		<NavLink url="/" text="Ft_transcendence" class="brand"/>
		<div class="links_container">
			<NavLink url="/" text="Home"/>
			<NavLink url="/friends" text="Friends"/>
			<NavLink url="/chat" text="Chat"/>
			<NavLink url="/game" text="Game"/>
			<NavLink url="/login" text="Login"/>
			<!-- <router-link to="/account" id="profile_div" v-if="$store.state.auth.status.loggedIn === true"> -->
				<!-- <img width="100" height="100" :src="$store.state.auth.avatar" style="border-radius: 50%; max-width: 100%; max-height: 100%;"/> -->
			<!-- </router-link> -->
		</div>
	</header>
</template>

<script lang="ts">

/* This component displays the header of the application.
** If the user is logged-in, it loads his avatar in a bubble, which is a link leading to his profile page.
*/

import { defineComponent } from 'vue';
import NavLink from './NavLink.vue';
//import userService from '../services/user.service';
//import authHeader from '../services/auth-header';
//import authService from '../services/auth.service';

export default defineComponent({
	name: 'Header',
	components:
	{
		NavLink,
	},

	mounted() {

		// if (this.$store.state.auth.status.loggedIn === true) {
		// 	UserService.getUserAvatar().then(
		// 	  response => {
		// 		  const urlCreator = window.URL || window.webkitURL;
		// 		  this.$store.state.auth.avatar = urlCreator.createObjectURL(response.data);
		// 	  },
		// 	  error => { console.log("Couldn't get user avatar from backend"); }
		//   )
		// }
	}
});
</script>

<style>
	header
	{
		display: flex;
		justify-content: space-between;
		width: 100%;
		padding: 0.5rem 1rem;
	}

	header a
	{
		padding: 0.5rem 1rem;
	}

	.links_container
	{
		display: flex;
	}

	.links_container a
	{
		display: flex;
		align-items: center;
		font-size: 1.2rem;
		padding: 0.5rem 2rem;
	}

	#profile_div
	{
		display: block;
		width: 3rem;
		height: 3rem;
		border: solid;
		border-radius: 100%;
		margin: 0.5rem 2rem;
		padding: 0;
	}
</style>
