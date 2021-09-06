<script lang="ts">
import { defineComponent } from 'vue';
import { RouterLink } from 'vue-router'

export default defineComponent({

	name: 'NavLink',
	props:
	{
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
	components:
	{
		RouterLink
	}
});

</script>

<template>
	<router-link :to="url"> {{ text }} </router-link>
	
</template>

<style>
	a
	{
		text-decoration: none;
	}

	a.brand
	{
		font-size: 2rem;
	}
</style>
