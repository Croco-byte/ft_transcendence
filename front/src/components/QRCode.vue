<template>
	<div id="QRCode">
		<p> You can use this personal QR code to register the app with Google Authenticator (<b>do not share</b>).</p>
		<button type="button" class="showButton" v-if="!QRCode" v-on:click="generateQRCode()">Show QR Code</button>
		<button type="button" class="hideButton" v-if="QRCode" v-on:click="hideQRCode()">Hide QR Code</button>
	</div>
	<div v-if="QRCode" style="text-align: center;">
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
		text-align: center;
	}

.showButton {
	padding: 0.25rem 1rem;
	background-color: #39d88f;
	color: white;
	border-radius: 2rem;
	margin-right: 1rem;
	cursor: pointer;
	border: solid 1px #39d88f;
	transition: all 0.25s;
}

.showButton:hover {
	border-color: #39d88f;
	color: #39d88f;
	background-color: white;
}

.hideButton {
	padding: 0.25rem 1rem;
	background-color: red;
	color: white;
	border-radius: 2rem;
	margin-right: 1rem;
	cursor: pointer;
	border: solid 1px red;
	transition: all 0.25s;
}

.hideButton:hover {
	border-color: red;
	color: red;
	background-color: white;
}

</style>
