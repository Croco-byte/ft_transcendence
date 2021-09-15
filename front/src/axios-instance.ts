import axios from 'axios'
import store from './store/index'

const instance = axios.create();

instance.interceptors.response.use(function (response) {
    return response;
  }, function (error) {
		if (error && error.response.status === 401) {
			store.commit('disconnectUser', { message: "Your session has expired" });
		}
	return Promise.reject(error);
  });

export default instance;
