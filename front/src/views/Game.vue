<template>
    <div class="game">
        <canvas ref="canvas" id="canvas" width="600" height="400"></canvas>
        <GameOption v-if="optGame" :ctx="ctx" :canvas="canvas" v-on:optionChosen="updateGameSetup"/>
        <GamePlay v-if="isPlaying" v-model:room="room"/>
    </div>
</template>


<script lang="ts">
import { defineComponent, watch, ref } from 'vue'
import { SocketDataInterface, RoomInterface, GameInterface, BallInterface, PlayerInterface, PaddleInterface, SetupInterface } from '../types/game.interface'
import GameOption from './game/GameOption.vue'
import GamePlay from './game/GamePlay.vue'
import io from 'socket.io-client'

export default defineComponent({
  
  name: 'game',
  components: { GameOption, GamePlay },


  data() {
    return {
      room: null as any,
      isWaiting: false as boolean,
      isPlaying: false as boolean,
      optGame: false as boolean,
      optchosen: -1 as number,
      ctx: null as CanvasRenderingContext2D | null,
      canvas: null as HTMLCanvasElement | null,
      socket: null as any,
      windowSize: {
        width : window.innerHeight, 
        height: window.innerWidth
      }
    }
  },


  methods: {
  
    // ----------------------------------------
		// ----------- SOCKET LISTENERS -----------
		joinRoom(room: RoomInterface) {
      this.isWaiting = true;
      if (this.ctx && this.canvas) {
        console.log(`in joinRoom function`);
        // Need to add waiting animation
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = "orange";
        this.ctx.fillRect(0, 0, this.canvas.width , this.canvas.height);
      }
		},

		actualizeSetupScreen(room: RoomInterface) {
      this.optGame = true;
		},


		displaySetupChoose(room: RoomInterface) {
			if (this.ctx && this.canvas) {
        console.log(room.game.p1Left.setup);
        console.log(room.game.p2Right.setup);
			}
		},

	startingGame(obj: SocketDataInterface) : void
  {
    if (!this.isSpec(obj))
      this.pongEvent();
  },

  actualizeGameScreen(obj: SocketDataInterface) {
    if (this.ctx && this.canvas)
      this.gameID = requestAnimationFrame(()=>this.drawGame(obj.room));
  },

  gameEnded(obj: SocketDataInterface) : void
  {
    if (this.ctx && this.canvas)
    {
      this.socket.emit('opponentLeft', obj.room);

      let msg = obj.room.game.p1Score > obj.room.game.p2Score ? 'player 1 has won' : 'player 2 has won';
      alert(msg);

      cancelAnimationFrame(this.gameID);
      this.gameID = requestAnimationFrame(() => 
      {
        if (this.ctx && this.canvas)
        {
          this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
          this.ctx.fillStyle = "purple";
          this.ctx.fillRect(0, 0, this.canvas.width , this.canvas.height);
        }
      });
    }
  },

  opponentLeft(obj: SocketDataInterface) 
  {
    if (this.ctx && this.canvas)
    {
      this.socket.emit('opponentLeft', obj.room);

      let msg = obj.room.player1Id === obj.clientId ? 'player 1 has disconnected. You won !' :
                      'player 2 has disconnected. You won !';
      alert(msg);

      cancelAnimationFrame(this.gameID);
      this.gameID = requestAnimationFrame(() => 
      {
        if (this.ctx && this.canvas)
        {
          this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
          this.ctx.fillStyle = "blue";
          this.ctx.fillRect(0, 0, this.canvas.width , this.canvas.height);
        }
      });
    }
  },

		// ----------------------------------------
		// ----------- SOCKET EMETTERS ------------
		updateGameSetup(value:  number) {
			this.socket.emit('updateGameSetup', {
						level: value,
						score: 5,
						paddleColor: 'white',
      });
		}

  },

  mounted() {
    this.isPlaying = false as boolean;
    this.optGame = false as boolean;
    this.isWaiting = false as boolean;
    this.canvas = document.getElementById('canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;
  },
				
  pongEvent()
  {
    window.addEventListener('pointermove', (event) => 
    {
      if (this.ctx && this.canvas && event.x < this.canvas.width && event.y < this.canvas.height)
        this.socket.emit('pongEvent', { x: event.x, y: event.y });
    });
  },

	created() 
	{ 
		this.socket = io('http://localhost:3000/game');
		if (this.socket) {

			// ecran waiting en attendant un autre joueur
			this.socket.on('joinRoom', (obj: SocketDataInterface) => {
				this.joinRoom(obj);
			});

			// ecran choisir option qunad les joueurs cliquent sur les options
			this.socket.on('actualizeSetupScreen', (obj: SocketDataInterface) => {
				this.actualizeSetupScreen(obj);
			});

			this.socket.on('displaySetupChoose', (obj: SocketDataInterface) => {
				this.displaySetupChoose(obj);
			})

			this.socket.on('startingGame', (obj: SocketDataInterface) => {
				this.startingGame(obj);
			});

			// ecran de rendu du jeu
			this.socket.on('actualizeGameScreen', (obj: SocketDataInterface) => {
				this.actualizeGameScreen(obj);
			});
			
			// ecran si un joueur deconnecte (peut etre aussi ecran de victoire)
			this.socket.on('gameEnded', (obj: SocketDataInterface) => {
				this.gameEnded(obj);
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
