<script>
import Header from './components/Header.vue';

export default
{
	name: 'App',
	components:
	{
		Header
	},
	created () {
		console.log("hi :)");
	}
}
</script>

<template>
	<div>
		<Header/>
		<router-view></router-view>
	</div>
</template>

<style>
	body
	{
		margin: 0;
		overflow: hidden;
	}

	*
	{
		box-sizing: border-box;
	}

	a
	{
		text-decoration: none;
		color: black;
	}

	.flex
	{
		display: flex;
	}

	.j-sb
	{
		justify-content: space-between;
	}

</style>
