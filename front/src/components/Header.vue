<script>

import NavLink from './NavLink.vue';

export default
{
	name: 'Header',
	components:
	{
		NavLink
	}
}
</script>

<template>
	<header>
		<NavLink url="/" text="Ft_transcendance" class="brand"/>
		<div class="links_container">
			<NavLink url="/" text="Dashboard"/>
			<NavLink url="/friends" text="Friends"/>
			<NavLink url="/chat" text="Chat"/>
			<NavLink url="/game" text="Game"/>
			<router-link to="/profile" id="profile_div"></router-link>
		</div>
	</header>
</template>

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