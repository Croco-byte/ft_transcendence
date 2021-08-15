<template>
  <div class="fullWindow" @mousemove="updatePosition">
   <canvas id="canvas" width="600" height="400"></canvas> 
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, watch } from 'vue'
import { RoomInterface, GameInterface, BallInterface, PlayerInterface, PaddleInterface, SetupInterface } from '../../types/game.interface'

export default defineComponent({

  props: {
    room: {
      required: true,
      type: Object as PropType<RoomInterface>
    }
  },
  data() {
    return {
      position: {
        x: -1 as number,
        y: -1 as number
      },
      ctx: null as CanvasRenderingContext2D | null,
      canvas: null as HTMLCanvasElement | null,
      socket: null as any
    }
  },

  methods: {
    updatePosition(event) {
      if (event.x < this.canvas.width && event.y < this.canvas.height){
        if (event.y > this.player1.y)
				this.userMoveDown(this.player1);
				else if (event.y < this.player1.y) 
				this.userMoveUp(this.player1);
      }
    },
    // ----------------------------------------
		// ---------------- DRAWINGS --------------
    drawPaddle(player: PlayerInterface, paddle: PaddleInterface) {
      if (this.ctx) {
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(player.x, player.y - paddle.height / 2, paddle.width, paddle.height);
      }
		},
  

		drawBall(ball: BallInterface) {
      if (this.ctx) {
        this.ctx.beginPath();
        this.ctx.arc(ball.x, ball.y, ball.radius, 0, 2 * Math.PI, false);
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

        this.drawPaddle(room.game.p1Left, room.game.paddle);
        this.drawPaddle(room.game.p2Right, room.game.paddle);
        this.drawSeparator();
        this.drawBall(room.game.ball);
        this.drawScore(room.game.p1Score, room.game.p2Score);
      }
		},


    // ----------------------------------------
		// ----------- SOCKET EMETTERS ------------
		pongEvent() {
      window.addEventListener('pointermove', (event)=> {
        if (this.ctx && this.canvas) {
          if (event.x < this.canvas.width && event.y < this.canvas.height) {
            this.socket.emit('pongEvent', { x: event.x, y: event.y });
          }
        }
      })
		}
  },

  mounted() {
    this.canvas = document.getElementById('canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;
     watch(()=> this.room, () => {
        requestAnimationFrame(()=>this.drawGame(this.room));
    })

    this.position.x = room.game.p;
    this.position.y = this.canvas.height * 0.5;

    // console.log(t
    // his.$ref.game.clientHeight)
  }
})
</script>
