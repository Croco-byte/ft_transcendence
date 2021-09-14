<template>
<div>
	<div class="title">
		<h1>WELCOME</h1>
	</div>

	<div class="login">
		<LoggingButton :message="message"/>
	</div>

	<div class="leaderboard">
		<Leaderboard/>
	</div>
	
</div>
</template>

<script lang="ts">

import { defineComponent } from 'vue';
import Leaderboard from '../components/Leaderboard.vue';
import LoggingButton from '../components/LoggingButton.vue';

interface LoginViewData
{
	message: string;
}

export default defineComponent ({
	name: 'Home',


	data(): LoginViewData {
		return {
			message: this.$route.params.message as string || '',
		}
	},

	components: {
		Leaderboard, LoggingButton
	},

	updated(): void {
		this.message = this.$route.params.message as string;
	}
})
</script>

<style scoped>

.leaderboard
{
	width: 50%;
	height: 50%;
}

</style>
