<template>
<div>
	<div class="player1">
		<div class="playerInfo">
			<p>{{ this.endGameInfo.p1DbInfo.username}}</p>
			<img :src="this.avatarPlayer1" width="200" height="200" alt="Player1Avatar">
		</div>
		<p v-if="this.endGameInfo.clientId === this.endGameInfo.room.player1Id">Has disconnected from the game.</p>
		<p v-else-if="this.endGameInfo.room.game.p1Score >= this.endGameInfo.room.game.p2Score">Winner!</p>
		<p v-else>Loser!</p>
		<p>Score: {{ this.endGameInfo.room.game.p1Score }}</p>
	</div>
	<div class="player2">
		<div class="playerInfo">
			<p>{{ this.endGameInfo.p2DbInfo.username}}</p>
			<img :src="avatarPlayer2" width="200" height="200" alt="Player2Avatar">
		</div>
		<p v-if="this.endGameInfo.clientId === this.endGameInfo.room.player2Id">Has disconnected from the game.</p>
		<p v-else-if="this.endGameInfo.room.game.p2Score >= this.endGameInfo.room.game.p1Score">Winner!</p>
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
import { User } from '../../types/user.interface'
import UserService from '../../services/user.service'
import authService from '../../services/auth.service'

export default defineComponent ({
	
	name: 'GameEnd',
	emits: ["playAgain"],
	
	props: {
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
		this.loadAvatar(this.endGameInfo.room.user1DbId.toString());
		this.loadAvatar(this.endGameInfo.room.user2DbId.toString());
	}
})

</script>