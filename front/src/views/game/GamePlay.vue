<template>
  <div class="fullWindow" @mousemove="updatePosition">
    <canvas id="canvas"></canvas> 
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, watch } from 'vue'
import { RoomInterface, BallInterface, PlayerInterface, PaddleInterface, GameInterface } from '../../types/game.interface'

export default defineComponent({

  props: {
    room: {
      required: true,
      type: Object as PropType<RoomInterface>
    }
  },
  data() {
    return {
      mousePos: {
        x: -1 as number,
        y: -1 as number
      },
      ctx: null as CanvasRenderingContext2D | null,
      canvas: null as HTMLCanvasElement | null,
      game: null as GameInterface | null
    }
  },

  methods: {
    // updateMouseCoordinate(event: Object) {
    //   console.log(event);
    // },
    // ----------------------------------------
		// ---------------- DRAWINGS --------------
    drawPaddle(player1: PlayerInterface, player2: PlayerInterface,paddle: PaddleInterface) {
      if (this.ctx && this.canvas) {
        let nPaddle = {
          height: paddle.height / this.room.game.height * this.canvas.height,
          width: paddle.width / this.room.game.width * this.canvas.width,
          border: paddle.border / this.room.game.height * this.canvas.height
        }
        let p1 = {
          x: player1.x / this.room.game.width * this.canvas.width,
          y: player1.y / this.room.game.height * this.canvas.height - nPaddle.height / 2
        };
        let p2 = {
          x: player2.x / this.room.game.width * this.canvas.width,
          y: player2.y / this.room.game.height * this.canvas.height - nPaddle.height / 2
        }
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(p1.x, p1.y, nPaddle.width, nPaddle.height);
        this.ctx.fillRect(p2.x, p2.y, nPaddle.width, nPaddle.height);
      }
		},
  

		drawBall(ball: BallInterface) {
      if (this.ctx && this.canvas) {
        let nBall = {
          radius: ball.radius / this.room.game.width * this.canvas.width,
          x: ball.x / this.room.game.width * this.canvas.width,
          y: ball.y / this.room.game.height * this.canvas.height,
        }
        this.ctx.beginPath();
        this.ctx.arc(nBall.x, nBall.y, nBall.radius, 0, 2 * Math.PI, false);
        this.ctx.fillStyle = 'white';
        this.ctx.fill();
        this.ctx.stroke();
      }
    },

		drawScore(player1Score, player2Score) {
      if (this.ctx && this.canvas) {
				this.ctx.font = '48px serif';
				this.ctx.fillStyle = 'white';
				this.ctx.fillText(player1Score.toString(), this.canvas.width / 4, 48);
				this.ctx.fillText(player2Score.toString(), this.canvas.width * 3 / 4, 48);
      }
		},

		drawSeparator() {
      if (this.ctx && this.canvas) {
        let w = this.canvas.width / 200;
        let h = this.canvas.height / 58;
            
        this.ctx.fillStyle = "white";
        for (let i = 0; i < this.canvas.height; i++) {
          if (!(i % Math.floor(this.canvas.height / 40)))
            this.ctx.fillRect(this.canvas.width / 2, i, w, h);
        }
      }
		},

		drawGame(room: RoomInterface) {
      if (this.ctx && this.canvas) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = "black";
        this.ctx.fillRect(0, 0, this.canvas.width , this.canvas.height);

        this.drawPaddle(room.game.p1Left, room.game.p2Right, room.game.paddle);
        // this.drawPaddle(room.game.p2Right, room.game.paddle);
        this.drawSeparator();
        this.drawBall(room.game.ball);
        this.drawScore(room.game.p1Score, room.game.p2Score);
      }
		},


    // ----------------------------------------
		// ----------- SOCKET EMETTERS ------------
		pongEvent() {
      window.addEventListener('pointermove', (event)=> {
        console.log("moove")
        event;
        // if (this.ctx && this.canvas)
        //   if (event.x < this.canvas.width && event.y < this.canvas.height)
        //     this.socket.emit('pongEvent', { x: event.x, y: event.y });
      });

      window.addEventListener( 'resize', (event) => {
        event;
      }, false );
		},

    // convertRoomData() {
    //   if (this.canvas) {
    //     // this.game.ball.x = game.ball.x / game.width * this.canvas.width;
    //     // game.ball.y = game.ball.y / game.height * this.canvas.height;
    //     this.room.game.ball.radius = this.room.game.ball.radius / this.room.game.width * this.canvas.width;
    //   }
    // }
  },

  mounted() {
    this.canvas = document.getElementById('canvas') as HTMLCanvasElement;
    // this.canvas.width = window.innerWidth;
    // this.canvas.height = window.innerHeight;
    this.canvas.width = 600;
    this.canvas.height = 400;
    this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;
    // this.convertRoomData()
    watch(()=> this.room, () => {
        requestAnimationFrame(()=>this.drawGame(this.room));
    })
  },

  created() {
    this.pongEvent();
  }
})
</script>
