<script lang="ts">
import axios from 'axios';
import { createToast } from 'mosha-vue-toastify';
import { defineComponent } from 'vue'
import 'mosha-vue-toastify/dist/style.css';
import authHeader from '../services/auth-header';

export default defineComponent({
	name: "Invitation",
	data()
	{
		return {
			serverURL: "http://" + window.location.hostname + ":3000" as string,
		}
	},
	mounted()
	{
		// eslint-disable-next-line
		let id = this.$route.params.id;
		window.setTimeout(() =>
		{
			axios.delete(this.serverURL + window.location.pathname, {headers: authHeader()})
			.then(res =>
			{
				createToast({
								title: 'Redirection',
								description: "Joining channel '" + res.data.channel_name + "'..."
							},
							{
								position: 'top-right',
								type: 'success',
								transition: 'slide'
							});
				window.setTimeout(() => { this.$router.push("/chat") }, 3000)
			})
			.catch(error =>
			{
				createToast({
								title: 'Error',
								description: error.response.data.message
							},
							{
								position: 'top-right',
								type: 'danger',
								transition: 'slide'
							})
			})
		}, 1000);
	}
})
</script>

<template>
	<p>INVITATION</p>
</template>

<style scoped>

	p
	{
		width: 100%;
		text-align: center;
	}

</style>
