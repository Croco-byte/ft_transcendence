<template>
	<div id="TwoFA">
		<div id="TwoFAUtils">
			<div id="TwoFASwitch">
				<div v-if="!TwoFA">
					<p style="text-align: center;">Two factor authentication is currently <span style="color:#FF0000"><b>disabled</b></span>.</p>
					<div style="text-align: center;">
						<form id="TwoFAForm" style="display: inline-block;">
							<input type="password" name="TwoFACode" placeholder="Enter 2FA code here" style="margin-right: 20px;">
							<button type="button" class="twoFAbuttonOn" v-on:click="turnOn2FA()">Turn on 2FA</button>
						</form>
					</div>
				</div>
				<div style="text-align: center;" v-else>
					<p>Two factor authentication is currently <span style="color:#27AE60"><b>enabled</b></span>.</p>
					<button type="button" class="twoFAbuttonOff" v-on:click="turnOff2FA">Turn off 2FA</button>
				</div>
			</div>
			<hr width="200px" size="3px" color="black" style="margin-top: 30px;">
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

import { defineComponent } from 'vue'
import QRCode from './QRCode.vue'
import AuthService from '../services/auth.service'
import { createToast } from 'mosha-vue-toastify';
import 'mosha-vue-toastify/dist/style.css';


export default defineComponent({
	name: 'TwoFASwitch',
	components: {
		QRCode
	},
	props: [ 'TwoFA' ],
	emits: ['update:TwoFA'],

	methods: {
		turnOn2FA: function(): void {
			let code: FormData = new FormData(document.getElementById("TwoFAForm") as HTMLFormElement);
			AuthService.turnOn2FA(code.get('TwoFACode')).then(
				response => {
					this.$emit('update:TwoFA', true);
					localStorage.removeItem('user');
					localStorage.setItem('user', JSON.stringify(response.data));
					this.confirmationNotification('Two factor authentication successfully activated');
				},
				() => { this.errorNotification('Wrong 2FA code to turn on Two Factor Authentication'); })
		},

		turnOff2FA: function(): void {
			AuthService.turnOff2FA().then(
				() => { this.$emit('update:TwoFA', false); this.confirmationNotification('Two factor authentication successfully deactivated'); },
				() => { return ; })
		},

				confirmationNotification(message: string)
		{
			createToast({
				title: 'Success',
				description: message
			},
			{
				position: 'top-right',
				type: 'success',
				transition: 'slide'
			})
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
	},
})
</script>

<style scoped>
#TwoFA {
	width: 100%;
	margin: 0 auto;
	margin-right: 50px;
}

#TwoFAUtils {
	display: flex;
	justify-content: space-around;
	flex-direction: column;
}

#TwoFASwitch {
	height: auto;
}

input {
	padding: 0.5rem 1rem;
    border-radius: 1rem;
    border: solid 1px #959595;
	outline: none;
}

.twoFAbuttonOn {
	padding: 0.25rem 1rem;
	background-color: #39d88f;
	color: white;
	border-radius: 2rem;
	margin-right: 1rem;
	cursor: pointer;
	border: solid 1px #39d88f;
	transition: all 0.25s;
	margin: 0.5rem auto;
}

.twoFAbuttonOn:hover {
	border-color: #39d88f;
	color: #39d88f;
	background-color: white;
}

.twoFAbuttonOff {
	padding: 0.25rem 1rem;
	background-color: red;
	color: white;
	border-radius: 2rem;
	margin-right: 1rem;
	cursor: pointer;
	border: solid 1px red;
	transition: all 0.25s;
}

.twoFAbuttonOff:hover {
	border-color: red;
	color: red;
	background-color: white;
}
</style>
