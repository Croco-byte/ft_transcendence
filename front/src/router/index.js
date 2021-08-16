import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import store from '../store'

/* For a smooth front, prevent a non-logged in user to access routes for which he will need his JWT to interact with the backend.
** This is not in itself an authentification mechanism, it's just esthetic. The real check is made by the backend.
*/
const ifAuthenticated = (from, to, next) => {
	if (store.state.auth.status.loggedIn === true) {
		next();
		return ;
	}
	next({name: 'Login', params: { message: 'Please login first !' }} );
}

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
	  path: '/login',
	  name: 'Login',
	  component: () => import('../views/Login.vue')
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
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
