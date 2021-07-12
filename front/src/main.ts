import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import VueHead from 'vue-head'

createApp(App).use(VueHead).use(router).mount('#app')
