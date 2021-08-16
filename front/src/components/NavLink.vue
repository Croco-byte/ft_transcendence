<template>
	<router-link :to="url"> {{ text }} </router-link>
</template>


<script>

/* This component handles the router links and their appearance */

import { RouterLink } from 'vue-router'

export default
{
	name: 'NavLink',
	props: {
		url:
		{
			type: String,
			default: '/'
		},
		text:
		{
			type: String,
			default: 'Default text'
		}
	},
	components: {
		RouterLink
	}
}
</script>

<style>
	a {
		text-decoration: none;
	}

	a.brand {
		font-size: 2rem;
	}
</style>
