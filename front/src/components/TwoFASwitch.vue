<template>
	<div id="TwoFA">
		<h2 style="text-align: center;">TWO FACTOR AUTHENTICATION</h2>
		<p>Is 2FA enabled : {{ TwoFA }} </p>
		<div id="TwoFAUtils">
		<div id="TwoFASwitch">
			<div v-if="!TwoFA">
				<form id="TwoFAForm">
					<p v-if='wrongTwoFACode !=""' style="color:#FF0000;"><b> {{ wrongTwoFACode }} </b></p>
					<input type="password" name="TwoFACode" placeholder="Enter 2FA code here" style="margin-right: 20px;">
					<button type="button" v-on:click="turnOn2FA()">Turn on 2FA</button>
				</form>
			</div>
			<button type="button" v-if="TwoFA" v-on:click="turnOff2FA">Turn off 2FA</button>
		</div>
		<div>
		<QRCode/>
		</div>
		</div>
	</div>
</template>

<script lang="ts">

/* This component is used in the 'account' tab, and allows to turn 2FA on when it is off, or off when it is on.
** It also allows to see the QR Code to register the app to Google Authenticator.
*/

import QRCode from './QRCode.vue'
import AuthService from '../services/auth.service'

interface TwoFASwitchComponentData
{
	wrongTwoFACode: string;
}

export default {
	name: 'TwoFASwitch',
	components: {
		QRCode
	},
	props: [ 'TwoFA' ],
	emits: ['update:TwoFA'],

	data(): TwoFASwitchComponentData {
		return {
			wrongTwoFACode: '',
		}
	},

	methods: {
		turnOn2FA: function(): void {
			let code: FormData = new FormData(document.getElementById("TwoFAForm") as HTMLFormElement);
			AuthService.turnOn2FA(code.get('TwoFACode')).then(
				response => {
					this.$emit('update:TwoFA', true);
					localStorage.removeItem('user');
					localStorage.setItem('user', JSON.stringify(response.data));
				},
				() => { this.wrongTwoFACode = 'Wrong 2FA code to turn on Two Factor Authentication' })
		},

		turnOff2FA: function(): void {
			AuthService.turnOff2FA().then(
				() => { this.$emit('update:TwoFA', false); },
				() => { return ; })
		},
	},
}
</script>

<style scoped>
	#TwoFA {
		width: 50%;
		margin: 0 auto;
		border: solid;
		margin-right: 50px;
	}

	#TwoFAUtils {
		display: flex;
		justify-content: space-around;
	}
</style>
