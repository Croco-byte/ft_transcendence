<template>
  <p> BALL SPEEED</p>
    <button class="level" @click="setLevel(1)">EASY</button>
    <button class="level" @click="setLevel(2)">MEDIUM</button>
    <button class="level" @click="setLevel(3)">HARD</button>

  <p> SCORE MAX</p>
    <button @click="setScore(5)">5</button>
    <button @click="setScore(10)">10</button>
    <button @click="setScore(15)">15</button>

  <p>COLOR OF PAD</p>
    <button @click="setPadColor('yellow')">yellow</button>
    <button @click="setPadColor('blue')">blue</button>
    <button @click="setPadColor('red')">red</button>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { SetupInterface } from '../../types/game.interface'
import Socket from 'socket.io-client'

export default defineComponent({

  emits: ["updateGameSetup"],

  props: {
      ctx: {
          required: true,      // add true
          type: CanvasRenderingContext2D
      },
      canvas: {
          required: true,
          type: HTMLCanvasElement
      },
      sock: {
        required: true,
        type: Socket
      }

  },

  data() {
    return {
      opt: { level: 1, score: 5, paddleColor: 'blue' } as SetupInterface,
    }
  },
  name: 'OptionGame',

  methods: {
    setLevel(value: number) {
      if (value != undefined){
        this.opt.level = value;
        this.sock.emit('updateGameSetup', this.opt as SetupInterface);
        console.log(this.opt);
      }
    },

    setScore(value: number) {
      if (value != undefined){
        this.opt.score = value;
        this.sock.emit('updateGameSetup', this.opt as SetupInterface);
        console.log(this.opt);
      }
    },

    setPadColor(value: string) {
      if (value != undefined){
        this.opt.paddleColor = value;
        this.sock.emit('updateGameSetup', this.opt as SetupInterface);
        console.log(this.opt);
      }
    }
  },

  mounted() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
})
</script>

<style scoped>

</style>