import { createStore } from 'vuex'
import { auth } from './auth.module';

export default createStore({
  state: {
      room: 0 as any
  },

  mutations: {
  },

  actions: {
  },
  
  modules: {
		auth,
  }
})
