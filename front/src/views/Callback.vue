<template>
	<div>
		<h1>Processing your authentication request</h1>
		<p>Please hold...</p>
		<hr>
	</div>
</template>



<script>

/* This component has a path that corresponds to the CALLBACK ADDRESS of the API 42.
** This means that if the OAuth process of 42 executed correctly, the user will be
** redirected here with two variables (code, and state), that the user can't bruteforce.
** When the user reaches this page, we launch the authentication process. If the code and state
** variables are correct, the login will be a success, and the user will be redirected to
** his profile page.
*/

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
				const result = await this.$store.dispatch('auth/login', this.code, this.state);
				if (result.twoFARedirect === true) { this.$router.push('/twoFA'); }
				else { this.$store.commit('auth/loginSuccess', result); }
			} catch(error) {
				this.$store.commit('auth/loginFailure');
				const errMessage = "Something went wrong. Please try again later."
				this.$router.push({name: 'Login', params: { message: errMessage }});
			}
		}
	},
	mounted() {
		this.handleLogin();
	}
}
</script>
