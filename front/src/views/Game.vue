<template>
	<div class="game">
		<GameOption v-if="RenderGameOption" @setupChosen="setupChosen($event)"/>
		<GameJoin v-if="RenderGameJoin" :isStarting="isStarting" :backColor="backColor"></GameJoin>
		<GamePlay v-if="RenderGamePlay" v-model:room="room" @gameId="updateGameId($event)" @playerEvent="updatePosition($event)"/>
	</div>
</template>


<script lang="ts">
import { defineComponent } from 'vue'
import { SocketDataInterface, SetupInterface } from '../types/game.interface'
import GameOption from './game/GameOption.vue'
import GamePlay from './game/GamePlay.vue'
import GameJoin from './game/GameJoin.vue'
import io from 'socket.io-client'
import authHeader from '../services/auth-header';
import { RoomInterface } from '../types/game.interface'

export default defineComponent({
	
	name: 'game',
	components: { GameOption, GamePlay, GameJoin },

	data() {
		return {
			socket: null as any,
			room: null as any,
			RenderGameJoin: false as boolean,
			RenderGamePlay: false as boolean,
			isStarting: false as boolean,
			RenderGameOption: true as boolean,
			backColor: 'orange' as string,
			gameID: 0 as number,
		}
	},


	methods: 
	{
		// ----------------------------------------
		// ----------- SOCKET LISTENERS -----------
		waitingForPlayer() : void
		{
			this.RenderGameOption = false;
			this.RenderGameJoin = true;
		},
		
		startingGame() : void
		{
			this.RenderGameOption = false;
			this.RenderGameJoin = true;
			this.isStarting = true;
		},

		actualizeGameScreen(room: RoomInterface) : void
		{
			this.room = room;
			if (this.RenderGameJoin) {
				this.RenderGameJoin = false
				this.RenderGamePlay = true;
			}
		},

		gameEnded(room: RoomInterface) : void
		{
			this.RenderGamePlay = false;
			cancelAnimationFrame(this.gameID);
			let msg = room.game.p1Score > room.game.p2Score ? 'player 1 has won' : 'player 2 has won';
			alert(msg);
		},

		opponentLeft(obj: SocketDataInterface) : void
		{
			this.RenderGamePlay = false;
			cancelAnimationFrame(this.gameID);
			let msg = obj.room.player1Id === obj.clientId ? 'player 1 has disconnected. You won !' :
											'player 2 has disconnected. You won !';
			alert(msg);
		},

		updateGameId(id: number)
		{
			this.gameID = id;
		},

		// ----------------------------------------
		// ----------- SOCKET EMETTERS ------------
		setupChosen(setup: SetupInterface)
		{
			this.socket.emit('setupChosen', setup);
		},

		updatePosition(playerPosY: number)
		{
			this.socket.emit('pongEvent', playerPosY);
		}
	},

	created() 
	{ 
		this.socket = io('http://localhost:3000/game', 
				{ query: { token: `${authHeader().Authorization.split(' ')[1]}` } });
		
		if (this.socket) {
			this.socket.on('waitingForPlayer', () => {
				this.waitingForPlayer();
			});

			this.socket.on('startingGame', () => {
				this.startingGame();
			});

			this.socket.on('actualizeGameScreen', (room: RoomInterface) => {
				this.actualizeGameScreen(room);
			});

			this.socket.on('gameEnded', (room: RoomInterface) => {
				console.log('gameEnded listener');
				this.gameEnded(room);
			});

			this.socket.on('opponentLeft', (obj: SocketDataInterface) => {
				console.log('opponentLeft listener');
				this.opponentLeft(obj);
			});
		}
	},

	// Permet de gerer quand quelqu'un quitte la vue. Peut etre rajouter un message de confirmation si in game 
	// un message pour etre sur si il leave.
	beforeRouteLeave (to, from , next)
	{
		this.socket.emit('disconnectClient');
		next();
	}
})
</script>