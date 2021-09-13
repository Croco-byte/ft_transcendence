<template>
	<div>
		<h1><i class="fas fa-exclamation-triangle"></i>Two Factor Authentification enabled</h1>
		<p>Two factor authentication is enabled for this account. Please enter your 2FA code below :</p>
		<div class="TwoFA">
			<form id="TwoFAForm">
				<input type="password" name="TwoFACode" placeholder="Enter 2FA code here">
				<button type="button" v-on:click="authTwoFA()">Send</button>
			</form>
		</div>
			<QRCode/>
	</div>
</template>

<script lang="ts">

/* This is the page on which the user will be redirected after logging with the 42 OAuth system, if
** the said user has 2FA activated. If the user enters a valid code from Google Authenticator, a request
** for a 2FA JWT will be made to the backend, allowing the user to login.
*/

import { defineComponent } from 'vue'
import QRCode from '../components/QRCode.vue'
import { createToast } from 'mosha-vue-toastify';
import 'mosha-vue-toastify/dist/style.css';


export default defineComponent({
	name: "TwoFA",
	components: {
		QRCode
	},

	methods: {
		authTwoFA: async function(): Promise<void> {
			try {
				let twoFACode: FormData = new FormData(document.getElementById("TwoFAForm") as HTMLFormElement);
				await this.$store.dispatch('twoFALogin', { code: twoFACode.get('TwoFACode') }).then(
					result => { this.$store.commit('loginSuccess', result); })
			} catch {
				this.errorNotification("Wrong 2FA authentication code, please try again");
			}
		},

		errorNotification(message: string)
		{
			createToast({
				title: 'Error',
				description: message
			},
			{
				position: 'top-right',
				type: 'danger',
				transition: 'slide'
			})
		},
	}
})
</script>

<style scoped>

h1
{
	text-align: center;
}

p
{
	padding-top: 50px;
	text-align: center;
}

.TwoFA
{
	display: flex;
	justify-content: center;
}

input
{
	padding: 0.5rem 1rem;
	border-radius: 1rem;
	border: solid 1px #959595;
	outline: none;
	margin: 1rem 0;
	margin-right: 20px;
}

button
{
	padding: 0.25rem 1rem;
	background-color: #39d88f;
	color: white;
	border-radius: 2rem;
	margin-right: 1rem;
	cursor: pointer;
	border: solid 1px #39d88f;
	transition: all 0.25s;
}

button:hover
{
	border-color: #39d88f;
	color: #39d88f;
	background-color: white;
}

</style>
