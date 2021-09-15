<template>
<div class='fullPage'>
	<div class="welcome">
		<h1>WELCOME</h1>
		<LoggingButton :message="message"/>
	</div>

	<div class="leaderboard">
		<Leaderboard/>
	</div>
	
</div>
</template>

<style scoped>

.fullPage {
	width: 100vw;
	position: absolute;
	display: flex;
	align-items: flex-start;
}

.fullPage>*:first-child {
    align-self: center;
}

.leaderboard
{
	margin-left: auto;
    margin-right: auto;
	top: 10vh;
	width: 50%;
	height: 50%;
}

</style>

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

