<template>
<div>
	<div class="player1">
		<div class="playerInfo">
			<p>{{ this.endGameInfo.p1DbInfo.username}}</p>
			<img :src="this.endGameInfo.p1DbInfo.avatar" alt="Player1Avatar">
		</div>
		<p v-if="this.endGameInfo.clientId === this.endGameInfo.room.player1Id">Has disconnected from the game.</p>
		<p v-else-if="this.endGameInfo.room.game.p1Score > this.endGameInfo.room.game.p2Score">Winner!</p>
		<p v-else>Loser!</p>
		<p>Score: {{ this.endGameInfo.room.game.p1Score }}</p>
	</div>
	<div class="player2">
		<div class="playerInfo">
			<p>{{ this.endGameInfo.p2DbInfo.username}}</p>
			<img :src="this.endGameInfo.p2DbInfo.avatar" alt="Player2Avatar">
		</div>
		<p v-if="this.endGameInfo.clientId === this.endGameInfo.room.player2Id">Has disconnected from the game.</p>
		<p v-else-if="this.endGameInfo.room.game.p2Score > this.endGameInfo.room.game.p1Score">Winner!</p>
		<p v-else>Loser!</p>
		<p>Score: {{ this.endGameInfo.room.game.p2Score }}</p>
	</div>
	<div class="play-again">
		<button @click="playingAgain()">PLAY AGAIN</button>
	</div>
</div>
</template>

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