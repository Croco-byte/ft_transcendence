<template>
	<div>
		<h1>Processing your authentication request</h1>
		<p>Please hold...</p>
		<hr>
	</div>
</template>



<script lang="ts">

/* This component has a path that corresponds to the CALLBACK ADDRESS of the API 42.
** This means that if the OAuth process of 42 executed correctly, the user will be
** redirected here with two variables (code, and state), that the user can't bruteforce.
** When the user reaches this page, we launch the authentication process. If the code and state
** variables are correct, the login will be a success, and the user will be redirected to
** his profile page.
*/

import { defineComponent } from 'vue'

interface CallbackViewData
{
	code: string;
	state: string;
}

export default defineComponent({
	name: 'Callback',

	data(): CallbackViewData {
		return {
			code: this.$route.query.code as string,
			state: this.$route.query.state as string
		}
	},
	methods: {
		handleLogin: async function(): Promise<void> {
			try {
				const result = await this.$store.dispatch('login', { code: this.code, state: this.state });
				if (result.twoFARedirect === true) { this.$router.push('/twoFA'); }
				else { this.$store.commit('loginSuccess', result); }
			} catch(error) {
				this.$store.commit('disconnectUser', { message: "Something went wrong. Please try again later." });
			}
		}
	},
	mounted(): void {
		this.handleLogin();
	}
})
</script>
