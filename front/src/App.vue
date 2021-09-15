<script lang="ts">
import { defineComponent } from '@vue/runtime-core';
import Header from './components/Header.vue';
import UserService from './services/user.service';

export default defineComponent({
	name: 'App',
	components:
	{
		Header
	},
});

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
		overflow-x: hidden;
		background-color: #4F4F4F;
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
