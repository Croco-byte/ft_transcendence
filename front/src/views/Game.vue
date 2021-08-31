<template>
    <div class="game">
        <GameJoin v-if="isWaiting" :backColor="backColor"></GameJoin>
        <GameOption v-if="optGame" @updateGameSetup="updateGameSetup($event)"/>
        <GamePlay v-if="isPlaying" v-model:room="room" @gameId="updateGameId($event)" @playerEvent="updatePosition($event)"/>
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
      room: null as any,
      isWaiting: true as boolean,
      isPlaying: false as boolean,
      optGame: false as boolean,
      backColor: 'orange' as string,
      socket: null as any,
      gameID: 0 as number,
    }
  },


  methods: {
  
    // ----------------------------------------
		// ----------- SOCKET LISTENERS -----------
		joinRoom(obj: SocketDataInterface) {
      this.backColor = "orange"
      console.log(`in joinRoom function`);
		},

		actualizeSetupScreen(room: RoomInterface) {
      this.isWaiting = false;
      this.optGame = true;
		},


		displaySetupChoose(room: RoomInterface) { room;
		},

    // startingGame(room: RoomInterface) : void
    // {
    //   if (!this.isSpec(room))
    //     this.pongEvent();
    // },

    actualizeGameScreen(room: RoomInterface) {
      this.room = room;
      this.optGame = false;
      this.isPlaying = true;
    },

    gameEnded(room: RoomInterface) : void
    {
      this.socket.emit('opponentLeft', room);

      let msg = room.game.p1Score > room.game.p2Score ? 'player 1 has won' : 'player 2 has won';
      alert(msg);
      cancelAnimationFrame(this.gameID);
      this.backColor = 'purple';
      this.isPlaying = false;
      this.isWaiting = true;
    },

    opponentLeft(obj: SocketDataInterface) {
      this.socket.emit('opponentLeft', obj.room);

      let msg = obj.room.player1Id === obj.clientId ? 'player 1 has disconnected. You won !' :
                      'player 2 has disconnected. You won !';
      alert(msg);
      cancelAnimationFrame(this.gameID);
      this.backColor = 'blue';
      this.isPlaying = false;
      this.isWaiting = true;
    },

    updateGameId(id: number) {
      this.gameID = id;
    },

    // ----------------------------------------
    // ----------- SOCKET EMETTERS ------------
    updateGameSetup(obj: SetupInterface) {
      this.socket.emit('updateGameSetup', obj);
    },

    updatePosition(obj: {x: number, y: number}) {
      this.socket.emit('pongEvent', obj);
    }
  },

	created() 
	{ 
		this.socket = io('http://localhost:3000/game', { query: { token: `${authHeader().Authorization.split(' ')[1]}` } });
		// this.socket = io('http://localhost:3000/game');
		
		if (this.socket) {

			// ecran waiting en attendant un autre joueur
			this.socket.on('joinRoom', (obj: SocketDataInterface) => {
				console.log('room joined');
				this.joinRoom(obj);
			});

			// ecran choisir option qunad les joueurs cliquent sur les options
			this.socket.on('actualizeSetupScreen', (room: RoomInterface) => {
				this.actualizeSetupScreen(room);
			});

			// // ecran qui montre pendant quelques secondes les options choisies
			// this.socket.on('displaySetupChoose', (room: RoomInterface) => {
			// 	this.displaySetupChoose(room);
			// });

			// //event qui permet de lancer la game apres que les options aient ete choisi
			// this.socket.on('startingGame', (room: RoomInterface) => {
			// 	this.startingGame(room);
			// });

			// ecran de rendu du jeu
			this.socket.on('actualizeGameScreen', (room: RoomInterface) => {
				this.actualizeGameScreen(room);
			});
			
			// ecran si un joueur deconnecte (peut etre aussi ecran de victoire)
			this.socket.on('gameEnded', (room: RoomInterface) => {
				this.gameEnded(room);
			});

			// ecran si un joueur deconnecte (peut etre aussi ecran de victoire)
			this.socket.on('opponentLeft', (obj: SocketDataInterface) => {
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