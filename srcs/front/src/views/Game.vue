<template>
	<div id="game">
		<GameOption v-if="RenderGameOption" @setupChosen="setupChosen($event)"/>
		<GameJoin v-if="RenderGameJoin" :isPrivate="isPrivate" :isStarting="isStarting"></GameJoin>
		<GamePlay v-if="RenderGamePlay" :isSpectating="isSpectating" :room="room" @gameId="updateGameId($event)" @playerEvent="updatePosition($event)"/>
		<GameEnd v-if="RenderGameEnd" :isPrivate="isPrivate" :isSpectating="isSpectating" :endGameInfo="endGameInfo" @playPrivateAgain="playPrivateAgain($event)" @playAgain="playAgain($event)"></GameEnd>
	</div>
</template>


<script lang="ts">
import { defineComponent } from 'vue'
import { Setup } from '../types/game.interface'
import GameOption from '../components/game/GameOption.vue'
import GamePlay from '../components/game/GamePlay.vue'
import GameJoin from '../components/game/GameJoin.vue'
import GameEnd from '../components/game/GameEnd.vue'
import io from 'socket.io-client'
import { Room, EndGameInfo } from '../types/game.interface'
import authHeader from '../services/auth-header';
import { createToast } from 'mosha-vue-toastify';
import 'mosha-vue-toastify/dist/style.css';
import UserService from '../services/user.service'

export default defineComponent({
	
	name: 'game',
	components: { GameOption, GamePlay, GameJoin, GameEnd },

	data() {
		return {
			// eslint-disable-next-line
			socket: null as any,
			// eslint-disable-next-line
			room: null as any,
			// eslint-disable-next-line
			endGameInfo: null as any,
			RenderGameOption: true,
			RenderGameJoin: false as boolean,
			RenderGamePlay: false,
			RenderGameEnd: false as boolean,
			isPrivate: false as boolean,
			isStarting: false as boolean,
			isSpectating: false as boolean,
			gameID: 0 as number,
			serverURL: "http://" + window.location.hostname + ":3000" as string,
		}
	},


	methods: 
	{
		// ----------------------------------------
		// ----------- SOCKET LISTENERS -----------

		launchSpectate() : void
		{
			this.resetData();
			this.isSpectating = true;
			this.isStarting = true;
		},

		renderOption() : void
		{
			this.RenderGameOption = true;
		},

		waitInPrivateQueue() : void
		{
			this.socket.emit('privateGame');
			this.$store.state.websockets.connectionStatusSocket.emit('getInQueue', {});
			this.resetData();
			this.isPrivate = true;
			this.RenderGameJoin = true;

			createToast({
				title: '',
				description: 'Default options. You can\'t choose options in private game.',
			},
			{
				position: 'top-right',
				type: 'warning',
				transition: 'slide'
			});
		},

		waitingForPlayer() : void
		{
			this.$store.state.websockets.connectionStatusSocket.emit('getInQueue', {});
			this.resetData();
			this.RenderGameJoin = true;
		},
		
		resetMatchmaking() : void
		{
			createToast({
				title: 'Error',
				description: 'Opponent left the queue',
			},
			{
				position: 'top-right',
				type: 'danger',
				transition: 'slide'
			});

			this.resetData();
			this.RenderGameOption = true;
			this.$store.state.websockets.connectionStatusSocket.emit('getOnline', {});
		},

		startingGame(inGame: boolean) : void
		{
			if (!inGame) {
				this.RenderGameOption = false;
				this.RenderGameJoin = true;
				this.isStarting = true;
			}
			
			else {
				this.socket.emit('launchGame');
				this.$store.state.websockets.connectionStatusSocket.emit('getInGame', {});
			}
		},

		actualizeGameScreen(room: Room) : void
		{
			
			this.room = room;
			if (this.RenderGameJoin) {
				this.RenderGameJoin = false
				this.RenderGamePlay = true;
			}

			if (this.isStarting && this.isSpectating) {
				this.RenderGamePlay = true;
			}
		},

		gameEnded(endGameInfo: EndGameInfo) : void
		{
			this.$store.state.websockets.connectionStatusSocket.emit('getOnline', {});
			cancelAnimationFrame(this.gameID);
			this.endGameInfo = endGameInfo;
			this.RenderGamePlay = false;
			this.RenderGameJoin = false;
			this.RenderGameEnd = true;
		},

		opponentLeft(endGameInfo: EndGameInfo) : void
		{
			this.$store.state.websockets.connectionStatusSocket.emit('getOnline', {});
			cancelAnimationFrame(this.gameID);
			this.endGameInfo = endGameInfo;
			this.RenderGamePlay = false;
			this.RenderGameJoin = false;
			this.RenderGameEnd = true;
		},

		updateGameId(id: number)
		{
			this.gameID = id;
		},

		// ----------------------------------------
		// ----------- SOCKET EMETTERS ------------
		setupChosen(setup: Setup)
		{

			this.socket.emit('setupChosen', setup);
		},

		updatePosition(playerPosY: number)
		{
			this.socket.emit('pongEvent', playerPosY);
		},

		playAgain() : void
		{
			this.resetData();
			this.RenderGameOption = true;
		},

		// async playPrivateAgain(obj: any) : Promise<void>
		// {	
		// 	this.resetData();
			
		// 	await this.launchChallengeAgain(obj);
		// 	this.isPrivate = true;
		// 	this.RenderGameJoin = true;
		// },

		resetData() : void
		{
			this.RenderGameOption = false;
			this.RenderGameJoin  = false;
			this.RenderGamePlay = false;
			this.RenderGameEnd = false;
			this.isPrivate = false;
			this.isStarting = false;
			this.isSpectating = false;
		},
	},

	created() 
	{
		if (this.$route.params.RenderGamePlay === 'true'){
			this.isSpectating = true;
			this.isStarting = true;
			console.log("IS STARTING true");
		}

		if (this.$route.params.RenderGameOption === 'false')
			this.RenderGameOption = false;
		
		this.socket = io('http://localhost:3000/game', 
				{ query: { token: `${authHeader().Authorization.split(' ')[1]}` } });

		if (this.socket) {
			this.socket.on('unauthorized', (data: {message: string }) => {
				this.socket.disconnect();
				this.$store.commit('disconnectUser', { message: data.message });
			});

			var ref = this;
			this.socket.on('cantStartGame', async function(data: { userId: number }) {
				const result = await UserService.getCurrUserId();
				if (result.data.id === data.userId) {
					ref.socket.disconnect();
					ref.$store.commit('disconnectUser', { message: "Something went wrong while trying to start your game. Please log in and try again."});
				}
			})

			this.socket.on('renderOption', () => {
				this.renderOption();
			});

			this.socket.on('waitInPrivateQueue', () => {
				this.waitInPrivateQueue();
			});

			this.socket.on('waitingForPlayer', () => {
				this.waitingForPlayer();
			});

			this.socket.on('resetMatchmaking', () => {
				this.resetMatchmaking();
			});

			this.socket.on('startingGame', (inGame: boolean) => {
				this.startingGame(inGame);
			});

			this.socket.on('launchSpectate', () => {
				this.launchSpectate();
			});

			this.socket.on('actualizeGameScreen', (room: Room) => {
				this.actualizeGameScreen(room);
			});

			this.socket.on('gameEnded', (endGameInfo: EndGameInfo) => {
				this.gameEnded(endGameInfo);
			});

			this.socket.on('opponentLeft', (endGameInfo: EndGameInfo) => {
				this.opponentLeft(endGameInfo);
			});

			// this.socket.emit('renderFirstScreen');
		}
	},

	// Permet de gerer quand quelqu'un quitte la vue. Peut etre rajouter un message de confirmation si in game 
	// un message pour etre sur si il leave.
	beforeRouteLeave (to, from , next)
	{
		this.$store.state.websockets.connectionStatusSocket.emit('getOnline', {});
		const wasInGame = this.RenderGamePlay ? true : false;
		this.socket.emit('disconnectClient', wasInGame);
		
		next();
	},

	beforeRouteUpdate (to, from , next)
	{

		if (to.params.status === 'private') {
			this.socket.emit('waitInPrivateQueue');
		}

		if (to.params.status === 'privateCancelled' && !this.RenderGamePlay) {
			this.$store.state.websockets.connectionStatusSocket.emit('getOnline', {});

			this.resetData();
			this.RenderGameOption = true;
			this.socket.emit('privateCancelled');
		}

		next();
	}
})
</script>

<style>

.router_view
{
	background-color: #E6EFF2;
}

#game
{
	min-height: 100%;
}

</style>
