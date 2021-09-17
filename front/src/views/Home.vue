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
	/* background-image: url('https://en-marche.fr/assets/images/ecole-42-en-marche-emmanuel-macron-niel-code-dev-french-tech.jpg?q=70&cache=15d88f6e63eaa73b665c&fm=pjpg&s=3127360a86ae16887bbc61182836c450'); */
	background-size: cover;
	height: 80vh;
	width: 100vw;
	position: absolute;
	display: flex;
	align-items: flex-start;
}

.fullPage:after {
	opacity: 0.7;
    content: "";  /*/ :before and :after both require content*/
    position: absolute;
    width: 100%; /*/ Makes the overlay same size to accommodate the skew*/
    height: 100%;
    top: 0;
    left: 50%; /*/ Push the element 50% of the container's width to the right*/
    transform: skew(0deg) /*/ Puts the element on an angle*/
               translateX(-50%); /*/ Moves the element 50% of its width back to the left*/
    background-image: linear-gradient(120deg, lightblue,white);
}


.fullPage>*:first-child {
	color: red;
    align-self: center;
	z-index: 100;
}


.leaderboard {
	z-index: 99;
	align-self: center;
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