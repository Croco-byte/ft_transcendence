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

<script>

/* This component displays a button that allows to show or hide the QR Code used to register the application
** with Google Authenticator, in order to activate 2FA.
*/

import AuthService from '../services/auth.service'

export default {
  name: 'QRCode',
  data() {
	  return {
		  QRCode: '',
	  };
  },
  methods:	{
	  generateQRCode: async function() {
		  AuthService.generateQRCode().then(
			  response => {
				  const urlCreator = window.URL || window.webkitURL;
				  this.QRCode = urlCreator.createObjectURL(response.data);
			},
			error => { return ; })
	  },
	  hideQRCode: function() {
		  this.QRCode = '';
	  }
  }

}
</script>

<style scoped>

	#QRCode {
		padding-top: 5px;
	}

</style>
