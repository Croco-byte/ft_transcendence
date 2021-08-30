import { createStore } from 'vuex'
import { auth } from './auth.module'
import { gameState } from './game.module'
import gameSocket from '../plugin/gameSocket.plugin'


export default createStore({
  state: {
  },
  mutations: {
  },
  actions: {
  },
  modules: {
		auth,
    gameState
  },
  plugins: [gameSocket()]
})
