<template>
	<div id="avatarDiv" style="text-align: center;">
			<p>Upload an avatar by clicking on the button below :</p>
			<form id="avatar-form" :class="{show_preview: showPreview}" @submit.prevent="submitForm">
				<label for="avatar" class="custom-file-upload">
					<i class="fas fa-file-upload"></i>
					Choose avatar
				</label>
				<input type="file" name="avatar" class="form-control-file" id="avatar" @change="onFileChange">

				<div class="image_container">
					<img v-bind:src="imagePreview" width="100" height="100" v-show="showPreview"/>
				</div>

				<label for="submit-avatar" class="custom-submit" v-if="picture">
					Confirm
				</label>

				<input type="submit" id="submit-avatar" />
			</form>
	</div>
</template>

<script lang="ts">

/* This component handles the upload of a user avatar from the front-end.
** It also allows to see a preview of the avatar the user wishes to upload.
*/

import { defineComponent } from 'vue'
import UserService from '../services/user.service'
import { createToast } from 'mosha-vue-toastify';
import 'mosha-vue-toastify/dist/style.css';

interface AvatarUploadData {
	picture: string;
	imagePreview: string | ArrayBuffer | null;
	showPreview: boolean;
}

export default defineComponent({
	name: 'AvatarUpload',
	data(): AvatarUploadData {
		return {
			picture: '',
			imagePreview: null,
			showPreview: false,
		}
	},

	methods: {
		onFileChange: function(event) {
			var ref = this;
			this.picture = event.target.files[0];
			let reader = new FileReader();
			reader.addEventListener('load', function() {
				ref.showPreview = true;
				ref.imagePreview = reader.result;
			}.bind(this), false)
				if (this.picture) reader.readAsDataURL(ref.picture as unknown as Blob);
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
					ref.confirmationNotification("Successfully updated your avatar");
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
					if (error.response.status === 403) ref.errorNotification('Only jpg, jpeg, png and gif files are allowed');
					else if (error.response.status === 413) ref.errorNotification('Your image is too large');
					else ref.errorNotification('Something went wrong, try again later');
				}
			)
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
#avatarDiv {
	margin: 0 auto;
	padding-top: 20px;
}

input[type="file"] {
	display: none;
}

input[type="submit"] {
	display: none;
}

.custom-file-upload
{
	border: 1px solid #ccc;
	display: inline-block;
	padding: 6px 12px;
	cursor: pointer;
}

.custom-submit {
	padding: 0.25rem 1rem;
	background-color: #39d88f;
	color: white;
	border-radius: 2rem;
	margin-right: 1rem;
	cursor: pointer;
	border: solid 1px #39d88f;
	transition: all 0.25s;
}

.custom-submit:hover
{
	border-color: #39d88f;
	color: #39d88f;
	background-color: white;
}

form
{
	max-width: 10rem;
    margin: 0 auto;
}

form > *
{
	display: none;
	margin: 0.5rem 0;
}

form > .custom-file-upload
{
	display: block;
}

form.show_preview > *
{
	display: block;
}

form.show_preview > input
{
	display: none;
}

.image_container
{
	width: 100px;
	height: 100px;
	margin: 0 auto;
}

.image_container img
{
	max-width: 100%;
}

</style>
