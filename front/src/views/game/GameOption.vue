<template>
	<div class="level">
		<p>BALL SPEEED</p>
		<button @click="setLevel(1)">EASY</button>
		<button @click="setLevel(2)">MEDIUM</button>
		<button @click="setLevel(3)">HARD</button>
	</div>
	<div class="score">
		<p>SCORE MAX</p>
		<button @click="setScore(5)">5</button>
		<button @click="setScore(10)">10</button>
		<button @click="setScore(15000)">15000</button>
	</div>
	<div class="color">
		<p>COLOR OF PAD</p>
		<button @click="setPadColor('white')">white</button>
		<button @click="setPadColor('yellow')">yellow</button>
		<button @click="setPadColor('blue')">blue</button>
		<button @click="setPadColor('red')">red</button>
		<button @click="setPadColor('green')">green</button>
	</div>
	<div class="start">
		<button @click="startGame()">START GAME</button>
	</div>

</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { Setup } from '../../types/game.interface'


export default defineComponent({

	name: 'OptionGame',
	emits: ["setupChosen"],

	data() {
		return {
			opt: { level: 1, score: 5, paddleColor: 'white' } as Setup,
		}
	},

	methods: {
		setLevel(value: number)
		{
			if (value != undefined)
				this.opt.level = value;
			console.log(`level: ${this.opt.level}`);
		},

		setScore(value: number)
		{
			if (value != undefined)
				this.opt.score = value;
			console.log(`score: ${this.opt.score}`);
		},

		setPadColor(value: string)
		{
			if (value != undefined)
				this.opt.paddleColor = value;
			console.log(`color ${this.opt.paddleColor}`);
		},

		startGame()
		{
			console.log('start game');
			this.$emit('setupChosen', this.opt as Setup);
		},

		resetOption()
		{
			this.opt.level = 1;
			this.opt.score = 1;
			this.opt.paddleColor = 'white';
		}
	},

	mounted()
	{

		console.log('option mounted');
	}
	
})
</script>

<style scoped>

 
h2 {
  text-align: center;
  font-style: Arial, Helvetica, sans-serif;
  font-size: 30px;
  color: black;
}

</style>