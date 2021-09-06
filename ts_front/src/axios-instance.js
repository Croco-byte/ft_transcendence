import axios from 'axios'
import Swal from 'sweetalert2'

window.Swal = Swal;

const instance = axios.create();

instance.interceptors.response.use(function (response)
{
	return response;
}, function (error)
	{
		if (error.response.status === 401)
		{
			// new Swal({
			// 	title: "Session Expired",
			// 	text: "Session expired or invalid token. You are being redirected to the login page",
			// 	showCancelButton: false,
			// 	confirmButtonColor: "#DD6B55",
			// 	confirmButtonText: "Okay"})
			// store.dispatch('auth/logout');
			// router.push({name: 'Login', params: { message: 'Session expired or invalid token' }})
		}
		return Promise.reject(error);
	});

export default instance;
