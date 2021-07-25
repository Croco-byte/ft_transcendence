<template>
<div id="accountInfos">
	<div id="basic">
 	 <h1>Your account informations</h1>
 	 <br/><p>Your username :	--> {{ name }}</p>
 	 <br/><br/>
	 </div>

	 <div id="avatar-display" v-if="$store.state.auth.avatar" style="text-align: center;">
 	 <h3 style="text-align: center;">This is your avatar</h3>
 	 <img :src="$store.state.auth.avatar" fluid alt="User avatar" width="200" height="200"/>
 	 </div>
  </div>

  <div id="tests">
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

  <div id="avatarDiv">
	  <h2 style="text-align: center;">UPLOAD AN AVATAR</h2>
	  <p>Choose an avatar by clicking on the button below</p>
	  <p v-if='successfullUpload != ""' style="color:#1E8449;"><b> {{ successfullUpload }} </b></p>
	  <p v-if='successfullUpload != ""' style="color:#FF0000;"><b> {{ failedUpload }} </b></p>
	  <form id="avatar-form" @submit.prevent="submitForm">
		  <input type="file" name="avatar" class="form-control-file" id="avatar" @change="onFileChange">
	  <br/><br/>
	  <img v-bind:src="imagePreview" width="100" height="100" v-show="showPreview"/>
	  <br/><br/>
	  <input type="submit" />
	  </form>
  </div>
  </div>
</template>

<script>
import AccountService from '../services/account.service'
import AuthService from '../services/auth.service'
import QRCode from '../components/QRCode.vue'

export default {
  name: 'Account',
  components: {
	  QRCode
  },
  data() {
	  return {
		  name: '',
		  TwoFA: false,
		  wrongTwoFACode: '',

		  picture: '',
		  imagePreview: null,
		  showPreview: false,
		  successfullUpload: '',
		  failedUpload: '',
	  };
  },
  methods:	{
	  turnOn2FA: async function() {
		  let code = new FormData(document.getElementById("TwoFAForm"));
		  AuthService.turnOn2FA(code.get('TwoFACode')).then(
			  response => {
				  this.TwoFA = true;
				  localStorage.removeItem('user');
				  localStorage.setItem('user', JSON.stringify(response.data));
			  },
			  () => { this.wrongTwoFACode = 'Wrong 2FA code to turn on Two Factor Authentication' })
	  },
	  turnOff2FA: async function() {
		  AuthService.turnOff2FA().then(
			  () => {
				  this.TwoFA = false;
			  },
			  () => { return ; })
	  },

	  onFileChange: function(event) {
		  this.picture = event.target.files[0];
		  let reader = new FileReader();

		  reader.addEventListener('load', function() {
			  this.showPreview = true;
			  this.imagePreview = reader.result;
		  }.bind(this), false)

		  if (this.picture) {
			  reader.readAsDataURL(this.picture);
		  }
	  },

	  submitForm: function() {
		  let formData = new FormData();

		  formData.append('avatar', this.picture);
		  AccountService.uploadAvatar(formData).then(
			 response => {
				 this.picture = '';
				 this.showPreview = false;
				 this.imagePreview = null;
				 this.failedUpload = '';
				 this.successfullUpload = 'Successfully uploaded your avatar';
				 AccountService.getUserAvatar().then(
					 response => {
						 const urlCreator = window.URL || window.webkitURL;
						 this.$store.state.auth.avatar = urlCreator.createObjectURL(response.data);
						 },
					 error => { console.log("Couldn't get user avatar from backend"); })
			 },
			 error => { 
				 this.picture = '';
				 this.showPreview = false;
				 this.imagePreview = null;
				 this.successfullUpload = '';
				 this.failedUpload = 'Failed to upload your avatar. Try again later';
			  } 
		  )
	  }
  },
  beforeMount() {
	  AccountService.getAccountInfo().then(
		  response => {
		  this.name = response.data.username;
		  this.TwoFA = response.data.isTwoFactorAuthenticationEnabled;
	  },
	  error => { return ; })
	  AccountService.getUserAvatar().then(
		  response => {
			  const urlCreator = window.URL || window.webkitURL;
			  this.$store.state.auth.avatar = urlCreator.createObjectURL(response.data);
		  },
		  error => { console.log("Couldn't get user avatar from backend"); }
	  )
	}

}
</script>

<style scoped>
	#accountInfos {
		display: flex;
		margin-bottom: 50px;
	}

	#basic {
		width: 50%;
		margin: 0 auto;
		border: solid;
		margin-right: 50px;
	}

	#avatar-display {
		width: 50%;
		margin: 0 auto;
		border: solid;
	}

	#tests {
		display: flex;
	}

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

	#avatarDiv {
		width: 50%;
		margin: 0 auto;
		border: solid;
	}

	#avatar-form {
		margin-right: auto;
		margin-left: auto;
		width: max-content;
	}

</style>
