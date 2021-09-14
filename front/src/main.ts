import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import AuthService from './services/auth.service';

router.beforeEach((to, from, next) => {
	if (store.state.status.loggedIn && store.state.websockets.connectionStatusSocket)
		store.state.websockets.connectionStatusSocket.emit("checkForJWTChanges", { currUserId : Number(AuthService.parseJwt().id) });
	next();
})

createApp(App).use(store).use(router).mount('#app')
