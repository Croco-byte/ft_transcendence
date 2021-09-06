<template>
  <div class="home">
    <h1>WELCOME</h1>
	</div>
	<div v-if="$store.state.status.loggedIn === true">
		<p>You're logged in :)</p>
		<button v-on:click="logout">Logout</button>
	</div>
	<div v-else>
		<p>You're not logged in yet :(</p>
	</div>
</template>

<script lang="ts">

import { defineComponent } from 'vue';

export default defineComponent ({
	name: 'Home',
	methods: {
		logout: function() {
			this.$store.dispatch('logout').then(() => {
				this.$router.push('/login'); })
		}
	}
})
</script>
