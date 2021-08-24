<template>
	<div id="QRCode" style="text-align: center;">
		<button type="button" v-if="!QRCode" v-on:click="generateQRCode()">Show QR Code</button>
		<button type="button" v-if="QRCode" v-on:click="hideQRCode()">Hide QR Code</button>
	</div>
	<div v-if="QRCode" style="text-align: center;">
		<h3 style="text-align: center;">QR code to register the app</h3>
		<img :src="QRCode" fluid alt="QR code"/>
	</div>
</template>

<script lang="ts">

/* This component displays a button that allows to show or hide the QR Code used to register the application
** with Google Authenticator, in order to activate 2FA.
*/

import { defineComponent } from 'vue'
import AuthService from '../services/auth.service'

interface QRCodeComponentData
{
	QRCode: string;
}


export default defineComponent({
	name: 'QRCode',
	data(): QRCodeComponentData {
		return {
			QRCode: '',
		};
	},
	methods: {
		generateQRCode: async function(): Promise<void> {
			AuthService.generateQRCode().then(
				response => {
					const urlCreator = window.URL || window.webkitURL;
					this.QRCode = urlCreator.createObjectURL(response.data);
			},
			() => { return ; })
		},
		hideQRCode: function(): void {
			this.QRCode = '';
		}
	}
})
</script>

<style scoped>

	#QRCode {
		padding-top: 5px;
	}

</style>
