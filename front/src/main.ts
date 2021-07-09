import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import VueHead from 'vue-head'

createApp(App).use(router).use(VueHead).mount('#app')
