import { createStore } from 'vuex'
import { RoomInterface } from '../../types/game.interface'


export const gameState : any = {
  namespaced: true,

  state: {
    joinScreen: true as boolean,
    setUpScreen: false as boolean,
    room: 0 as any | RoomInterface
  },

  mutations: {
    setGameRoom(state: any, Room: RoomInterface) {
      state.room = Room;
    },

    displaySetupView(state: any) {
      state.joinScreen = false;
      state.setUpScreen = true;
    }
  },

  actions: {
  },
  
  getters: {

  },

}

