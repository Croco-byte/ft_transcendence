import axios from 'axios'
import router from './router/index'
import store from './store/index'
import Swal from 'sweetalert2'

const instance = axios.create();

instance.interceptors.response.use(function (response) {
    return response;
  }, function (error) {
		if (error && error.response.status === 401) {
			Swal.fire('Session expired', 'Your session has expired !', 'error');
			store.dispatch('logout');
			router.push({name: 'Login', params: { message: 'Session expired or invalid token' }})
		}
	return Promise.reject(error);
  });

export default instance;
