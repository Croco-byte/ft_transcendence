<template>
    <canvas ref="canvas" id="canvas" width="600" height="400"></canvas>
</template>


<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  data() {
    return {
      ctx: null as CanvasRenderingContext2D | null,
      canvas: null as HTMLCanvasElement | null,
    }
  },

  mounted() {
    this.canvas = document.getElementById('canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;
    
  },

  methods: {
    waitRoom() {
      if (this.ctx && this.canvas) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = "orange";
        this.ctx.fillRect(0, 0, this.canvas.width , this.canvas.height);
      }
    },

    endRoom() {
      if (this.ctx && this.canvas) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = "purple";
        this.ctx.fillRect(0, 0, this.canvas.width , this.canvas.height);
      }
    }
  }
})
</script>
