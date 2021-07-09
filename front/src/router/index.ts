import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import Chat from '../views/Chat.vue';

const routes: Array<RouteRecordRaw> =
[
	{
		path: '/chat',
		name: 'chat',
		component: Chat
	}
]

const router = createRouter({
	history: createWebHistory(process.env.BASE_URL),
	routes
})

export default router
