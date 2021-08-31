<template>
    <!-- <canvas ref="canvas" id="canvas" width="600" height="400"></canvas> -->
	<div class="text">
		<div class="test">
			<p>Waiting for another player...</p>
			<div class="loader"></div>

		</div>
	</div>
</template>


<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
//   props: {
//     backColor: {
//       required: true,
//       type: String
//     }
//   },

//   data() {
//     return {
//       ctx: null as CanvasRenderingContext2D | null,
//       canvas: null as HTMLCanvasElement | null,
//     }
//   },

//   mounted() {
//     // this.canvas = document.getElementById('canvas') as HTMLCanvasElement;
//     // this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;
//     // this.waitRoom();
//   },

//   methods: {
//     waitRoom() {
//     //   if (this.ctx && this.canvas) {
//         // this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
//         // this.ctx.fillStyle = this.backColor;
//         // this.ctx.fillRect(0, 0, this.canvas.width , this.canvas.height);
//     //   }
//     },

//   }
})
</script>

<style>

html, body {
	height:100vh;
}

.text {
	margin-top: 30%;
	position: relative;
	text-align: center;
	font-family: Verdana, Arial, Helvetica, sans-serif;
	font-size:3vw;
}

p {
	top: 40%;

}

.test {
	height: 50%;
}

.loader {
	position: absolute;
	left: 40%;
  border: 16px solid #f3f3f3; /* Light grey */
  border-top: 16px solid #3498db; /* Blue */
  border-radius: 50%;
  width: 120px;
  height: 120px;
  animation: spin 2s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

</style>