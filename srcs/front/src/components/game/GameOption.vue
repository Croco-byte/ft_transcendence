<template>
<div id ="setup">
	<p>DIFFICULTY</p>
	<div class="level">
		<button :class="select.level1 ? 'selected' : 'notselected'" @click="setLevel(1)">EASY</button>
		<button :class="select.level2 ? 'selected' : 'notselected'" @click="setLevel(2)">MEDIUM</button>
		<button :class="select.level3 ? 'selected' : 'notselected'" @click="setLevel(3)">HARD</button>
	</div>
	<p>MAX POINT</p>
	<div class="score">
		<button :class="select.score1 ? 'selected' : 'notselected'" @click="setScore(5)">5</button>
		<button :class="select.score2 ? 'selected' : 'notselected'" @click="setScore(10)">10</button>
		<button :class="select.score3 ? 'selected' : 'notselected'" @click="setScore(15)">15</button>
	</div>
	<p>PAD COLOR</p>
	<div class="color">
		<button class="white" @click="setPadColor('white')"></button>
		<button class="yellow" @click="setPadColor('yellow')"></button>
		<button class="blue" @click="setPadColor('blue')"></button>
		<button class="red" @click="setPadColor('red')"></button>
		<button class="green" @click="setPadColor('green')"></button>
	</div>
	<div class="start">
		<button @click="startGame()">START GAME</button>
	</div>

	<div class="rules">
		<h1 class="title">RULES</h1>
		<h2>Which pong master are you ?</h2>
		<p>The ball speed increases and the paddle lenght gets smaller with the levels</p>
		<p>Go EASY learner - Go MEDIUM conqueror -  Go HARD ball master</p>
		<br/>
		<h2>How hard you want to crush your opponent ?</h2>
		<p>Be gentle with 5 points - Be vicious with 10 points - Be fierce with 15 points </p>
		<br/>
		<h2>You can express your individuality</h2>
		<p>Choose the color that fits you well my dear</p>
	</div>
</div>

</template>

<style scoped>

#setup {
	margin-top: 5em;
}

p {
	position: relative;
	text-align: center;
	font-style: normal;
	font-weight: bold;
	font-size: 2em;
	margin-bottom: 0.3em;
	letter-spacing: 0.2em;
	color: black;
}

button {
	border: none;
}

.level, .score, .color, .start {
	display: flex;
	justify-content: center;
}

.selected {
	background-color: #A9DFBF;
}

.notselected {
	background-color: #808B96;
}

.level button:hover, .score button:hover {
	background-color: #A9DFBF;
}

.level button, .score button {
	margin-left: 2%;
	margin-right: 2%;
	padding: 1%;
	font-size: 1em;
	color: white;
	transition-duration: 0.4s;
}

.color button {
	border-radius: 5px;
	padding: 1em;
	margin-left: 1%;
	margin-right: 1%;
}

.color button:hover {
	transform: scale(1.05) perspective(1px)
}

.color button.yellow {
	background-color: #D4AC0D;
}

.color button.blue {
	background-color: blue;
}

.color button.red {
	background-color: red;
}

.color button.green {
	background-color: green;
}

.color button.white {
	background-color: #FDFEFE;
}

.start {
	/* background-color: blue; */
	position: relative;
	top: 50px;
}

.start button {
	color: white;
	background-color: #A9DFBF;
	border-radius: 10px;
	padding: 14px 40px;
	font-size: 1.5em;
}

.rules {
	position: relative;
	top: 6rem;
	/* background-color: chartreuse; */
}

.title, .rules p {
	font-size: 1rem;
	text-align: center;
}

.rules h2 {
	margin-bottom: 1rem;
	font-size: 1.5rem;
	text-align: center;
}

.rules h1 {
	font-size: 1.8rem;
	text-align: center;
}



</style>

<script lang="ts">
import { defineComponent } from 'vue'
import { Setup } from '../../types/game.interface'
import AuthService from '../../services/auth.service'


export default defineComponent({

	name: 'OptionGame',
	emits: ["setupChosen"],

	data() {
		return {
			opt: { level: 1, score: 5, paddleColor: 'white' } as Setup,
			// eslint-disable-next-line
			select: { level1: false, level2: false, level3: false, score1: false, score2: false, score3: false } as any
		}
	},

	methods: {
		setLevel(value: number) {
			if (value != undefined) {
				this.select.level1 = value === 1 ? true : false;
				this.select.level2 = value === 2 ? true : false;
				this.select.level3 = value === 3 ? true : false;

				this.opt.level = value;
			}
		},

		setScore(value: number) {
			if (value != undefined) {
				this.select.score1 = value === 5 ? true : false;
				this.select.score2 = value === 10 ? true : false;
				this.select.score3 = value === 15 ? true : false;

				this.opt.score = value;
			}
		},

		setPadColor(value: string) {
			if (value != undefined)
				this.opt.paddleColor = value;
		},

		startGame() {
			this.$emit('setupChosen', { setupChosen: this.opt as Setup, currUserId: Number(AuthService.parseJwt().id) });
		},

		resetOption() {
			this.opt.level = 1;
			this.opt.score = 5;
			this.opt.paddleColor = 'white';
		}
	},

	mounted() {
		this.resetOption();
		this.select.level1 = true;
		this.select.score1 = true;
	}
	
})
</script>

