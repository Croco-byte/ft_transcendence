import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import UserService from './services/user.service'
import mitt from 'mitt'

UserService.getCurrUserId().then(
	response => { store.commit('auth/setId', response.data.id) },
	error => { console.log("bip bip") }
)

const emitter = mitt();

const app = createApp(App).use(store).use(router)
app.config.globalProperties.emitter = emitter;
app.mount('#app');
