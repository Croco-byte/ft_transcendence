<template>
<div class='fullPage'>
	<div class="homeImage">
		<img src="https://i.pinimg.com/originals/d7/65/ca/d765cadd577d6901922c2bfcd8419015.gif ">
	</div>
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

.homeImage {
	/* width: 20vw;
	height: 20vh; */
	right: 0px;
	top: 0px;
	position: absolute;
	z-index: 10;
}


.fullPage {
	height: 100%;
	width: 100%;
	position: absolute;
	display: flex;
	align-items: flex-start;
	background-color: #E6EFF2;
	z-index: 100;
}

.welcome {
	color: #73C6B6;
	top: 10vh;
	left: 70vw;
	z-index: 100;
}


.leaderboard {
	z-index: 1;
	align-self: center;
	top: 20vh;
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