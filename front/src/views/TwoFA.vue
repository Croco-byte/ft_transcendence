<template>
	<div>
		<h1>2FA ENABLED</h1>
		<p>Two factor authentication is enabled for this account. Please enter your 2FA code below</p>
		<p v-if='error !=""' style="color:#FF0000;"><b> {{ error }} </b></p>
			<form id="TwoFAForm">
				<input type="password" name="TwoFACode" placeholder="Enter 2FA code here">
				<button type="button" v-on:click="authTwoFA()">Send</button>
			</form>
			<br/>
			<p>Reminder : if you want to register the app, display the QR Code by clicking on this button : </p>
			<QRCode/>
	</div>
</template>

<script lang="ts">

/* This is the page on which the user will be redirected after logging with the 42 OAuth system, if
** the said user has 2FA activated. If the user enters a valid code from Google Authenticator, a request
** for a 2FA JWT will be made to the backend, allowing the user to login.
*/

import QRCode from '../components/QRCode.vue'

interface TwoFaViewData
{
	error: string;
}

export default {
	name: "TwoFA",
	components: {
		QRCode
	},
	data(): TwoFaViewData {
		return {
			error: ''
		}
	},
	methods: {
		authTwoFA: async function(): Promise<void> {
			try {
				let twoFACode: FormData = new FormData(document.getElementById("TwoFAForm") as HTMLFormElement);
				await this.$store.dispatch('auth/twoFALogin', twoFACode.get('TwoFACode')).then(
					result => { this.$store.commit('auth/loginSuccess', result); })
			} catch {
				this.error = "Wrong 2FA authentication code";
			}
		}
	}
}
</script>
