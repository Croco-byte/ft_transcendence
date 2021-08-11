<template>
	<div>
		<h1>Processing your authentication request</h1>
		<p>Please hold...</p>
		<hr>
	</div>
</template>



<script>

export default {
	name: 'Callback',
	components: {
	},
	data () {
		return {
			code: this.$route.query.code,
			state: this.$route.query.state
		}
	},
	methods: {
		handleLogin: async function() {
			try {
				await this.$store.dispatch('auth/login', this.code, this.state).then(
					result => {
						if (result.twoFARedirect === true) { this.$router.push('/twoFA'); }
						else {
							this.$store.commit('auth/loginSuccess', result);
							this.$router.push('/account');
							}
						});
			} catch(error) {
				var errMessage;
				this.$store.commit('auth/loginFailure');
				console.log(error);
				if (error.response && error.response.status == 403) errMessage = "You're already connected on this account on another tab, window, or computer."
				else errMessage = "Something went wrong. Please try again later."
				this.$router.push({name: 'Login', params: { message: errMessage }});
			}
		}
	},
	beforeMount() {
		this.handleLogin();
	}
}
</script>
