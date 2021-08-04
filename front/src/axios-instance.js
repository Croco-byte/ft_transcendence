import axios from 'axios'
import router from './router/index'
import store from './store/index'
import Swal from 'sweetalert2'

const instance = axios.create();

window.Swal = Swal;


instance.interceptors.response.use(function (response) {
    return response;
  }, function (error) {
	  if (error.response.status === 401) {
	new Swal({
		title: "Session Expired",
		text: "Session expired or invalid token. You are being redirected to the login page",
		showCancelButton: false,
		confirmButtonColor: "#DD6B55",
		confirmButtonText: "Okay"})
	store.dispatch('auth/logout');
	router.push({name: 'Login', params: { message: 'Session expired or invalid token' }})
	  }
    return Promise.reject(error);
  });

export default instance;
