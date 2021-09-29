import { createRouter, createWebHistory } from 'vue-router'
import store from '../store'
import { createToast } from 'mosha-vue-toastify';
import 'mosha-vue-toastify/dist/style.css';

const ifAuthenticated = (from, to, next) =>
{
	if (store.state.status.loggedIn === true) {
		next();
		return ;
	}
	createToast({
		title: 'Error',
		description: 'Please login first !'
	},
	{
		position: 'top-right',
		type: 'danger',
		transition: 'slide'
	})
	next({name: 'Home'} );
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
		path: '/chat/:direct_id?',
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
		path: '/invitations/:id',
		name: "Invitation",
		component: () => import('../views/Invitation.vue'),
		beforeEnter: ifAuthenticated
	},
	{
		path: '/admin',
		name: 'Admin',
		component: () => import('../views/Admin.vue'),
		beforeEnter: ifAuthenticated
	}
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
