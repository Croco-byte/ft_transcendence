<template>
<div id="container">
	<div id="avatar_and_config">
		<div id="avatar-display" v-if="$store.state.avatar">
			<img class="avatar" :src="$store.state.avatar" fluid alt="User avatar"/>
		</div>
		<div id="config">
				<div class="buttons_container">
					<div class="conf_selected" id="avatarupload_button" @click="changeConfigMode($event, 'avatarupload')">Avatar Upload</div>
					<div id="twofa_button" @click="changeConfigMode($event, 'twofa')">2FA configuration</div>
				</div>
				<div v-if="config_mode == 'twofa'">
					<TwoFASwitch v-model:TwoFA="TwoFA"/>
				</div>
				<div v-if="config_mode == 'avatarupload'">
					<AvatarUpload/>
				</div>
		</div>
	</div>
	<div id="info_and_match_history">
		<div id="info">
			<div class="header">
				<h2>{{ displayname }}</h2>
				<UserStatus :status="status"/>
			</div>
			<div class="info_body" style="display: flex;">
			<div class="basic_info">
				<p><i class="fas fa-caret-right"></i> <b>42 login</b> : {{ name }}</p>
				<div v-if="!displaynameEditMode"><p><i class="fas fa-caret-right"></i> <b>Display name</b> : {{ displayname }}</p>
				<button class="edit_displayname" @click="displaynameEditMode = true">Edit Display name</button></div>
				<form v-else id="changedisplaynameForm"><i class="fas fa-caret-right"></i> <b>Display name</b> :
				<input name="changedisplaynameInput" v-model="displaynameInput"><br/>
				<button class="edit_displayname" type="button" v-on:click="changedisplayname()">Update</button>
				<button class="cancel_displayname" @click="displaynameEditMode = false; displaynameInput = displayname; displaynameErrorMessage = '';">Cancel</button></form>
			</div>
			<div class="score_info">
				<p><i class="fas fa-caret-right"></i> <b>Score</b> : <i class="fas fa-trophy"></i> {{ score }}</p>
				<p><i class="fas fa-caret-right"></i> <b>Wins</b> : <span style="color:#27AE60;"><b>{{ wins }}</b></span></p>
				<p><i class="fas fa-caret-right"></i> <b>Losses</b> : <span style="color:#FF0000;"><b>{{ loses }}</b></span></p>
			</div>
			</div>
		</div>
		<div id="match_history">
			<MatchHistory/>
		</div>
	</div>
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

import { defineComponent } from 'vue';
import AvatarUpload from '../components/AvatarUpload.vue';
import TwoFASwitch from '../components/TwoFASwitch.vue';
import UserStatus from '../components/UserStatus.vue';
import MatchHistory from '../components/MatchHistory.vue';
import UserService from '../services/user.service';
import { UserStatusChangeData } from '../types/user.interface';
import { createToast } from 'mosha-vue-toastify';
import 'mosha-vue-toastify/dist/style.css';

interface AccountViewData
{
	id: number;
	name: string;
	displayname: string;
	displaynameEditMode: boolean;
	displaynameInput: string;
	status: string;
	TwoFA: boolean;
	score: number;
	wins: number;
	loses: number;

	config_mode: string;
}

export default defineComponent({
	name: 'Account',
	components: {
		UserStatus,
		AvatarUpload,
		TwoFASwitch,
		MatchHistory
	},
	data(): AccountViewData {
		return {
			id: 0,
			name: '',
			displayname: '',
			displaynameEditMode: false,
			displaynameInput: '',
			status: 'online',
			TwoFA: false,
			score: 0,
			wins: 0,
			loses: 0,

			config_mode: 'avatarupload'
		}
	},
	methods: {

		changedisplayname: function(): void {
			var ref = this;
			let formData: FormData = new FormData(document.getElementById("changedisplaynameForm") as HTMLFormElement);
			let tmp: string | null = formData.get('changedisplaynameInput') as string | null;
			if (tmp === null) tmp = '';
			UserService.changedisplayname(tmp).then(
				response => {
					ref.displaynameEditMode = false;
					ref.displayname = ref.displaynameInput = response.data;
					ref.confirmationNotification('Display name successfully updated');
				},
				(e) => {
					ref.displaynameInput = ref.displayname;
					ref.displaynameEditMode = false;
					if (e.response.status == 403) ref.errorNotification('Error in updating display name : Unauthorized characters or name too long');
					if (e.response.status == 400) ref.errorNotification('Error in updating display name : Name already taken');
				}
			)
		},

		changeUserStatus: function(data: UserStatusChangeData): void {
			if (data.userId == this.id) this.status = data.status;
		},


		changeConfigMode(event, mode)
		{
			let elem = document.getElementById(this.config_mode + '_button');
			if (elem)
				elem.classList.remove('conf_selected');
			event.currentTarget.classList.add('conf_selected');
			this.config_mode = mode;
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

	created(): void {
		this.$store.state.websockets.connectionStatusSocket.on('statusChange', this.changeUserStatus);
	},

	mounted(): void {
		UserService.getCurrUserInfo().then(
			response => {
				this.name = response.data.username;
				this.displayname = this.displaynameInput = response.data.displayname;
				this.TwoFA = response.data.isTwoFactorAuthenticationEnabled;
				this.id = response.data.id;
				this.score = response.data.score;
				this.wins = response.data.wins;
				this.loses = response.data.loses;
				this.status = response.data.status;
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

.buttons_container
{
	display: flex;
	flex-wrap: wrap;
	align-self: center;
}

.buttons_container > div
{
	padding: 0.25rem 1rem;
	border: solid 1px #39d88f;
	color: #39d88f;
	font-size: 1rem;
	cursor: pointer;
	transition: all 0.25s;
}

.buttons_container > .conf_selected
{
	background-color: #39d88f;
	color: white;
}


#container
{
	display: flex;
	justify-content: space-around;
	padding: 2rem;
	width: 100%;
}

#avatar_and_config
{
	display: flex;
	flex-direction: column;
	width: 35%;
	height: 82vh;
}

#avatar-display
{
	background-color: white;
	height: 35%;
}

#config
{
	display: flex;
	flex-direction: column;
	width: 100%;
	height: 65%;
	padding: 1rem;
	margin: 1rem 0;
	background-color: white;
}

#avatar-display
{
	text-align: center;
}

#avatar-display .avatar
{
	width: 250px;
	height: 250px;
	border-radius: 100%;
}

#config
{
	display: flex;
}

#info_and_match_history
{
	display: flex;
	flex-direction: column;
	width: 55%;
	height: 82vh;
}

#info
{
	height: 35%;
	background-color: white;

}

#info .header
{
	display: flex;
	align-items: center;
	justify-content: space-evenly;
	width: 50%;
}

#info .info_body {
	width: 100%;
}

#info .basic_info {
	text-align: center;
	width: 50%;
}

#info .score_info {
	text-align: center;
	width: 50%;
}

input[name="changedisplaynameInput"]
{
	width: 120px;
}

.edit_displayname {
	padding: 0.25rem 1rem;
	background-color: #39d88f;
	color: white;
	border-radius: 2rem;
	margin-right: 1rem;
	cursor: pointer;
	border: solid 1px #39d88f;
	transition: all 0.25s;
}

.edit_displayname:hover
{
	border-color: #39d88f;
	color: #39d88f;
	background-color: white;
}

.cancel_displayname {
	padding: 0.25rem 1rem;
	background-color: red;
	color: white;
	border-radius: 2rem;
	margin-right: 1rem;
	margin-top: 1rem;
	cursor: pointer;
	border: solid 1px red;
	transition: all 0.25s;
}

.cancel_displayname:hover {
	border-color: red;
	color: red;
	background-color: white;
}

#match_history
{
	height: 65%;
	background-color: white;
	padding: 1rem;
	margin: 1rem 0;
}
</style>
