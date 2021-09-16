<template>
	<div id="game">
		<GameOption v-if="RenderGameOption" @setupChosen="setupChosen($event)"/>
		<GameJoin v-if="RenderGameJoin" :isStarting="isStarting" :backColor="backColor" ></GameJoin>
		<GamePlay v-if="RenderGamePlay" :isSpectating="isSpectating" v-model:room="room" @gameId="updateGameId($event)" @playerEvent="updatePosition($event)"/>
		<GameEnd v-if="RenderGameEnd" :isSpectating="isSpectating" :endGameInfo="endGameInfo" @playAgain="playAgain($event)"></GameEnd>
	</div>
</template>


<script lang="ts">
import { defineComponent } from 'vue'
import { Setup } from '../types/game.interface'
import GameOption from './game/GameOption.vue'
import GamePlay from './game/GamePlay.vue'
import GameJoin from './game/GameJoin.vue'
import GameEnd from './game/GameEnd.vue'
import io from 'socket.io-client'
import authHeader from '../services/auth-header';
import { Room, EndGameInfo } from '../types/game.interface'

export default defineComponent({
	
	name: 'game',
	components: { GameOption, GamePlay, GameJoin, GameEnd },

	data() {
		return {
			socket: null as any,
			room: null as any,
			endGameInfo: null as any,
			RenderGameOption: true as boolean,
			RenderGameJoin: false as boolean,
			RenderGamePlay: false as boolean,
			RenderGameEnd: false as boolean,
			isStarting: false as boolean,
			isSpectating: false as boolean,
			backColor: 'orange' as string,
			gameID: 0 as number,
		}
	},


	methods: 
	{
		// ----------------------------------------
		// ----------- SOCKET LISTENERS -----------

		launchSpectate() : void
		{
			console.log('launchSpectate listener event');
			this.$store.state.websockets.connectionStatusSocket.emit('getSpectating', {});
			this.RenderGameOption = false;
			this.RenderGamePlay = true;
			this.isSpectating = true;
		},
		
		waitingForPlayer() : void
		{
			console.log('waitingForPlayer listener event');
			this.$store.state.websockets.connectionStatusSocket.emit('getInQueue', {});
			this.RenderGameOption = false;
			this.RenderGameJoin = true;
		},
		
		resetMatchmaking() : void
		{
			console.log('resetMatchmaking listener event');
			this.RenderGameOption = true;
			this.RenderGameJoin = false;
			this.$store.state.websockets.connectionStatusSocket.emit('getOnline', {});
		},

		startingGame(inGame: boolean) : void
		{
			console.log('startingGame listener event');
			if (!inGame) {
				this.RenderGameOption = false;
				this.RenderGameJoin = true;
				this.isStarting = true;
			}
			
			else
				this.$store.state.websockets.connectionStatusSocket.emit('getInGame', {});
		},

		actualizeGameScreen(room: Room) : void
		{
			
			this.room = room;
			if (this.RenderGameJoin) {
				this.RenderGameJoin = false
				this.RenderGamePlay = true;
			}
		},

		gameEnded(endGameInfo: EndGameInfo) : void
		{
			console.log('gameEnded listener event');
			this.$store.state.websockets.connectionStatusSocket.emit('getOnline', {});
			this.endGameInfo = endGameInfo;
			cancelAnimationFrame(this.gameID);
			this.RenderGamePlay = false;
			this.RenderGameEnd = true;
		},

		opponentLeft(endGameInfo: EndGameInfo) : void
		{
			console.log('opponentLeft listener event');
			this.$store.state.websockets.connectionStatusSocket.emit('getOnline', {});
			this.endGameInfo = endGameInfo;
			cancelAnimationFrame(this.gameID);
			this.RenderGamePlay = false;
			this.isStarting = false;
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
			console.log(setup);

			this.socket.emit('setupChosen', setup);
		},

		updatePosition(playerPosY: number)
		{
			this.socket.emit('pongEvent', playerPosY);
		},

		playAgain() : void
		{
			this.RenderGameEnd = false;
			this.RenderGameOption = true;
			this.isStarting = false;
		},
	},

	created() 
	{
		this.socket = io('http://localhost:3000/game', 
				{ query: { token: `${authHeader().Authorization.split(' ')[1]}` } });

		if (this.socket) {
			this.socket.on('unauthorized', () => {
				this.$store.commit('disconnectUser', { message: "[DEBUG from websockets] Session expired" });
			})

			this.socket.on('waitingForPlayer', () => {
				this.waitingForPlayer();
			});

			this.socket.on('resetMatchmaking', () => {
				this.resetMatchmaking();
			});

			this.socket.on('startingGame', (inGame: boolean) => {
				this.startingGame(inGame);
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
	}
})
</script>

<style>

.router_view
{
	background-color: #4F4F4F;
}

.game
{
	overflow-y: auto;
}

</style>
