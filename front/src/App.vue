<script lang="ts">
import { defineComponent } from '@vue/runtime-core';
import Header from './components/Header.vue';

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
		<div class="router_view header_mode">
			<router-view></router-view>
		</div>
	</div>
</template>

<style>
	body
	{
		margin: 0;
		overflow-x: hidden;
		font-family: 'Source Sans Pro';
		background: #E6EFF2;
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

	#app > div
	{
		display: flex;
		width: 100%;
	}

	.router_view
	{
		width: 100%;
		background: #E6EFF2;
		transition: all 0.25s;
		min-height: 100vh;
	}

	.router_view.header_mode
	{
		width: calc(100% - 6.5rem);
		margin-left: 6.5rem;
	}

</style>
