<template>
<div>
  <h2>BALL SPEED</h2>
  <OptionButton msg="P1" @setEasy="setLevel(1)" :leftSideButton="playerLeftSide" :dataInterface="dataInterface"></OptionButton>
  <!-- <OptionButton msg="Medium" @setMedium="setLevel(2)" :leftSideButton="playerLeftSide" :dataInterface="dataInterface"></OptionButton>
  <OptionButton msg="Hard" @setHard="setLevel(3)" :leftSideButton="playerLeftSide" :dataInterface="dataInterface"></OptionButton>

  <OptionButton msg="Easy" @setEasy="setLevel(1)" :leftSideButton="playerLeftSide" :dataInterface="dataInterface"></OptionButton>
  <OptionButton msg="Medium" @setMedium="setLevel(2)" :leftSideButton="playerLeftSide" :dataInterface="dataInterface"></OptionButton>
  -->
  <OptionButton msg="P2" @setMedium="setLevel(2)" :leftSideButton="playerLeftSide" :dataInterface="dataInterface"></OptionButton> 
</div> 

<div>
  <h2>MAX SCORE</h2>
  <!-- <OptionButton msg="5" @setScore5="setScore(5)"></OptionButton>
  <OptionButton msg="10" @setScore10="setScore(10)"></OptionButton>
  <OptionButton msg="15" @setScore15="setScore(15)"></OptionButton> -->
</div>

<div>
  <h2>PAD COLOR</h2>
  <!-- <OptionButton msg="Yellow" @setPadYellow="setPadColor('Yellow')"></OptionButton>
  <OptionButton msg="Blue" @setPadBlue="setPadColor('Blue')"></OptionButton>
  <OptionButton msg="Red" @setPadRed="setPadColor('Red')"></OptionButton> -->
</div>

</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { SetupInterface, SocketDataInterface } from '../../types/game.interface'
import OptionButton from '../../components/OptionButton.vue'

export default defineComponent({

  components: { OptionButton },

  emits: [ "updateGameSetup" ],

  props: {
    dataInterface: {
      required: true,
      type: Object as PropType<SocketDataInterface>
    }
  },

  data() {
    return {
      opt: { level: 1, score: 5, paddleColor: 'blue' } as SetupInterface,
      playerLeftSide: false as boolean
    }
  },

  name: 'OptionGame',

  methods: {
    setLevel(value: number) {
      if (value != undefined){
        this.opt.level = value;
        this.$emit('updateGameSetup', this.opt as SetupInterface);
      }
    },

    setScore(value: number) {
      if (value != undefined){
        this.opt.score = value;
        this.$emit('updateGameSetup', this.opt as SetupInterface);
      }
    },

    setPadColor(value: string) {
      if (value != undefined){
        this.opt.paddleColor = value;
        this.$emit('updateGameSetup', this.opt as SetupInterface);
      }
    }
  },

  mounted() {
    if (this.dataInterface.clientId === this.dataInterface.room.player1Id)
      this.playerLeftSide = true;
  }

  
})
</script>

<style scoped>

 
h2 {
  text-align: center;
  font-style: Arial, Helvetica, sans-serif;
  font-size: 30px;
  color: black;
}

</style>