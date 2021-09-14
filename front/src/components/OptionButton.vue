<template>
    <button class="butt" :class="{p2 : leftSideButton}" @click="setOption()">{{ msg }}</button>
</template>


<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { SocketDataInterface } from '../types/game.interface'

export default defineComponent({
  emits: [ "setEasy", "setMedium", "setHard", "setScore5", "setScore10", "setScore15", 
          "setPadYellow", "setPadBlue", "setPadRed" ],

  props: {
    msg: {
      required: true,
      type: String
    },

    leftSideButton: {
      required: true,
      type: Boolean
    },

    dataInterface: {
      required: true,
      type: Object as PropType<SocketDataInterface>
    }
    
  },

  data() {
    return {
      optionEmit: {
        'Easy': 'setEasy',
        'Medium': 'setMedium',
        'Hard': 'setHard',
        '5': 'setScore5',
        '10': 'setScore10',
        '15': 'setScore15',
        'Yellow': 'setPadYellow',
        'Blue': 'setPadBlue',
        'Red': 'setPadRed',
      }
    }
  },
  
  methods: {
    setOption() {
      // if (this.leftSideButton && (this.dataInterface.clientId))
      // this.$emit(this.optionEmit[this.msg])
    },

    
  },

  mounted() {
    console.log(`leftSide ${this.leftSideButton}`);
  }

})
</script>


<style>

button {
  /* border-color: white; */
  background: #3c8cce;
  border: 2px solid rgb(37, 37, 146);
  margin-right: 3px;
  padding: 14px 40px;
  text-decoration:none;
  border-radius: 5%;
  transition-duration: 0.4s;
  position: center;

  /* text style */
  font-family:Arial, Helvetica, sans-serif;
  font-size:17px;
  text-align: center;

}

.p2 {
  background: red;
  border: 2px solid rgb(37, 37, 146);
  margin-right: 3px;
  padding: 14px 40px;
  text-decoration:none;
  border-radius: 5%;
  transition-duration: 0.4s;
  position: center;

  /* text style */
  font-family:Arial, Helvetica, sans-serif;
  font-size:17px;
  text-align: center;
}

.p2:hover {
  background: white;
  color: black;
}

.butt:hover {
  background: white;
  color: black;
}
</style>