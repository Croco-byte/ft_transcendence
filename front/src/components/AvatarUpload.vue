<template>
	<div id="avatarDiv">
		<h2 style="text-align: center;">UPLOAD AN AVATAR</h2>
			<p>Choose an avatar by clicking on the button below</p>
			<p v-if='successfullUpload != ""' style="color:#1E8449;"><b> {{ successfullUpload }} </b></p>
			<p v-if='failedUpload != ""' style="color:#FF0000;"><b> {{ failedUpload }} </b></p>
			<form id="avatar-form" @submit.prevent="submitForm">
				<input type="file" name="avatar" class="form-control-file" id="avatar" @change="onFileChange">
				<br/><br/>
				<img v-bind:src="imagePreview" width="100" height="100" v-show="showPreview"/>
				<br/><br/>
				<input type="submit" />
			</form>
	</div>
</template>

<script>

/* This component handles the upload of a user avatar from the front-end.
** It also allows to see a preview of the avatar the user wishes to upload.
*/

import { defineComponent } from 'vue'
import UserService from '../services/user.service'

export default defineComponent({
	name: 'AvatarUpload',
	data() {
		return {
			picture: '',
			imagePreview: null,
			showPreview: false,
			successfullUpload: '',
			failedUpload: ''
		}
	},

	methods: {
		onFileChange: function(event) {
			this.picture = event.target.files[0];
			let reader = new FileReader();
			reader.addEventListener('load', function() {
				this.showPreview = true;
				this.imagePreview = reader.result;
			}.bind(this), false)
				if (this.picture) reader.readAsDataURL(this.picture);
		},

		submitForm: function() {
			var ref = this;
			let formData = new FormData();
			formData.append('avatar', this.picture);
			UserService.uploadAvatar(formData).then(
				() => {
					ref.picture = '';
					ref.showPreview = false;
					ref.imagePreview = null;
					ref.failedUpload = '';
					ref.successfullUpload = 'Successfully uploaded your avatar';
					UserService.getCurrUserAvatar().then(
						response => {
							const urlCreator = window.URL || window.webkitURL;
							ref.$store.state.avatar = urlCreator.createObjectURL(response.data);
						},
						() => { console.log("Couldn't get user avatar from backend"); })
				},
				(error) => {
					ref.picture = '';
					ref.showPreview = false;
					ref.imagePreview = null;
					ref.successfullUpload = '';
					if (error.response.status === 403) ref.failedUpload = 'Only jpg, jpeg, png and gif files are allowed';
					else if (error.response.status === 413) ref.failedUpload = 'Your image is too large';
					else ref.failedUpload = 'Something went wrong, try again later';
				}
			)
		},
	
	},
})
</script>

<style scoped>
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
