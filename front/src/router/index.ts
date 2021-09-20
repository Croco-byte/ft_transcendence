import { createRouter, createWebHistory } from 'vue-router'
import store from '../store'

const ifAuthenticated = (from, to, next) =>
{
	if (store.state.status.loggedIn === true) {
		next();
		return ;
	}
	next({name: 'Home', params: { message: 'Please login first !' }} );
}

const routes = [
	{
		path: '/',
		name: 'Home',
		component: () => import('../views/Home.vue')
	},
	{
		path: '/game',
		name: 'Game',
		component: () => import('../views/Game.vue'),
		beforeEnter: ifAuthenticated
	},
	{
		path: '/auth/oauth_callback',
		name: 'Callback',
		component: () => import('../views/Callback.vue')
	},
	{
		path: '/account',
		name: 'Account',
		component: () => import('../views/Account.vue'),
		beforeEnter: ifAuthenticated
	},
	{
		path: '/chat',
		name: 'Chat',
		component: () => import('../components/Chat.vue'),
		beforeEnter: ifAuthenticated
	},
	{
		path: '/twoFA',
		name: 'TwoFA',
		component: () => import('../views/TwoFA.vue'),
	},
	{
		path: '/user/:id',
		name: 'User',
		component: () => import('../views/User.vue'),
		beforeEnter: ifAuthenticated
	},
	{
		path: '/friends',
		name: 'Friends',
		component: () => import('../views/Friends.vue'),
		beforeEnter: ifAuthenticated
	},
	{
		path: '/ranking',
		name: "Ranking",
		component: () => import('../views/Ranking.vue'),
		beforeEnter: ifAuthenticated
	},
	{
		path: '/invitations/:id',
		name: "Invitation",
		component: () => import('../views/Invitation.vue'),
		beforeEnter: ifAuthenticated
	}
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
