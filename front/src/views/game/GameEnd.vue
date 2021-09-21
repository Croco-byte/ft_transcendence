<template>
<div class="init">

	<div class="profile">

		<div class="playerInfo">
			<div class="player1">
				<div class="playerAvatar">
					<h2 class="fontStyle">{{ this.endGameInfo.p1DbInfo.username}}</h2>
					<img :src="this.avatarPlayer1" width="200" height="200" alt="Player1Avatar">
				</div>
				<div class="gameStatus">
					<p class="loser fontStyle" v-if="this.endGameInfo.clientId === this.endGameInfo.room.player1Id">DISCONNECTED</p>
					<p class="winner fontStyle" v-else-if="this.endGameInfo.room.game.p1Score >= this.endGameInfo.room.game.p2Score
						|| this.endGameInfo.clientId === this.endGameInfo.room.player2Id">WINNER</p>
					<p class="loser fontStyle" v-else>LOSER</p>
				</div>
			</div>
		</div>

		<div class="playerBorder"></div>
		
		<div class="playerInfo">
			<div class="player2">
				<div class="playerAvatar">
					<h2 class="fontStyle">{{ this.endGameInfo.p2DbInfo.username}}</h2>
					<img :src="avatarPlayer2" width="200" height="200" alt="Player2Avatar">
				</div>
				<div class="gameStatus">
					<p class="loser fontStyle" v-if="this.endGameInfo.clientId === this.endGameInfo.room.player2Id">DISCONNECTED</p>
					<p class="winner fontStyle" v-else-if="this.endGameInfo.room.game.p2Score >= this.endGameInfo.room.game.p1Score
						|| this.endGameInfo.clientId === this.endGameInfo.room.player1Id">WINNER</p>
					<p class="loser fontStyle" v-else>LOSER</p>
				</div>
			</div>
		</div>
	</div>

	<div class="scoreGame">
		<p class="p1score">{{ this.endGameInfo.room.game.p1Score }}</p>
		<p> SCORE </p>
		<p class="p2score">{{ this.endGameInfo.room.game.p2Score }}</p>
	</div>
	
	<div class="play-again">
		<button id="button-play-again" @click="playingAgain()">PLAY AGAIN</button>
	</div>

</div>
</template>

<style scoped>

.fontStyle {
	font-size: 3vw;
	text-align: center;
	color: #4F4F4F;
}

.init {
	top: 10vh;
	position: absolute;
	width: 100vw;
	height: 80vh;
	/* background-color: crimson; */
}

.profile {
	/* background-color: blueviolet; */
	position: relative;
	display: flex;
	width: 100 vw;
}

.playerInfo {
	width: 50vw;
	height: 40vh;
	display: flex;
	justify-content: center;
	/* background-color: darkgreen; */
}

.playerBorder {
	border: 1px solid;
	border-color: #4F4F4F;
}

img {
	border-radius: 50%;
}

.winner {
	color: #28B463 ;
}

.loser {
	color: red;
}

.scoreGame {
	/* background-color: gold; */
	display: flex;
	justify-content: space-evenly;
	position: relative;
}

.scoreGame p {
	color: #4F4F4F;
	font-size: 4vw;
}

.play-again {
	width: 100vw;
	/* background-color: cyan; */
	position: relative;
	display: flex;
	justify-content: center;
}

.play-again button {
	padding: 1em;
	border: none;
	border-radius: 10%;
}

button {
	margin:0 0.3em 0.3em 0;
	border-radius:0.12em;
	box-sizing: border-box;
	text-decoration:none;
	border:1px solid #FFFFFF;
	font-weight:300;
	color:#FFFFFF;
	background-color: #4F4F4F;
	font-size: 2vw;
	text-align:center;
	transition: all 0.2s;
	animation:bouncy 3s infinite linear;
	position:relative;
}

@media all and (max-width:30em){
button {
	display:block;
	margin:0.4em auto;
}
}

@keyframes bouncy {
	0%{top:0em}
	40%{top:0em}
	43%{top:-0.9em}
	46%{top:0em}
	48%{top:-0.4em}
	50%{top:0em}
	100%{top:0em;}
}
</style>


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
		console.log('gameend mounted');

		if (this.isSpectating) {
			const buttonPlayingAgain = document.getElementById('button-play-again') as HTMLElement;
			buttonPlayingAgain.innerHTML = "FINISH SPECTATING AND START A MATCH";
		}
	}
})

</script>
