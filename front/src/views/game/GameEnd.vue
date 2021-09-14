<template>
<div>
	<div class="player1">
		<div class="playerInfo">
			<p>{{ this.endGameInfo.p1DbInfo.username}}</p>
			<img :src="this.avatarPlayer1" width="200" height="200" alt="Player1Avatar">
		</div>
		<p v-if="this.endGameInfo.clientId === this.endGameInfo.room.player1Id">Has disconnected from the game.</p>
		<p v-else-if="this.endGameInfo.room.game.p1Score >= this.endGameInfo.room.game.p2Score
			|| this.endGameInfo.clientId === this.endGameInfo.room.player2Id">Winner!</p>
		<p v-else>Loser!</p>
		<p>Score: {{ this.endGameInfo.room.game.p1Score }}</p>
	</div>
	<div class="player2">
		<div class="playerInfo">
			<p>{{ this.endGameInfo.p2DbInfo.username}}</p>
			<img :src="avatarPlayer2" width="200" height="200" alt="Player2Avatar">
		</div>
		<p v-if="this.endGameInfo.clientId === this.endGameInfo.room.player2Id">Has disconnected from the game.</p>
		<p v-else-if="this.endGameInfo.room.game.p2Score >= this.endGameInfo.room.game.p1Score
			|| this.endGameInfo.clientId === this.endGameInfo.room.player1Id">Winner!</p>
		<p v-else>Loser!</p>
		<p>Score: {{ this.endGameInfo.room.game.p2Score }}</p>
	</div>
	<div class="play-again">
		<button id="button-play-again" @click="playingAgain()">PLAY AGAIN</button>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { EndGameInfo } from '../../types/game.interface'
import { User } from '../../types/user.interface'
import UserService from '../../services/user.service'
import authService from '../../services/auth.service'

export default defineComponent ({
	
	name: 'GameEnd',
	emits: ["playAgain"],
	
	props: {
		isSpectating: {
			required: true,
			type: Boolean,
		},
		endGameInfo: {
			required: true,
			type: Object as PropType<EndGameInfo>
		},
	},

	data() {
		return {
			avatarPlayer1: '' as string,
			avatarPlayer2: '' as string,
		}
	},

	methods: {
		playingAgain() : void
		{
			this.$emit('playAgain');
		},

		async loadAvatar(playerDbId: string) : Promise<void>
		{
			const user: any = await UserService.getUserInfo(playerDbId);
			const avatar: any = await UserService.getUserAvatar(user.data.avatar);
			const urlCreator = window.URL || window.webkitURL;

			if (playerDbId === this.endGameInfo.room.user1DbId.toString())
				this.avatarPlayer1 = urlCreator.createObjectURL(avatar.data);
			else
				this.avatarPlayer2 = urlCreator.createObjectURL(avatar.data);
		}
	},

	async created() {
		console.log(`player1 ID : ${this.endGameInfo.room.player1Id}`);
		console.log(`player2 ID : ${this.endGameInfo.room.player2Id}`);
		console.log(`player1 DBID : ${this.endGameInfo.room.user1DbId.toString()}`);
		console.log(`player2 DBID : ${this.endGameInfo.room.user2DbId.toString()}`);
		console.log(`player1 username : ${this.endGameInfo.p1DbInfo.username}`);
		console.log(`player2 username : ${this.endGameInfo.p2DbInfo.username}`);

		this.loadAvatar(this.endGameInfo.room.user1DbId.toString());
		this.loadAvatar(this.endGameInfo.room.user2DbId.toString());
	},

	mounted()
	{
		if (this.isSpectating) {
			const buttonPlayingAgain = document.getElementById('button-play-again') as HTMLElement;
			buttonPlayingAgain.innerHTML = "FINISH SPECTATING AND START A MATCH";
		}
	}
})

</script>