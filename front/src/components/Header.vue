<template>
	<header id="header" class="visible">
		<!-- <NavLink url="/" text="Ft_transcendence" class="brand"/> -->
		<div class="links_container" :class="{active: mode == 'links'}">
			<router-link to="/">
				<img src="/svg/home.svg" alt="Home"/>
			</router-link>
			<router-link to="/friends">
				<img src="/svg/friends.svg" alt="Friends"/>
			</router-link>
			<router-link to="/chat">
				<img src="/svg/chat.svg" alt="Chat"/>
			</router-link>
			<router-link to="/game">
				<img src="/svg/game.svg" alt="Game"/>
			</router-link>

			<router-link to="/account" id="profile_div" v-if="$store.state.status.loggedIn === true">
				<img src="/svg/profile.svg" alt="Profile"/>
			</router-link>
		</div>
		<div class="links_toggle" @click="changeVisibility()">
			<i class="fas fa-chevron-left"></i>
		</div>
	</header>
</template>

<script lang="ts">

/* This component displays the header of the application.
** If the user is logged-in, it loads his avatar in a bubble, which is a link leading to his profile page.
*/

import { defineComponent } from 'vue';
import userService from '../services/user.service';

export default defineComponent({
	name: 'Header',

	data()
	{
		return {
			mode : 'page',
			timer: -1,
		}
	},

	methods:
	{
		changeMode()
		{
			this.mode = (this.mode == 'links' ? 'page' : 'links');
		},

		changeVisibility()
		{
			let header = document.getElementsByTagName("header")[0];
			document.getElementsByClassName("router_view")[0].classList.toggle("header_mode");
			header.classList.toggle("visible");
		}
	},

	mounted()
	{
		if (this.$store.state.status.loggedIn === true)
		{
			userService.getCurrUserAvatar().then(
				response => {
					const urlCreator = window.URL || window.webkitURL;
					this.$store.state.avatar = urlCreator.createObjectURL(response.data);
				},
				() => { console.log("Couldn't get user avatar from backend"); }
			)
		}
	},
	watch:
	{
		$route: function()
		{
			this.mode = 'page';
		}
	}
});
</script>

<style>
	header
	{
		position: fixed;
		top: 0;
		left: 0;
		display: flex;
		flex-direction: column;
		justify-content: center;
		z-index: 99999;
		background-color: white;
		height: 100vh;
		width: 6.5rem;
		padding: 0.5rem 1rem;
		box-shadow: 5px 0px 15px 0px rgb(0 0 0 / 50%);
		transition: all 0.25s;
	}

	header:not(.visible)
	{
		transform: translateX(-6.5rem);
	}

	header a
	{
		padding: 0.5rem 1rem;
	}

	.links_container
	{
		display: flex;
		flex-direction: column;
	}

	.links_container a
	{
		display: flex;
		align-items: center;
		font-size: 1.2rem;
		padding: 0.5rem 1rem;
		margin: 0.5rem 0;
	}

	.links_container a img
	{
		display: block;
		width: 2.5rem;
	}

	.links_toggle
	{
		display: flex;
		align-items: center;
		justify-content: center;
		position: fixed;
		top: 50vh;
		left: 6.5rem;
		width: 2rem;
		background: white;
		height: 5rem;
		transform: translateY(-50%);
		border-top-right-radius: 1rem;
		border-bottom-right-radius: 1rem;
		box-shadow: 5px 0px 15px 0px rgb(0 0 0 / 50%);
		cursor: pointer;
	}

	header:not(.visible) .links_toggle
	{
		background: rgba(255, 255, 255, 0.3);
	}

	header:not(.visible) .links_toggle:hover
	{
		background: white;
	}

	.links_toggle i
	{
		font-size: 1.5rem;
		transform-origin: center center;
		transition: all 0.25s;
	}

	header:not(.visible) .links_toggle i
	{
		transform: rotateZ(-180deg);
	}
</style>
