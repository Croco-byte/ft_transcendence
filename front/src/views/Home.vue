<template>
<div class='fullPage'>

	<div class="container1">
		<span class="text1">Welcome to</span>
		<span class="text2">Pong Game</span>
		<div class="container2">
			<LoggingButton :message="message"/>
		</div>

		<div class="container3">
			<Leaderboard class="childLeader"/>
		</div>
	</div>
	
</div>
</template>

<style scoped>

.fullPage {
	min-width: 1000px;
	height: 100%;
	width: 100%;
	position: absolute;
	display: block;
	background-color: #E6EFF2;
	z-index: 100;
}

.container1 span {
	text-transform: uppercase;
	display: block;
}

.container1 {
	text-align: center;
	position: relative;
	top: 5%;
}

.text1 .text2 {
	transform: translate(-50%, -50%);
	width: 100%
}

.text1 {
	color: #73C6B6;
	font-size:3.5em;
	font-weight: 700;
	letter-spacing: 0.1em;
	margin-bottom: 0.2em;
	background: #E6EFF2;
	position: relative;
	animation: textAnim 4s 1;
}

.text2 {
	font-weight: bold;
	font-size: 1.7em;
	color: #117864;
}

@keyframes textAnim {
	0% {
		color: #E6EFF2;
		margin-bottom: -0.8em;
	}
	30% {
		letter-spacing: 0.3em;
		margin-bottom: -0.8em;
	}
	85% {
		letter-spacing: 0.1em;
		margin-bottom: -0.8em;
	}
	
}

.container2 {
	position: relative;
	margin-top: 10em;
	margin-bottom: 8em;
	/* left: 20vw; */
}

.container3 {

	margin-top: 10em;
	width: 50vw;
	margin: 0 auto;
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