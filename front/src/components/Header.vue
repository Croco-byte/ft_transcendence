<template>
	<header id="header">
		<NavLink url="/" text="Ft_transcendence" class="brand"/>
		<div class="links_container" :class="{active: mode == 'links'}">
			<NavLink url="/" text="Home"/>
			<NavLink url="/friends" text="Friends"/>
			<NavLink url="/chat" text="Chat"/>
			<NavLink url="/game" text="Game"/>
			<NavLink url="/login" text="Login"/>
			<router-link to="/account" id="profile_div" v-if="$store.state.status.loggedIn === true">
				<img width="100" height="100" :src="$store.state.avatar" style="border-radius: 50%; max-width: 100%; max-height: 100%;"/>
			</router-link>
		</div>
		<div class="links_toggle" @click="changeMode()">
			<span></span>
			<span></span>
			<span></span>
		</div>
	</header>
</template>

<script lang="ts">

/* This component displays the header of the application.
** If the user is logged-in, it loads his avatar in a bubble, which is a link leading to his profile page.
*/

import { defineComponent } from 'vue';
import NavLink from './NavLink.vue';
import userService from '../services/user.service';

export default defineComponent({
	name: 'Header',
	components:
	{
		NavLink,
	},

	data()
	{
		return {
			mode : 'page'
		}
	},

	methods:
	{
		changeMode(mode: string)
		{
			this.mode = (this.mode == 'links' ? 'page' : 'links');
		}
	},

	mounted()
	{
		if (this.$store.state.status.loggedIn === true) {
			userService.getCurrUserAvatar().then(
				response => {
					const urlCreator = window.URL || window.webkitURL;
					this.$store.state.avatar = urlCreator.createObjectURL(response.data);
				},
				() => { console.log("Couldn't get user avatar from backend"); }
			)
		}
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

	.links_toggle
	{
		display: none;
	}

	@media screen and (max-width: 900px)
	{
		.links_toggle
		{
			display: flex;
			flex-direction: column;
			justify-content: center;
			cursor: pointer;
		}

		.links_toggle span
		{
			width: 2rem;
			height: 0.125rem;
			background-color: black;
			margin: 0.2rem
		}

		.links_container
		{
			position: fixed;
			flex-direction: column;
			transform: translateX(-100%);
			transition: all 0.25s ease-out;
			z-index: 999;
			width: 20rem;
			max-width: 80%;
			height: 100%;
		}

		.links_container.active
		{
			background: white;
			top: 0;
			left: 0;
			text-align: center;
			justify-content: center;
			align-items: center;
			transform: translateX(0);
		}

		.links_container a
		{
			margin: 1rem 0;
		}
	}
</style>
