<template>
<div id = "setup">
	<p>DIFFICULTY</p>
	<div class="level">
		<button class="left" @click="setLevel(1)">EASY</button>
		<button class="middle" @click="setLevel(2)">MEDIUM</button>
		<button class="right" @click="setLevel(3)">HARD</button>
	</div>
	<p>MAX POINT</p>
	<div class="score">
		<button @click="setScore(5)">5</button>
		<button @click="setScore(10)">10</button>
		<button @click="setScore(15000)">15000</button>
	</div>
	<p>PAD COLOR</p>
	<div class="color">
		<button @click="setPadColor('white')">white</button>
		<button @click="setPadColor('yellow')">yellow</button>
		<button @click="setPadColor('blue')">blue</button>
		<button @click="setPadColor('red')">red</button>
		<button @click="setPadColor('green')">green</button>
	</div>
	<div class="start">
		<button @click="startGame()">START GAME</button>
	</div>
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

#setup {
	margin-top: 15%;
	background-color: teal;
}


p {
	position: relative;
	text-align: center;
	font-family: Roboto;
	font-style: normal;
	font-weight: normal;
	font-size: 2.5vw;
	color: #FFFFFF;
}

.level {
	display: flex;
	justify-content: center;
}

.level button {
	margin-left: 2%;
	margin-right: 2%;
	padding: 2%;
	font-size: 1.5vw;
}

.class button {
	margin-left: 2%;
	margin-right: 2%;
	padding: 2%;
	font-size: 1.5vw;
}
/* 
button {
	padding: 3% 2% 3% 2%;
	padding-right: 3%;
	padding-top: 2%;
	padding-bottom: 2%;
} */

/* .left {
	margin-left: 30%;
}

.middle {
	margin-left: 5%;
	margin-right: 5%;
}

.right {
	margin-right: 30%;
} */

</style>