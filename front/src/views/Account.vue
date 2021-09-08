<template>
<div id="accountInfos">
	<div id="basic">
		<h1>Your account informations</h1>
		<br/><p>Your 42 login : {{ name }}</p>
		<p v-if="displayNameErrorMessage != ''" style="color:#FF0000;"> {{ displayNameErrorMessage }}</p>
		<p v-if="!displayNameEditMode">Your display name : {{ displayName }} <button @click="displayNameEditMode = true">Edit</button></p>
		<form v-else id="changeDisplayNameForm">Your display name : <input name="changeDisplayNameInput" v-model="displayNameInput"><button type="button" v-on:click="changeDisplayName()">Update</button><button @click="displayNameEditMode = false; displayNameInput = displayName; displayNameErrorMessage = '';">Cancel</button></form>
		<br/>
		<p>STATUS </p>
		<UserStatus :status="status"/>
		<br/><br/>
	</div>

	<div id="avatar-display" v-if="$store.state.avatar" style="text-align: center;">
		<h3 style="text-align: center;">This is your avatar</h3>
		<img :src="$store.state.avatar" fluid alt="User avatar" width="200" height="200"/>
	</div>
</div>

<div id="wrapper">
	<TwoFASwitch v-model:TwoFA="TwoFA"/>
	<AvatarUpload/>
</div>
</template>

<script lang="ts">

/* This is the account view. It displays several informations about the user, that we fetch from the backend.
** It allows to see and edit the display name, if its format is correct.
** It shows the user avatar.
** It shows the user status.
** It shows the TwoFASwitch component.
** It shows the AvatarUpload component.
*/

import { defineComponent } from 'vue'
import AvatarUpload from '../components/AvatarUpload.vue'
import TwoFASwitch from '../components/TwoFASwitch.vue'
import UserStatus from '../components/UserStatus.vue'
import UserService from '../services/user.service'
import { UserStatusChangeData } from '../types/user.interface';

interface AccountViewData
{
	id: number;
	name: string;
	displayNameErrorMessage: string;
	displayName: string;
	displayNameEditMode: boolean;
	displayNameInput: string;
	status: string;
	TwoFA: boolean;
}

export default defineComponent({
	name: 'Account',
	components: {
		UserStatus,
		AvatarUpload,
		TwoFASwitch
	},
	data(): AccountViewData {
		return {
			id: 0,
			name: '',
			displayNameErrorMessage: '',
			displayName: '',
			displayNameEditMode: false,
			displayNameInput: '',

			status: 'online',

			TwoFA: false,
		}
	},
	methods: {

		changeDisplayName: function(): void {
			var ref = this;
			let formData: FormData = new FormData(document.getElementById("changeDisplayNameForm") as HTMLFormElement);
			let tmp: string | null = formData.get('changeDisplayNameInput') as string | null;
			if (tmp === null) tmp = '';
			UserService.changeDisplayName(tmp).then(
				response => {
					ref.displayNameErrorMessage = '';
					ref.displayNameEditMode = false;
					ref.displayName = ref.displayNameInput = response.data;
				},
				(e) => {
					ref.displayNameInput = ref.displayName;
					ref.displayNameEditMode = false;
					if (e.response.status == 403) ref.displayNameErrorMessage = 'Error in updating display name : Unauthorized characters or name too long';
					if (e.response.status == 400) ref.displayNameErrorMessage = 'Error in updating display name : Name already taken';
				}
			)
		},

		changeUserStatus: function(data: UserStatusChangeData): void {
			if (data.userId == this.id) this.status = data.status;
		}
	},

	created(): void {
		this.$store.state.websockets.connectionStatusSocket.on('statusChange', this.changeUserStatus);
	},

	mounted(): void {
		UserService.getCurrUserInfo().then(
			response => {
				this.name = response.data.username;
				this.displayName = this.displayNameInput = response.data.displayName;
				this.TwoFA = response.data.isTwoFactorAuthenticationEnabled;
				this.id = response.data.id;
		},
		() => { console.log("Error in retrieving the informations for the current user"); })

		UserService.getCurrUserAvatar().then(
			response => {
				const urlCreator = window.URL || window.webkitURL;
				this.$store.state.avatar = urlCreator.createObjectURL(response.data);
			},
			(error) => { console.log("Couldn't get user avatar from backend: " + error.message); }
		)
	},

	beforeUnmount(): void {
		this.$store.state.websockets.connectionStatusSocket.off('statusChange', this.changeUserStatus);
	}

})
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

	#wrapper {
		display: flex;
	}

</style>
