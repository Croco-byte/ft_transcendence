<template>
	<div class="fullWindow" id="fullGameWindow">
		<canvas id="PongGame"></canvas> 
	</div>
</template>


<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { Room, Ball, Player, Paddle, Game } from '../../types/game.interface'

export default defineComponent({
	props: {
		isSpectating: {
			required: true,
			type: Boolean,
		},
		room: {
			required: true,
			type: Object as PropType<Room>
		}
	},
	
	data() {
		return {
			mousePos: {
				x: -1 as number,
				y: -1 as number
			},
			fullGameWindow: null as HTMLElement | null,
			ctx: null as CanvasRenderingContext2D | null,
			canvas: null as HTMLCanvasElement | null,
			game: null as Game | null,
		}
	},

	methods: {
		rapport(posY: number) : number 
		{
			let ret = 0;
			if (this.canvas) 
				ret = posY / this.canvas.height * this.room.game.height;
			return ret;
		},

		// --------------------------------------------------------------------------------
		// -------------------------------------------------------- DRAWINGS --------------
		drawPaddle(player1: Player, player2: Player, paddle: Paddle)
		{
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

				this.ctx.fillStyle = player1.setup.paddleColor;
				this.ctx.fillRect(p1.x, p1.y, nPaddle.width, nPaddle.height);
				this.ctx.fillStyle = player2.setup.paddleColor;
				this.ctx.fillRect(p2.x, p2.y, nPaddle.width, nPaddle.height);
			}
		},
	
		drawBall(ball: Ball)
		{
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

		drawScore(player1Score: number, player2Score: number)
		{
			if (this.ctx && this.canvas) {
				this.ctx.font = '48px serif';
				this.ctx.fillStyle = 'white';
				this.ctx.fillText(player1Score.toString(), this.canvas.width / 4, 48);
				this.ctx.fillText(player2Score.toString(), this.canvas.width * 3 / 4, 48);
			}
		},

		drawSeparator()
		{
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

		drawGame(room: Room)
		{
			if (this.ctx && this.canvas) {
					
				this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
				this.ctx.fillStyle = "black";
				this.ctx.fillRect(0, 0, this.canvas.width , this.canvas.height);

				this.drawPaddle(room.game.p1Left, room.game.p2Right, room.game.paddle);
				this.drawSeparator();
				this.drawBall(room.game.ball);
				this.drawScore(room.game.p1Score, room.game.p2Score);
			}
		},

		gameScale() : number
		{
			return this.room.game.width / this.room.game.height;
		},

		gameScaleReverse() : number
		{
			return this.room.game.height / this.room.game.width;
		},
		
		resizeWindow() : void
		{
			const header = document.getElementById('header') as HTMLElement;

			if (this.canvas && this.fullGameWindow && header) {
				let widthWithoutHeader: number = this.fullGameWindow.clientWidth - header.offsetWidth;

				if (widthWithoutHeader < this.room.game.width || 
						this.fullGameWindow.clientHeight < this.room.game.height) {
					this.canvas.width = this.room.game.width;
					this.canvas.height = this.room.game.height;
				}

				else if (this.fullGameWindow.clientHeight * this.gameScale() 
						< widthWithoutHeader) {
					this.canvas.width = this.fullGameWindow.clientHeight * this.gameScale();
					this.canvas.height = this.fullGameWindow.clientHeight;
				}

				else {
					this.canvas.width = widthWithoutHeader;
					this.canvas.height = widthWithoutHeader * this.gameScaleReverse();
				}
			}
		},

		// --------------------------------------------------------------------------------
		// ---------------------------------------------------- EVENT HANDLER -------------
		pongEvent()
		{
			if (this.canvas && !this.isSpectating){
				this.canvas.addEventListener('mousemove', (event)=> {
					if (this.canvas){
						let rect = this.canvas.getBoundingClientRect() as DOMRect;
						this.$emit('playerEvent', this.rapport(event.clientY - rect.top));
					}
				});
			}

			window.addEventListener('resize', () => this.resizeWindow(), false );
		},

		refreshScreen(): void
		{
			this.drawGame(this.room);
			let id = requestAnimationFrame(this.refreshScreen);
			this.$emit('gameId', id);
		},
	},

	// --------------------------------------------------------------------------------
	// ---------------------------------------- LIFECIRCLE HOOKS ----------------------
	mounted()
	{

		this.canvas = document.getElementById('PongGame') as HTMLCanvasElement;
		this.fullGameWindow = document.getElementById('fullGameWindow') as HTMLElement;
		this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;

		this.resizeWindow();
		this.pongEvent();
		this.refreshScreen();
	},

})
</script>

<style scoped>

.fullWindow
{
	width: 100%;
	min-height: 100vh;
	background-color: #778899;
}

canvas
{
	box-shadow: 0px 0px 17px 10px #FFFFFF;
}

</style>
