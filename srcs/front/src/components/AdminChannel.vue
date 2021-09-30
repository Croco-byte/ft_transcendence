<script lang="ts">
import axios from "axios";
import { defineComponent } from "vue";
import DOMEventInterface from "../types/DOMEvent.interface";
import authHeader from "../services/auth-header";
import $ from 'jquery';
import { createToast } from "mosha-vue-toastify";
import 'mosha-vue-toastify/dist/style.css';
import { io, Socket } from 'socket.io-client';

interface UserInterface
{
	id: number;
	username: string;
	isMuted: boolean;
	isBanned: boolean;
	isAdmin: boolean;
}

interface ChannelInterface
{
	id: number;
	name: string;
	requirePassword: boolean;
	creationDate?: Date;
	members: UserInterface[];
	owner: UserInterface | null;
}

export default defineComponent({
	name: "AdminChannel",
	data() : {channels: ChannelInterface[], selectedChannel: ChannelInterface, selected: boolean, serverURL: string, socket: Socket } {
		return {
			channels: new Array<ChannelInterface>(),
			selectedChannel:
			{
				id: -1,
				name: "",
				requirePassword: false,
				members: [],
				owner: null
			},
			selected: false,
			serverURL: "http://localhost:3000",
			socket: io() as Socket 
		}
	},

	mounted()
	{
		this.loadChannels();
	},

	beforeUnmount() {
		this.socket.disconnect();
	},

	methods:
	{
		expandInfoSection(event: DOMEventInterface<HTMLInputElement>): void
		{
			$(event.target).closest('section').toggleClass('active');
		},
		
		loadChannels()
		{
			axios.get(this.serverURL + "/channels", {headers: authHeader()})
			.then(res =>
			{
				this.channels = res.data.channels;
			});
		},

		selectChannel(channel: ChannelInterface)
		{
			this.selected = true;
			this.selectedChannel = channel;
		},

		muteMember(username: string)
		{
			axios.post(this.serverURL + '/channels/' + this.selectedChannel.id + '/members/' + username + '/mute', {}, {headers: authHeader()})
			.then(() =>
			{
				for (let member of this.selectedChannel.members)
				{
					if (member.username == username)
						member.isMuted = true
				}
			})
			.catch(error =>
			{
				createToast({
						title: 'Error',
						description: error.response.data.message
					},
					{
						position: 'top-right',
						type: 'danger',
						transition: 'slide'
					})
			})
		},

		unmuteMember(username: string)
		{
			axios.delete(this.serverURL + '/channels/' + this.selectedChannel.id + '/members/' + username + '/unmute', {headers: authHeader()})
			.then(() =>
			{
				for (let member of this.selectedChannel.members)
				{
					if (member.username == username)
						member.isMuted = false;
				}
			})
			.catch(error =>
			{
				createToast({
						title: 'Error',
						description: error.response.data.message
					},
					{
						position: 'top-right',
						type: 'danger',
						transition: 'slide'
					})
			})
		},

		banMember(username: string)
		{
			axios.post(this.serverURL + '/channels/' + this.selectedChannel.id + '/members/' + username + '/ban', {}, {headers: authHeader()})
			.then(() =>
			{
				for (let member of this.selectedChannel.members)
				{
					if (member.username == username)
						member.isBanned = true
				}
			})
			.catch(error =>
			{
				createToast({
						title: 'Error',
						description: error.response.data.message
					},
					{
						position: 'top-right',
						type: 'danger',
						transition: 'slide'
					})
			})
		},

		unbanMember(username: string)
		{
			axios.delete(this.serverURL + '/channels/' + this.selectedChannel.id + '/members/' + username + '/unban', {headers: authHeader()})
			.then(() =>
			{
				for (let member of this.selectedChannel.members)
				{
					if (member.username == username)
						member.isBanned = false
				}
			})
			.catch(error =>
			{
				createToast({
						title: 'Error',
						description: error.response.data.message
					},
					{
						position: 'top-right',
						type: 'danger',
						transition: 'slide'
					})
			})
		},

		async setAdmin(username: string): Promise<void>
		{
			axios.post(this.serverURL + '/channels/' + this.selectedChannel.id + '/admin', {username: username}, {headers: authHeader()})
			.then(() =>
			{
				let index = this.selectedChannel.members.findIndex(member => member.username == username)
				this.selectedChannel.members[index].isAdmin = true;
			})
			.catch(error =>
			{
				createToast({
						title: 'Error',
						description: error.response.data.message
					},
					{
						position: 'top-right',
						type: 'danger',
						transition: 'slide'
					})
			});
		},

		async deleteAdmin(username: string): Promise<void>
		{
			axios.delete(this.serverURL + '/channels/' + this.selectedChannel.id + '/admin/' + username, {headers: authHeader()})
			.then(() =>
			{
				let index = this.selectedChannel.members.findIndex(member => member.username == username)
				this.selectedChannel.members[index].isAdmin = false;
			})
			.catch(error =>
			{
				createToast({
						title: 'Error',
						description: error.response.data.message
					},
					{
						position: 'top-right',
						type: 'danger',
						transition: 'slide'
					})
			});
		},

		disableBlur()
		{
			this.selected = false
		},

		destroy()
		{
			if (window.confirm("Are you sure to destroy this channel ?"))
			{
				axios.delete(this.serverURL + "/channels/" + this.selectedChannel.id, {headers: authHeader()}).then(() =>
				{
					alert("Channel destroyed successfully");
					this.selected = false;
					this.loadChannels();
				})
				.catch(err =>
				{
					alert(err.response.data.message);
				})
			}
		}
	},
	created()
	{
		let websocketServerURL = "http://" + window.location.hostname + ":3000/chat";
		this.socket = io(websocketServerURL, {query: {token: authHeader().Authorization.split(" ")[1]}})
		this.socket.on('unauthorized', () => {
				this.$store.commit('disconnectUser', { message: "Session expired or invalid token" });
		})
		this.socket.on('channel_created', () =>
		{
			this.loadChannels();
		});
	}
})
</script>

<template>
	<div class="channel_pannel">
		<table>
			<thead>
				<th>ID</th>
				<th>Name</th>
				<th>Type</th>
				<th>Created at</th>
			</thead>
			<tbody>
				<tr v-for="channel in channels" :key="channel.id" @click="selectChannel(channel)">
					<td>{{ channel.id }}</td>
					<td>{{ channel.name }}</td>
					<td>{{ channel.type }}</td>
					<td>{{ channel.creationDate.toString() }}</td>
				</tr>
			</tbody>
		</table>
		<p v-if="channels.length == 0">No channels</p>
		<div class="channel_users_container" v-if="selected">
			<h2>{{ selectedChannel.name }}</h2>
			<section class="active" id="users">
				<p class="title" v-on:click="expandInfoSection">
					Members
					<i class="arrow fas fa-chevron-left"></i>
				</p>
				<div class="content">
					<div class="flex j-sb user" v-for="member in selectedChannel.members" :key="member.id">
						<p>
							<router-link :to="'/user/' + member.id">{{ member.displayname }}</router-link>
						</p>
						<div>
							<p v-if="!member.isMuted" class="fas fa-volume-mute mute_button action_button" v-on:click="muteMember(member.username)"></p>
							<p v-if="member.isMuted" class="fas fa-volume-mute unmute_button action_button" v-on:click="unmuteMember(member.username)"></p>
							<p v-if="!member.isBanned" class="fas fa-sign-out-alt ban_button action_button" v-on:click="banMember(member.username)"></p>
							<p v-if="member.isBanned" class="fas fa-sign-out-alt unban_button action_button" v-on:click="unbanMember(member.username)"></p>
							<p v-if="!member.isAdmin" class="fas fa-user-shield set_admin_button action_button" v-on:click="setAdmin(member.username)"></p>
							<p v-if="member.isAdmin" class="fas fa-user-shield delete_admin_button action_button" v-on:click="deleteAdmin(member.username)"></p>

						</div>
					</div>
				</div>
			</section>
			<div class="destroy_button" @click="destroy">
				Destroy {{ selectedChannel.name }}
			</div>
			<div class="owner_container">
				<div class="owner"></div>
			</div>
		</div>
		<div class="blur" v-if="selected" @click="disableBlur"></div>
	</div>
</template>

<style scoped>

h2
{
	font-weight: normal;
}

.blur
{
	position: fixed;
	top: 0;
	left: 0;
	width: 100vw;
	height: 100vh;
	background-color: rgba(0, 0, 0, 0.2);
	z-index: 998;
}

table
{
	width: 100%;
	border-collapse: collapse;
}

tr
{
	cursor: pointer;
}

tr:hover
{
	background-color: rgba(245, 245, 245, 0.6);
}

td
{
	padding: 1rem;
}

.channel_users_container
{
	position: fixed;
	top: 50%;
	left: 50%;
	min-width: 20rem;
	transform: translate(-50%, -50%);
	background-color: white;
	box-shadow: 5px 0px 15px 0px rgb(0 0 0 / 50%);
	padding: 1rem;
	z-index: 999;
}

section
{
	display: flex;
	flex-direction: column;
	border-bottom: solid 1px #e2e2e2;
	margin: 1rem 0;
}

section .title
{
	display: flex;
	justify-content: space-between;
	cursor: pointer;
	margin: 1rem 0;
}

section .content
{
	display: flex;
	flex-direction: column;
	padding-left: 1rem;
	max-height: 0;
	overflow: auto;
	transition: max-height 0.25s;
}

section.active .content
{
	max-height: 15rem;
	padding-bottom: 1rem;
}

section .arrow
{
	transition: 0.25s;
}

section.active .arrow
{
	transform: rotateZ(-90deg);
}

section .action_button
{
	margin-left: 0.5rem;
	margin-right: 0.5rem;
	cursor: pointer;
}

.unmute_button,
.unban_button
{
	color: red;
}

.delete_admin_button
{
	color: rgb(0, 153, 255);
}

.destroy_button
{
	padding: 0.5rem 2rem;
	background-color: red;
	color: white;
	border: solid 1px transparent;
	margin: 0 auto;
	cursor: pointer;
	transition: all 0.25s;
}

.destroy_button:hover
{
	color: red;
	border-color: red;
	background: transparent;
}

</style>
