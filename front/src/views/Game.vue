<template>
    <div class="game">
        <GameJoin v-if="isWaiting" :backColor="backColor"></GameJoin>
        <GameOption v-if="optGame" @updateGameSetup="updateGameSetup($event)" :dataInterface="dataInterface"/>
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
import socket from '../services/gamesocket.service'

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
      dataInterface: null as any
    }
  },


  methods: {
  
    // ----------------------------------------
		// ----------- SOCKET LISTENERS -----------
		joinRoom(obj: SocketDataInterface) {
      this.backColor = "orange"
      console.log(`in joinRoom function`);
		},

		actualizeSetupScreen(obj: SocketDataInterface) {
      this.isWaiting = false;
      this.optGame = true;
		},


		displaySetupChoose(obj: SocketDataInterface) {
      this.dataInterface = obj as SocketDataInterface;
		},

    // startingGame(obj: SocketDataInterface) : void
    // {
    //   if (!this.isSpec(obj))
    //     this.pongEvent();
    // },

    actualizeGameScreen(obj: SocketDataInterface) {
      this.room = obj.room;
      this.optGame = false;
      this.isPlaying = true;
    },

    gameEnded(obj: SocketDataInterface) : void
    {
      this.socket.emit('opponentLeft', obj.room);

      let msg = obj.room.game.p1Score > obj.room.game.p2Score ? 'player 1 has won' : 'player 2 has won';
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
		// this.socket = io('http://localhost:3000/game');
    this.socket = socket;
		
		if (this.socket) {

			// ecran waiting en attendant un autre joueur
			this.socket.on('joinRoom', (obj: SocketDataInterface) => {
				console.log('room joined');
				this.joinRoom(obj);
			});

			// ecran choisir option qunad les joueurs cliquent sur les options
			this.socket.on('actualizeSetupScreen', (obj: SocketDataInterface) => {
				this.actualizeSetupScreen(obj);
			});

			// ecran qui montre pendant quelques secondes les options choisies
			// this.socket.on('displaySetupChoose', (obj: SocketDataInterface) => {
			// 	this.displaySetupChoose(obj);
			// });

			// //event qui permet de lancer la game apres que les options aient ete choisi
			// this.socket.on('startingGame', (obj: SocketDataInterface) => {
			// 	this.startingGame(obj);
			// });

			// ecran de rendu du jeu
			// this.socket.on('actualizeGameScreen', (obj: SocketDataInterface) => {
      //   this.actualizeGameScreen(obj);
			// });
			
			// // ecran si un joueur deconnecte (peut etre aussi ecran de victoire)
			// this.socket.on('gameEnded', (obj: SocketDataInterface) => {
			// 	this.gameEnded(obj);
			// });

			// // ecran si un joueur deconnecte (peut etre aussi ecran de victoire)
			// this.socket.on('opponentLeft', (obj: SocketDataInterface) => {
			// 	this.opponentLeft(obj);
			// });
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