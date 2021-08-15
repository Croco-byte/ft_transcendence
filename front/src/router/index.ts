import { createRouter, createWebHistory } from 'vue-router'
// import Home from '../views/Home.vue'
// import store from '../store'

// const ifAuthenticated = (from, to, next) => {
// 	if (store.state.auth.status.loggedIn === true) {
// 		next();
// 		return ;
// 	}
// 	next({name: 'Login', params: { message: 'Please login first !' }} );
// }

const routes = [
  // {
  // path: '/',
  //   name: 'Home',
  //   component: Home
  // },
  {
    path: '/game',
    name: 'Game',
    component: () => import('../views/Game.vue')
  },
  // {
	//   path: '/login',
	//   name: 'Login',
	//   component: () => import('../views/Login.vue')
  // },
  // {
	//   path: '/auth/oauth_callback',
	//   name: 'Callback',
	//   component: () => import('../views/Callback.vue')
  // },
  // {
	//   path: '/account',
	//   name: 'Account',
	//   component: () => import('../views/Account.vue'),
	//   beforeEnter: ifAuthenticated
  // },
  // {
	//   path: '/chat',
	//   name: 'Chat',
	//   component: () => import('../views/Chat.vue'),
	//   beforeEnter: ifAuthenticated
  // },
  // {
	//   path: '/twoFA',
	//   name: 'TwoFA',
	//   component: () => import('../views/TwoFA.vue'),
  // },
  // {
	//   path: '/user/:id',
	//   name: 'User',
	//   component: () => import('../views/User.vue'),
	//   beforeEnter: ifAuthenticated
  // },
  // {
	//   path: '/friends',
	//   name: 'Friends',
	//   component: () => import('../views/Friends.vue'),
	//   beforeEnter: ifAuthenticated
  // }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router