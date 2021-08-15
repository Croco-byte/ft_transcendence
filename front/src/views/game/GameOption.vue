<template>
    <button @click="setOption(1)">EASY</button>
    <button @click="setOption(2)">MEDIUM</button>
    <button @click="setOption(3)">HARD</button>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({

  emits: ["optionChosen"],

  props: {
      ctx: {
          required: true,      // add true
          type: CanvasRenderingContext2D
      },
      canvas: {
          required: true,
          type: HTMLCanvasElement
      }
  },

  name: 'OptionGame',

  methods: {
    setOption(value: number) {
      if (value != undefined) {
        this.$emit('optionChosen', value);
      }
    }
  },

  mounted() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
})
</script>
