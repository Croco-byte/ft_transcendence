<template>
	<div id="game">
		<GameOption v-if="RenderGameOption" @setupChosen="setupChosen($event)"/>
		<GameJoin v-if="RenderGameJoin" :isPrivate="isPrivate" :isStarting="isStarting"></GameJoin>
		<GamePlay v-if="RenderGamePlay" :isSpectating="isSpectating" :room="room" @gameId="updateGameId($event)" @playerEvent="updatePosition($event)"/>
		<GameEnd v-if="RenderGameEnd" :isPrivate="isPrivate" :isSpectating="isSpectating" :endGameInfo="endGameInfo" @playPrivateAgain="playPrivateAgain($event)" @playAgain="playAgain($event)"></GameEnd>
	</div>
</template>


<script lang="ts">
import { defineComponent, watch } from 'vue'
import { Setup } from '../types/game.interface'
import GameOption from './game/GameOption.vue'
import GamePlay from './game/GamePlay.vue'
import GameJoin from './game/GameJoin.vue'
import GameEnd from './game/GameEnd.vue'
import io from 'socket.io-client'
import { Room, EndGameInfo } from '../types/game.interface'
import router from '../router/index';
import axios from '../axios-instance';
import authHeader from '../services/auth-header';
import { createToast } from 'mosha-vue-toastify';
import 'mosha-vue-toastify/dist/style.css';

export default defineComponent({
	
	name: 'game',
	components: { GameOption, GamePlay, GameJoin, GameEnd },

	data() {
		return {
			socket: null as any,
			room: null as any,
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
			console.log('launchSpectate listener event');
			this.RenderGameOption = false;
			this.isSpectating = true;
			this.isStarting = true;
		},

		async launchChallengeAgain(obj: any)
		{
			const newRoomId: string = await axios.post(this.serverURL + '/game/challenge/' + obj.userId, {},
				{headers: authHeader()});
				
			this.$store.state.websockets.connectionStatusSocket.emit('challengeSomebody', {
				userId: obj.userId,
				friendId: obj.friendId,
				newRoomId: newRoomId,
			});
			
			router.push(({name: 'Game', params: { 
				RenderGameOption: 'false',
				RenderGameJoin: 'true',
				status: 'private',
				random: this.GameService.generateRandomStr(),
			}}));
		},

		renderOption() : void
		{
			this.RenderGameOption = true;
		},

		waitInPrivateQueue() : void
		{
			this.socket.emit('privateGame');
			this.isPrivate = true;
			this.RenderGameOption = false;
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
			this.isStarting = false;
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
			console.log('gameEnded listener event');
			this.$store.state.websockets.connectionStatusSocket.emit('getOnline', {});
			cancelAnimationFrame(this.gameID);
			this.endGameInfo = endGameInfo;
			this.RenderGamePlay = false;
			this.RenderGameJoin = false;
			this.RenderGameEnd = true;
		},

		opponentLeft(endGameInfo: EndGameInfo) : void
		{
			console.log('opponentLeft listener event');
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
			this.isSpectating = false;
		},

		async playPrivateAgain(obj: any) : Promise<void>
		{	
			this.RenderGameEnd = false;
			this.isStarting = false;
			this.isSpectating = false;

			await this.launchChallengeAgain(obj);

			this.socket.emit('privateGame');
			this.isPrivate = true;
		}
	},

	created() 
	{
		if (this.$route.params.RenderGamePlay === 'true'){
			this.isSpectating = true;
			this.isStarting = true;
		}

		if (this.$route.params.RenderGameOption === 'false')
			this.RenderGameOption = false;
		
		this.socket = io('http://localhost:3000/game', 
				{ query: { token: `${authHeader().Authorization.split(' ')[1]}` } });

		if (this.socket) {
			this.socket.on('unauthorized', (data: {message: string }) => {
				this.$store.commit('disconnectUser', { message: data.message });
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
		console.log(this.$route.params);
		console.log(this.$route.params.caca);
		console.log(this.$route.params.RenderGameOption);
		console.log(this.$route.params.RenderGameJoin);
		console.log('beforerouteupdate');
		console.log(to);
		// this.socket.emit('renderFirstScreen');
		next();
	}
})
</script>

<style>

.router_view
{
	background-color: #E6EFF2;
}

</style>
