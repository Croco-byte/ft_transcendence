<script>
import Header from './components/Header.vue';

export default
{
	name: 'App',
	components:
	{
		Header
	}
}
</script>

<template>
	<div id="app">
		<Header/>
		<router-view></router-view>
	</div>
</template>

<style>
	body
	{
		margin: 0;
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