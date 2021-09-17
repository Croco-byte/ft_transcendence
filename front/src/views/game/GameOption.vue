<template>
<div id ="setup">
	<p>DIFFICULTY</p>
	<div class="level posbuttons hoverAnim">
		<button @click="setLevel(1)">EASY</button>
		<button @click="setLevel(2)">MEDIUM</button>
		<button @click="setLevel(3)">HARD</button>
	</div>
	<p>MAX POINT</p>
	<div class="score posbuttons hoverAnim">
		<button :class="{ scoreSelected : scoreActive }" @click="setScore(5)">5</button>
		<button :class="{ scoreSelected : scoreActive }" @click="setScore(10)">10</button>
		<button :class="{ scoreSelected : scoreActive }" @click="setScore(15)">15</button>
	</div>
	<p>PAD COLOR</p>
	<div class="color posbuttons">
		<button class="white" @click="setPadColor('white')"></button>
		<button class="yellow" @click="setPadColor('yellow')"></button>
		<button class="blue" @click="setPadColor('blue')"></button>
		<button class="red" @click="setPadColor('red')"></button>
		<button class="green" @click="setPadColor('green')"></button>
	</div>
	<div class="start posbuttons">
		<button @click="startGame()">START GAME</button>
	</div>
</div>

</template>

<style scoped>

p {
	position: relative;
	text-align: center;
	font-style: normal;
	font-weight: normal;
	font-size: 2.5vw;
	color: black;
}

button {
	border-radius: 10%;
	border: none;
}

.posbuttons {
	display: flex;
	justify-content: center;
}

.hoverAnim button {
	color: white;
	background-color: #808B96 ;
	transition-duration: 0.4s;
}

.hoverAnim button:hover {
	background-color: #A9DFBF;
}

button.diffActive, button.scoreActive {
	background-color: lightblue;
}

.level button, .score button {
	margin-left: 2%;
	margin-right: 2%;
	padding: 1%;
	font-size: 1.5vw;
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
	position: relative;
	top: 50px;

}

.start button {
	background-color: #A9DFBF;
	border-radius: 10px;
	padding: 14px 40px;
	font-size: 2vw;
}

</style>

<script lang="ts">
import { defineComponent } from 'vue'
import { Setup } from '../../types/game.interface'


export default defineComponent({

	name: 'OptionGame',
	emits: ["setupChosen"],

	data() {
		return {
			scoreActive: false as boolean,
			diffActive: false as boolean,
			opt: { level: 1, score: 5, paddleColor: 'white' } as Setup,
		}
	},

	methods: {
		setLevel(value: number) {
			if (value != undefined) {
				this.opt.level = value;
				this.diffActive = true;
			}
			console.log(`level: ${this.opt.level}`);
		},

		setScore(value: number) {
			if (value != undefined) {
				this.opt.score = value;
				this.scoreActive = true;
			}
			console.log(`score: ${this.opt.score}`);
		},

		setPadColor(value: string) {
			if (value != undefined)
				this.opt.paddleColor = value;
			console.log(`color ${this.opt.paddleColor}`);
		},

		startGame() {
			console.log('start game');
			this.$emit('setupChosen', this.opt as Setup);
		},

		resetOption() {
			this.opt.level = 1;
			this.opt.score = 1;
			this.opt.paddleColor = 'white';
		}
	},

	mounted() {
		console.log('option mounted');
	}
	
})
</script>

