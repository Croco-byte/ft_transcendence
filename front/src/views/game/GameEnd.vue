<template>
<div class="init">

	<div class="profile">

		<div class="playerInfo">
			<div class="player1">
				<div class="playerAvatar">
					<h2>{{ this.endGameInfo.p1DbInfo.username}}</h2>
					<img :src="this.endGameInfo.p1DbInfo.avatar" alt="Player1Avatar">
				</div>
				<div class="gameStatus">
					<p v-if="this.endGameInfo.clientId === this.endGameInfo.room.player1Id">Has disconnected from the game.</p>
					<p v-else-if="this.endGameInfo.room.game.p1Score > this.endGameInfo.room.game.p2Score">Winner!</p>
					<p v-else>Loser!</p>
					<p>Score: {{ this.endGameInfo.room.game.p1Score }}</p>
				</div>
			</div>
		</div>

		<div class="playerBorder"></div>
		
		<div class="playerInfo">
			<div class="player2">
				<div class="playerAvatar">
					<h2>{{ this.endGameInfo.p2DbInfo.username}}</h2>
					<img :src="this.endGameInfo.p2DbInfo.avatar" alt="Player2Avatar">
				</div>
				<div class="gameStatus">
					<p v-if="this.endGameInfo.clientId === this.endGameInfo.room.player2Id">Has disconnected from the game.</p>
					<p v-else-if="this.endGameInfo.room.game.p2Score > this.endGameInfo.room.game.p1Score">Winner!</p>
					<p v-else>Loser!</p>
					<p>Score: {{ this.endGameInfo.room.game.p2Score }}</p>
				</div>
			</div>
		</div>

	</div>
	
	<div class="play-again">
		<button @click="playingAgain()">PLAY AGAIN</button>
	</div>

</div>
</template>

<style scoped>

.init {
	position: absolute;
	width: 100vw;
	height: 80vh;
	background-color: crimson;
}

.profile {
	background-color: blueviolet;
	position: relative;
	display: flex;
	width: 100 vw;
}

.playerInfo {
	width: 50vw;
	height: 80vh;
	display: flex;
	justify-content: center;
	background-color: darkgreen;
}

.playerBorder {
	border: solid;
	border-style: 0 1em 0 0;
}
.player1 {
	background-color: cadetblue;
}

.player2 {
	background-color: coral;
}

.playerAvatar p {
	font-style: ;

}


.play-again {
	width: 100vw;
	background-color: cyan;
	position: relative;
	display: flex;
	justify-content: center;
}

.play-again button {
	padding: 1em;
}
</style>


<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { EndGameInfo } from '../../types/game.interface'

export default defineComponent ({
	
	name: 'GameEnd',
	emits: ["playAgain"],
	
	props: {
		endGameInfo: {
			required: true,
			type: Object as PropType<EndGameInfo>
		},
	},

	methods: {
		playingAgain() : void
		{
			console.log('playing again');
			this.$emit('playAgain');
		}
	},

	mounted()
	{
		// this.$emit('playAgain', true);
	}
})

</script>
