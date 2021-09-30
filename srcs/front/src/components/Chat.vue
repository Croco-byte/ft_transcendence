<script lang="ts">

import axios, { AxiosResponse } from 'axios';
//import axios from '../axios-instance';
import { io, Socket } from 'socket.io-client';
import { defineComponent } from 'vue'
import { ChannelInterface, UserInterface } from '../types/channel.interface';
import MessageInterface from '../types/message.interface';
import DOMEventInterface from '../types/DOMEvent.interface';
import $ from 'jquery';
import authHeader from '../services/auth-header';
import authService from '../services/auth.service';
import { createToast } from 'mosha-vue-toastify';
import UserStatus from '../components/UserStatus.vue';
import 'mosha-vue-toastify/dist/style.css';
import { UserStatusChangeData } from '../types/user.interface';

export default defineComponent(
{
	name: 'Chat',
	components:
	{
		UserStatus
	},
	data() {
		return {
			mode: 'normal' as string,
			socket: io() as Socket,
			channel:
			{
				id: -1,
				name: '',
				requirePassword: false,
				password: '',
				messages: [],
				has_new_message: false,
				members: new Array<UserInterface>(),
				administrators: [],
				user_role: 'MEMBER',
				isJoined: false,
				type: "public",
				isDirect: false
			} as ChannelInterface,
			channels: [] as Array<ChannelInterface>,
			serverURL: "http://" + window.location.hostname + ":3000" as string,
			websocketServerURL: "http://" + window.location.hostname + ":3000/chat" as string,
			user_id: -1,
			show_channels_list: false,
			filter: "public",
			is_loading: false
		}
	},

	computed:
	{
		placeholder(): string
		{
			return 'Dites-bonjour à ' + this.channel.name + '...';
		}
	},
	
	methods:
	{
		timestampzToDate(str: string): string
		{
			return (str.toString().split('T')[0])
		},

		clickOnChannel(event: DOMEventInterface<HTMLInputElement>): void
		{
			let id: number;
			id = parseInt($(event.currentTarget).attr('data-id') as string);
			$('.chat_item.selected').removeClass('selected');
			$(event.currentTarget).addClass('selected');

			let channel = this.channels[id];
			if (channel.isJoined)
				this.switchChat(channel.id);
			else
			{
				if (window.confirm("Do you want to join this channel ?"))
				{
					let password: string | null = null;
					if (channel.requirePassword)
						password = window.prompt("Password of '" + channel.name + "'");
					axios.post(this.serverURL + '/channels/' + channel.id + '/members', {password: password}, {headers: authHeader()})
					.then(() =>
					{
						this.loadChannelsList().then(() =>
						{
							this.channels[id].isJoined = true;
							this.switchChat(this.channels[id].id);
						})
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
				}
			}
		},

		switchChat(id: number): void
		{
			let i = 0;
			for (i = 0; i < this.channels.length; i++)
				if (this.channels[i].id == id)
					break ;

			this.channel = this.channels[i];
			this.channels[i].has_new_message = false;

			this.loadMessages();
		},

		loadMessages(): void
		{
			axios.get(this.serverURL + "/channels/" + this.channel.id + "/", {headers: authHeader()})
			.then((res: {data: {messages: Array<MessageInterface>, user_role: string}}) =>
			{
				this.channel.messages = res.data.messages;
				this.channel.user_role = res.data.user_role;
				window.setTimeout(() =>
				{
					document.getElementsByClassName('view')[0].scrollTop =  document.getElementsByClassName('view')[0].scrollHeight
				}, 0);
			})
			.catch((error) =>
			{
				if (error.response.data.authentify_in_channel)
					this.changeMode("authentify_user_in_channel");
				else
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
		
		createChannel(): void
		{
			let name = ($('#create_channel_input').val() as string).trim() as string;
			
			if (name && name.length > 0)
			{
				// Axios send to nestjs the name
				this.mode = 'normal';

				axios.post(this.serverURL + '/channels', {name: name, isDirect: false}, {headers: authHeader()})
				.then(() =>
				{
					createToast({
						title: 'Create channel',
						description: "Create channel named '" + name + "'"
					},
					{
						position: 'top-right',
						type: 'success',
						transition: 'slide'
					})
					this.loadChannelsList();
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
			}
		},

		expandInfoSection(event: DOMEventInterface<HTMLInputElement>): void
		{
			$(event.target).closest('section').toggleClass('active');
		},

		changeMode(mode: string): void
		{
			this.mode = mode;
			if (this.mode == "channel_info" && this.channel.id != -1)
				this.loadChannelInfo();
		},

		loadChannelInfo(): void
		{
			axios.get(this.serverURL + "/channels/" + this.channel.id + "/info", {headers: authHeader()}).then((res: AxiosResponse) =>
			{
				this.channel.members = res.data.users;
				this.channel.administrators = res.data.administrators;
				this.channel.type = res.data.type;
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

		async addMember(): Promise<void>
		{
			let username = $('#add_member_input').val() as string;
			axios.post(this.serverURL + '/channels/' + this.channel.id + '/members', {username: username}, {headers: authHeader()})
			.then(() =>
			{
				this.mode = 'normal'
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

		async addAdmin(username: string): Promise<void>
		{
			if (this.channel.user_role == "MEMBER")
				return ;
			// let username = $('#add_admin_input').val() as string;
			axios.post(this.serverURL + '/channels/' + this.channel.id + '/admin', {username: username}, {headers: authHeader()})
			.then((res) =>
			{
				createToast({
						title: 'Admin added',
						description: res.data.message
					},
					{
						position: 'top-right',
						type: 'success',
						transition: 'slide'
					});
				this.loadChannelInfo();
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
			if (this.channel.user_role == "MEMBER")
				return ;
			// let username = $('#add_admin_input').val() as string;
			axios.delete(this.serverURL + '/channels/' + this.channel.id + '/admin/' + username, {headers: authHeader()})
			.then((res) =>
			{
				createToast({
						title: 'Admin removed',
						description: res.data.message
					},
					{
						position: 'top-right',
						type: 'success',
						transition: 'slide'
					})
				this.loadChannelInfo()
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

		createMatch(): void
		{
			if (window.confirm("Do you want to start match with " + this.channel.name + " ?"))
			{
				alert("Start");
			}
		},

		async sendMessage(): Promise<void>
		{
			let message = $('#msg_input').val() as string;
			if (message && message.length > 0)
				axios.post(this.serverURL + "/channels/" + this.channel.id + "/messages", {channel: this.channel.id, content: message}, {headers: authHeader()})
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
			
			$('#msg_input').val('');
		},

		muteMember(username: string): void
		{
			if (this.channel.user_role == "MEMBER")
				return ;
			axios.post(this.serverURL + '/channels/' + this.channel.id + '/members/' + username + '/mute', {}, {headers: authHeader()})
			.then(() =>
			{
				this.loadChannelInfo();
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

		muteAdmin(username: string): void
		{
			axios.post(this.serverURL + '/channels/' + this.channel.id + '/admin/' + username + '/mute', {}, {headers: authHeader()})
			.then(() =>
			{
				this.loadChannelInfo();
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

		unmuteMember(username: string): void
		{
			axios.delete(this.serverURL + '/channels/' + this.channel.id + '/members/' + username + '/unmute', {headers: authHeader()})
			.then(() =>
			{
				this.loadChannelInfo();
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

		unmuteAdmin(username: string): void
		{
			axios.delete(this.serverURL + '/channels/' + this.channel.id + '/admin/' + username + '/unmute', {headers: authHeader()})
			.then(() =>
			{
				this.loadChannelInfo();
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

		banMember(username: string): void
		{
			if (this.channel.user_role == "MEMBER")
				return ;
			axios.post(this.serverURL + '/channels/' + this.channel.id + '/members/' + username + '/ban', {}, {headers: authHeader()})
			.then(() =>
			{
				this.loadChannelInfo();
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

		banAdmin(username: string): void
		{
			if (this.channel.user_role == "MEMBER")
				return ;
			axios.post(this.serverURL + '/channels/' + this.channel.id + '/admin/' + username + '/ban', {}, {headers: authHeader()})
			.then(() =>
			{
				this.loadChannelInfo();
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

		unbanMember(username: string): void
		{
			axios.delete(this.serverURL + '/channels/' + this.channel.id + '/members/' + username + '/unban', {headers: authHeader()})
			.then(() =>
			{
				this.loadChannelInfo();
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

		unbanAdmin(username: string): void
		{
			axios.delete(this.serverURL + '/channels/' + this.channel.id + '/admin/' + username + '/unban', {headers: authHeader()})
			.then(() =>
			{
				this.loadChannelInfo();
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

		async setRequirePassword(): Promise<void>
		{
			let checked = $('#active_password:checked').length != 0;
			if (checked)
				this.channel.requirePassword = true;
			else
				this.channel.requirePassword = false;

			let url;
			if (!this.channel.requirePassword)
			{
				url = this.serverURL + '/channels/' + this.channel.id + '/password';
				await axios.delete(url, {headers: authHeader()}).catch(error =>
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
			}
		},

		async updateChannelPassword(): Promise<void>
		{
			let password = $('#channel_password').val() as string;
			axios.patch(this.serverURL + '/channels/' + this.channel.id + '/password', {password: password}, {headers: authHeader()})
			.then(() =>
			{
				createToast({
						title: 'Password modified',
						description: "Password modified successfully"
					},
					{
						position: 'top-right',
						type: 'success',
						transition: 'slide'
					})
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

		updateChannelName(): void
		{
			let new_name : string = $('#channel_name_input').val() as string;
			let id  = this.channel.id;
			axios.patch(this.serverURL + '/channels/' + this.channel.id + '/name', {id: id, new_name: new_name}, {headers: authHeader()})
			.then(() =>
			{
				this.loadChannelsList();
				this.channel.name = new_name;
				createToast({
						title: 'Success',
						description: "Channel name changed to '" + new_name + "' !"
					},
					{
						position: 'top-right',
						type: 'success',
						transition: 'slide'
					})
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

		async loadChannelsList()
		{
			return new Promise((resolve, reject) =>
			{
				this.is_loading = true;
				axios.get(this.serverURL + "/channels/" + this.filter, { headers: authHeader() }).then((res) =>
				{
					this.channels = res.data;
					this.is_loading = false;
					resolve(this.channels);
				})
				.catch(err =>
				{
					this.is_loading = false;
					createToast({
							title: 'Error',
							description: err.response.message
						},
						{
							position: 'top-right',
							type: 'danger',
							transition: 'slide'
						})
					reject();
				});
			})
		},

		getUserLink(user_id: number)
		{
			return "/user/" + user_id;
		},

		async restoreChatView()
		{
			this.channel = {
				id: -1,
				name: '',
				requirePassword: false,
				password: '',
				messages: [],
				has_new_message: false,
				members: new Array<UserInterface>(),
				administrators: [],
				user_role: "MEMBER",
				isJoined: false,
				type: "public",
				isDirect: false
			} as ChannelInterface;
		},

		async leaveChannel()
		{
			let leave_id = this.channel.id
			axios.delete(this.serverURL + "/channels/" + leave_id + "/members", {headers: authHeader()}).then(() =>
			{
				let ex_name = this.channel.name;
				this.loadChannelsList();
				this.restoreChatView();
				let index = this.channels.findIndex(c => c.id == leave_id);

				if (index != -1)
					this.channels.splice(index, 1);

				createToast({
					title: 'Success',
					description: "You leave channel '" + ex_name + "'"
				},
				{
					position: 'top-right',
					type: 'success',
					transition: 'slide'
				})
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
			this.mode = 'normal';
		},

		async authentifyUser()
		{
			let password = $('#channel_password').val() as string;
			axios.post(this.serverURL + "/channels/" + this.channel.id + "/check_password", {password: password}, {headers: authHeader()}).then(() =>
			{
				this.changeMode("normal");
				this.loadMessages();
				createToast({
						title: 'Join channel',
						description: "You have now access to this channel !"
					},
					{
						position: 'top-right',
						type: 'success',
						transition: 'slide'
					})
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

		isMe(message: MessageInterface)
		{
			return message.user_id == this.user_id;
		},

		changeChannelType()
		{
			let type: "public" | "private";
			let isPublic = $("#change_type_input").prop('checked');
			type = (isPublic ? "public" : "private");
			axios.patch(this.serverURL + "/channels/" + this.channel.id + "/type", {type: type}, {headers: authHeader()}).then(() =>
			{
				createToast({
						title: this.channel.name,
						description: "Channel is now " + type + "."
					},
					{
						position: 'top-right',
						type: 'success',
						transition: 'slide'
					})
				this.channel.type = type;
			})
			.catch((error) =>
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

		generateInvitation()
		{
			axios.get(this.serverURL + "/channels/" + this.channel.id + "/invitation", {headers: authHeader()})
			.then(res =>
			{
				let link = window.location.host + res.data.link;
				navigator.clipboard.writeText(link).then(() =>
				{
					createToast({
						title: 'Invitation',
						description: 'The invitation link has been copied in the clipboard'
					},
					{
						position: 'top-right',
						type: 'success',
						transition: 'slide'
					})
				})
				.catch(() =>
				{
					alert("You invitation link is :\r\n" + res.data.link);
				})
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

		setFilter(new_filter: string)
		{
			this.filter = new_filter;
			$('.channel_filter.selected').removeClass("selected");
			$('.channel_filter#' + new_filter).addClass("selected");
			this.loadChannelsList();
		},

		kickMember(username: string): void
		{
			if (this.channel.user_role == "MEMBER")
				return ;
			axios.delete(this.serverURL + '/channels/' + this.channel.id + '/members/' + username, {headers: authHeader()})
			.then(() =>
			{
				this.loadChannelInfo();
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

		kickAdmin(username: string): void
		{
			if (this.channel.user_role != "OWNER")
				return ;
			axios.delete(this.serverURL + '/channels/' + this.channel.id + '/admin/' + username, {headers: authHeader()})
			.then(() =>
			{
				this.loadChannelInfo();
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

		changeUserStatus(data: UserStatusChangeData): void
		{
			if (!this.channel || this.channel.id == -1 || !this.channel.members)
				return ;
			for(let i=0; i < this.channel.members.length; i++)
			{
				if (this.channel.members[i].id == data.userId)
					this.channel.members[i].status = data.status;
			}
		},
	},

	created(): void
	{
		this.mode = 'normal';

		this.loadChannelsList();
		this.user_id = Number(authService.parseJwt().id);

		this.socket = io(this.websocketServerURL, {query: {token: authHeader().Authorization.split(" ")[1]}});
		this.socket.on('unauthorized', () => {
				this.$store.commit('disconnectUser', { message: "Session expired or invalid token" });
		})
		this.socket.on('message', (data: MessageInterface) =>
		{
			if (data.channel !== this.channel.id)
			{
				for (let i = 0; i < this.channels.length; i++)
				{
					if (this.channels[i].id === data.channel)
					{
						this.channels[i].has_new_message = true;
						if (this.channels[i].messages)
							this.channels[i].messages.push(data);
					}
				}
			}
			else
			{
				if (this.channel.messages)
				{
					this.channel.messages.push(data);
					window.setTimeout(() =>
					{
						document.getElementsByClassName('view')[0].scrollTop =  document.getElementsByClassName('view')[0].scrollHeight
					}, 0)
				}
			}
		})
		this.socket.on('new_member', (msg: string) =>
		{
			createToast({
						title: 'New member',
						description: msg
					},
					{
						position: 'top-right',
						type: 'success',
						transition: 'slide'
					})
		});
		this.socket.on('member_leave', (msg) =>
		{
			createToast({
						title: 'Member leave',
						description: msg
					},
					{
						position: 'top-right',
						type: 'success',
						transition: 'slide'
					})
		});
		this.socket.on('kicked', (msg) =>
		{
			if (this.channel.id == msg.channel_id)
				this.restoreChatView();
			this.loadChannelsList();
			createToast({
						title: 'KICKED',
						description: msg.msg
					},
					{
						position: 'top-right',
						type: 'danger',
						transition: 'slide'
					})
		});
		this.socket.on("channel_created", () =>
		{
			if (this.filter == "public")
				this.loadChannelsList()
		})
		this.socket.on("channel_type_changed", () =>
		{
			if (this.filter == "public")
				this.loadChannelsList();
		});
		this.socket.on("channel_password_actived", (msg) =>
		{
			for (let channel of this.channels)
			{
				if (channel.id == msg.channel_id)
				{
					channel.requirePassword = true;
				}
			}
		})
		this.socket.on("channel_password_deleted", () =>
		{
			if (this.filter == "public")
				this.loadChannelsList();
		})
		this.socket.on("channel_destroyed", (msg) =>
		{
			let id = msg.channel_id;
			if (id == this.channel.id)
				this.restoreChatView();

			for (let i = 0; i < this.channels.length; i++)
			{
				let channel = this.channels[i];
				if (channel.id == id)
				{
					this.channels.splice(i, 1);
					createToast(
					{
						title: 'Channel destroyed',
						description: msg.msg
					},
					{
						position: 'top-right',
						type: 'danger',
						transition: 'slide'
					})
					return ;
				}
			}
		})
	},

	mounted(): void
	{
		this.$store.state.websockets.connectionStatusSocket.on('statusChange', this.changeUserStatus);
		if (this.$route.params.direct_id)
		{
			this.setFilter("direct");
			let id = parseInt(this.$route.params.direct_id as string) as number;
			this.loadChannelsList().then(() =>
			{
				this.switchChat(id);
			})
		}
	},
	unmounted()
	{
		this.socket.disconnect();
		this.$store.state.websockets.connectionStatusSocket.off('statusChange', this.changeUserStatus);
	}
});

</script>

<template>
	<div id="chat">
		<div class="chat_container">
			<div class="blur" v-if="mode == 'create_channel' || mode == 'add_member' || mode == 'channel_info' || mode == 'add_admin' || mode == 'authentify_user_in_channel' || mode == 'channel_list'" v-on:click="changeMode('normal')"></div>
			<div class="chat_list" :class="{active: mode == 'channel_list'}">
				<div class="channels_filter_container">
					<div class="channel_filter selected" id="public" @click="setFilter('public')">
						Public
					</div>
					<div class="channel_filter" id="joined" @click="setFilter('joined')">
						Joined
					</div>
					<div class="channel_filter" id="direct" @click="setFilter('direct')">
						Direct
					</div>
				</div>
				<div class="list">
					<div class="loading_icon" v-if="is_loading">
						<img src="https://i.pinimg.com/originals/d7/65/ca/d765cadd577d6901922c2bfcd8419015.gif"/>
					</div>
					<div v-else @click="clickOnChannel" v-for="(chan, index) in channels" v-bind:key="chan.id" class="chat_item" v-bind:data-id="index">
						<div class="flex j-sb">
							<p class="title">{{ chan.name }}</p>
							<p class="date">{{ chan.modifiedDate }}</p>
						</div>
						<p class="last_msg_preview"></p>
						<div class="new_sticker" v-if="chan.has_new_message"></div>
					</div>
				</div>
				<div id="create_channel_button" v-on:click="changeMode('create_channel')">
					<span>+</span>
				</div>
			</div>
			<div class="chat_view">
				<div class="no_chat_div" v-if="!channel.id">
					<p>Commencer une discussion</p>
					<button>Commencer</button>
				</div>
				<div v-if="channel.id">
					<div class="chat_view_header">
						<p class="toggle_chat_list_button" @click="changeMode('channel_list')">
							<span></span>
							<span></span>
							<span></span>
						</p>
						<p id="chat_title">
							{{ channel.name }}
							<UserStatus v-if="channel.isDirect" :status="channel.members[1].status" :friendId="channel.members[1].id" :userId="user_id"/>
						</p>
						<p id="chat_info_button" class="fas fa-info" v-on:click="changeMode('channel_info')" v-if="channel.id != -1 && !channel.isDirect"></p>
					</div>
					<div class="view">
						<div v-for="message in channel.messages" :key="message" class="message" :class="{ me: isMe(message)}">
							<router-link class="username" :to="getUserLink(message.user_id)">{{ message.user }}</router-link>
							<p class="content">{{ message.content }}</p>
						</div>
					</div>
					<div class="message_bar" v-if="channel.id != -1">
						<input id="msg_input" type="text" v-bind:placeholder="placeholder" v-on:keyup.enter="sendMessage"/>
						<button id="send_button" v-on:click="sendMessage">Envoyer</button>
						<!-- <p id="play_button" class="fas fa-table-tennis" v-on:click="createMatch" v-if="channel.isDirect"></p> -->
					</div>
				</div>
			</div>
			<div class="input_popup" v-if="mode == 'create_channel'">
				<input type="text" placeholder="Channel's name" id="create_channel_input" v-on:keyup.enter="createChannel" autofocus/>
				<button id="create_channel" @click="createChannel">
					<i class="fas fa-arrow-right"></i>
				</button>
			</div>
			
			<div class="channel_info_container" v-if="mode == 'channel_info' && channel.id != -1">
				<p>Info</p>
				<section class="active" v-if="!channel.isDirect">
					<p class="title" v-on:click="expandInfoSection">
						Name
						<i class="arrow fas fa-chevron-left"></i>
					</p>
					<div class="content">
						<div v-if="channel.user_role != 'MEMBER'">
							<input type="text" id="channel_name_input" v-bind:value="channel.name" v-on:keyup.enter="updateChannelName"/>
							<button class="save_channel_config_button" v-on:click="updateChannelName">Save</button>
						</div>
						<div v-else>
							<p class="m0">{{ channel.name }}</p>
						</div>
					</div>
				</section>
				<section v-if="channel.user_role == 'OWNER' && !channel.isDirect">
					<p class="title" v-on:click="expandInfoSection">
						Type ({{ channel.type }})
						<i class="arrow fas fa-chevron-left"></i>
					</p>
					<div class="content">
						<div class="switch_container">
							Public
							<label class="switch">
								<input type="checkbox" id="change_type_input" :checked="channel.type == 'public'" @change="changeChannelType">
								<span class="slider round"></span>
							</label>
						</div>
					</div>
				</section>
				<section>
					<p class="title" v-on:click="expandInfoSection">
						Members
						<i class="arrow fas fa-chevron-left"></i>
					</p>
					<div class="content">
						<div class="flex j-sb member" v-for="member in channel.members" v-bind:key="member.id">
							<p>
								<router-link :to="'/user/' + member.id"> {{ member.displayname }}</router-link>
							</p>
							<UserStatus v-if="member.id !== user_id" :status="member.status" :friendId="member.id" :userId="user_id"/>
							<div v-if="!channel.isDirect && member.id !== user_id" class="action_button_container">
								<p v-if="member.isMuted == false" class="fas fa-volume-mute mute_button action_button" v-on:click="muteMember(member.username)"></p>
								<p v-else class="fas fa-volume-mute unmute_button action_button" v-on:click="unmuteMember(member.username)"></p>
								<p v-if="member.isBanned == false" class="fas fa-sign-out-alt ban_button action_button" v-on:click="banMember(member.username)"></p>
								<p v-else class="fas fa-sign-out-alt unban_button action_button" v-on:click="unbanMember(member.username)"></p>
								<p v-if="!member.isAdmin" class="fas fa-user-shield set_admin_button action_button" v-on:click="addAdmin(member.username)"></p>
								<p v-if="member.isAdmin" class="fas fa-user-shield delete_admin_button action_button" v-on:click="deleteAdmin(member.username)"></p>
								<p v-if="channel.user_role != 'MEMBER'" class="fas fa-times kick_button action_button" @click="kickMember(member.username)"></p>
							</div>
						</div>
					</div>
				</section>
				<section v-if="channel.user_role == 'OWNER' && !channel.isDirect">
					<p class="title" v-on:click="expandInfoSection">
						Password
						<i class="arrow fas fa-chevron-left"></i>
					</p>
					<div class="content">
						<div class="flex j-sb">
							<label for="active_password">Require password</label>
							<input type="checkbox" v-model="channel.requirePassword" id="active_password" @change="setRequirePassword"/>
						</div>
						<input type="password" id="channel_password" placeholder="Password..." v-on:keyup.enter="updateChannelPassword" v-if="channel.requirePassword"/>
						<button class="save_channel_config_button" v-on:click="updateChannelPassword" v-if="channel.requirePassword">Save</button>
					</div>
				</section>
				<div class="generate_invitation_button" @click="generateInvitation" v-if="!channel.isDirect">
					Get invitation
					<input type="hidden" id="invitation_link_input"/>
				</div>
				<div class="leave_button" @click="leaveChannel">
					Leave {{ channel.name }}
				</div>
			</div>
			<div class="input_popup" id="add_member_popup" v-if="mode == 'add_member'">
				<input type="text" placeholder="Member's username" id="add_member_input" @keypress.enter="addMember"/>
				<button id="add_member" @click="addMember">
					<i class="fas fa-arrow-right"></i>
				</button>
			</div>
			<div class="input_popup" id="add_admin_popup" v-if="mode == 'add_admin'">
				<input type="text" placeholder="New admin's username" id="add_admin_input" @keypress.enter="addAdmin"/>
				<button id="add_admin" @click="addAdmin">
					<i class="fas fa-arrow-right"></i>
				</button>
			</div>
			<div class="input_popup" id="authentify_user" v-if="mode == 'authentify_user_in_channel'">
				<input type="password" placeholder="Channel's password" id="channel_password" @keypress.enter="authentifyUser"/>
				<button id="authentify_user" @click="authentifyUser">
					<i class="fas fa-arrow-right"></i>
				</button>
			</div>
		</div>
	</div>
</template>

<style>

	h1
	{
		font-weight: normal;
		text-align: center;
	}

	#chat
	{
		background: white;
	}

	.chat_container
	{
		display: flex;
		flex-direction: row;
		justify-content: center;
		width: 100%;
		min-height: 100vh;
		margin: 0 auto;
		position: relative;
	}

	.chat_container .blur
	{
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.5);
		z-index: 9;
	}

	.chat_list
	{
		display: flex;
		position: relative;
		flex-direction: column;
		width: 30%;
		min-height: 100%;
		max-height: 100vh;
		overflow-y: auto;
		background-color: white;
		color: black;
		box-shadow: 5px 0px 13px -4px rgb(0 0 0 / 61%);
		z-index: 1;
	}

	.chat_list .list
	{
		display: flex;
		flex-direction: column;
		overflow-y: auto;
	}

	.chat_list .chat_item
	{
		position: relative;
		padding: 1rem;
		border-bottom: solid 1px rgb(242, 242, 242);
		cursor: pointer;
	}

	.chat_list .chat_item .new_sticker
	{
		position: absolute;
		top: 50%;
		right: 1rem;
		width: 1rem;
		height: 1rem;
		background: #01c4ff;
		border-radius: 100%;
	}

	.chat_list .chat_item.selected
	{
		background: rgb(235, 235, 235);
		color: black;
	}

	.chat_list .chat_item.new:after
	{
		content: ' ';
		position: absolute;
		right: 1rem;
		bottom: 25%;
		transform: translateY(25%);
		width: 1rem;
		height: 1rem;
		border-radius: 1rem;
		background-color: white;
	}

	.chat_list .chat_item .title
	{
		font-size: 1.2rem;
		margin: 0.25rem;
	}

	.chat_list .chat_item .date
	{
		margin: 0.25rem;
		color: rgb(190 190 190);
		font-size: 0.9rem;
		letter-spacing: 0.5px;
	}

	.chat_list .chat_item .last_msg_preview
	{
		padding-left: 1rem;
		font-size: 0.9rem;
		color: grey;
		margin: 0;
	}

	.chat_list #create_channel_button
	{
		position: absolute;
		display: flex;
		align-items: center;
		justify-content: center;
		bottom: 2rem;
		right: 1rem;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 100%;
		background-color: #00c4ff;
		cursor: pointer;
	}

	.chat_list #create_channel_button span
	{
		font-size: 1.5rem;
		color: white;
		transform: translateY(-0.125rem);
	}

	.chat_view
	{
		position: relative;
		color: white;
		background-color: #efefef;
		width: 70%;
		max-height: 100vh;
	}

	.chat_view .no_chat_div
	{
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background: white;
	}

	.chat_view .no_chat_div p
	{
		color: black;
		font-size: 2.5rem;
	}

	.chat_view .no_chat_div button
	{
		font-size: 1.5rem;
		padding: 0.5rem 2rem;
		cursor: pointer;
		background-color: #01c4ff;
		color: white;
		border: solid 1px white;
		transition: all 0.25s;
	}

	.chat_view .no_chat_div button:hover
	{
		background-color: white;
		color: #01c4ff;
		border-color: #01c4ff;
	}

	.chat_view > div
	{
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.chat_view .chat_view_header
	{
		display: flex;
		font-size: 1.25rem;
		text-align: center;
		background-color: white;
		border-bottom: solid 1px rgba(0, 0, 0, 0.15);
		padding: 0 1rem;
	}

	.chat_view #chat_title
	{
		width: calc(100% - 2rem);
		color: black;
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
	}

	.chat_view #chat_info_button
	{
		border: solid 1px black;
		font-size: 1rem;
		color: black;
		padding: 0.5rem 0.75rem;
		border-radius: 100%;
		transition: all 0.25s;
	}
	
	.chat_view #chat_info_button:hover
	{
		background-color: white;
		color: #00a1ff;
		border-color: #00a1ff;
		cursor: pointer;
	}

	.chat_view .view
	{
		display: flex;
		flex-direction: column;
		padding: 0 1rem;
		overflow-y: auto;
	}

	.chat_view .message
	{
		padding: 0.5rem 1rem;
		margin: 0.5rem 0;
		width: fit-content;
		background-color: #0c80ff;
		color: white;
		border-top-right-radius: 1rem;
		border-bottom-right-radius: 1rem;
		border-top-left-radius: 1rem;
		max-width: 50%;
	}

	.chat_view .message .username
	{
		color: white;
		padding-bottom: 0.25rem;
		font-size: 1.1rem;
	}

	.chat_view .message.me
	{
		margin-left: auto;
		border-top-left-radius: 1rem;
		border-bottom-left-radius: 1rem;
		border-bottom-right-radius: 0;
		background-color: #35c85b;
	}

	.chat_view .message p
	{
		margin: 0;
		word-wrap: break-word;
	}

	.chat_view .message_bar
	{
		display: flex;
		width: 100%;
		padding: 0.25rem 1rem;
		margin-top: auto;
	}

	.chat_view #msg_input
	{
		display: block;
		width: 80%;
		margin-left: auto;
		border: solid 1px rgb(122, 122, 122);
		border-top-left-radius: 1rem;
		border-bottom-left-radius: 1rem;
		border-right: none;
		font-size: 1rem;
		outline: none;
		padding: 0.5rem 1.25rem;
	}

	.chat_view #send_button
	{
		appearance: none;
		margin-right: auto;
		border: none;
		background-color: white;
		font-size: 1rem;
		outline: none;
		padding: 0.25rem 1rem;
		border: solid 1px rgb(122, 122, 122);
		border-left: none;
		cursor: pointer;
		border-top-right-radius: 1rem;
		border-bottom-right-radius: 1rem;
		transition: all 0.125s;
	}

	.chat_view #send_button:hover
	{
		background: #39ea88;
		color: white;
	}

	.chat_view #play_button
	{
		font-size: 1.5rem;
		margin: 0rem 1rem;
		margin-right: auto;
		cursor: pointer;
		color: black;
		height: fit-content;
		align-self: center;
	}

	.input_popup
	{
		position: absolute;
		top: 0%;
		left: 50%;
		transform: translateX(-50%);
		width: fit-content;
		display: flex;
		z-index: 999;
	}

	.input_popup input
	{
		display: block;
		width: 30rem;
		font-size: 1.5rem;
		padding: 0.5rem 1rem;
		border: none;
		outline: none;
	}

	.input_popup input::placeholder
	{
		color: #b3b3b3;
	}

	.input_popup button
	{
		position: relative;
		appearance: none;
		width: 5rem;
		border: none;
		color: white;
		background: #00a1ff;
		outline: none;
		cursor: pointer;
	}

	.input_popup button:after
	{
		content: ' ';
		position: absolute;
		top: 50%;
		left: 50%;
		width: 2rem;
		height: 2rem;
		border-radius: 100%;
		transform: translate(-50%, -50%);
		background-color: white;
		z-index: 1;
		transition: all 0.25s ease-out;
	}

	.input_popup button:hover:after
	{
		width: 100%;
		height: 100%;
		border-radius: 0px;
	}

	.input_popup button i
	{
		position: relative;
		font-size: 1.25rem;
		color: #00a1ff;
		z-index: 9;
	}

	.channel_info_container
	{
		position: absolute;
		overflow-y: auto;
		width: 20rem;
		max-width: 80%;
		height: 100%;
		right: 0;
		padding: 1rem;
		z-index: 999;
		background-color: white;
		transform: translateX(100%);
		animation: show_info_div 0.25s ease-out forwards;
	}

	.channel_info_container > p
	{
		font-size: 1.25rem;
		text-align: center;
	}

	.channel_info_container section
	{
		display: flex;
		flex-direction: column;
		border-bottom: solid 1px #e2e2e2;
		margin: 1rem 0;
	}

	.channel_info_container section .title
	{
		display: flex;
		justify-content: space-between;
		cursor: pointer;
		margin: 1rem 0;
	}

	.channel_info_container section .content
	{
		display: flex;
		flex-direction: column;
		padding-left: 1rem;
		max-height: 0;
		overflow: auto;
		transition: max-height 0.25s;
	}

	.channel_info_container section.active .content
	{
		max-height: 15rem;
		padding-bottom: 1rem;
	}

	.channel_info_container section .arrow
	{
		transition: 0.25s;
	}

	.channel_info_container section.active .arrow
	{
		transform: rotateZ(-90deg);
	}

	.channel_info_container #add_member_button
	{
		color: #00a1ff;
		text-align: center;
		cursor: pointer;
	}

	.channel_info_container .save_channel_config_button
	{
		background-color: #00a1ff;
		color: white;
		font-size: 1rem;
		border: solid 1px white;
		padding: 0.25rem 1rem;
		width: 100%;
		margin-top: 0.5rem;
		cursor: pointer;
		transition: all 0.25s;
	}

	.channel_info_container .save_channel_config_button:hover
	{
		background-color: white;
		color: #00a1ff;
		border-color: #00a1ff;
	}

	.channel_info_container #channel_password
	{
		margin: 0.5rem 0;
	}

	.action_button_container
	{
		display: flex;
		align-items: center;
	}

	.channel_info_container .action_button
	{
		margin: 0.5rem 0;
		padding: 0.5rem 0.5rem;
		cursor: pointer;
		font-size: 1rem;
	}

	.channel_info_container .action_button.unmute_button,
	.channel_info_container .action_button.unban_button,
	.channel_info_container .action_button.kick_button
	{
		color: red;
	}

	.delete_admin_button
	{
		color: rgb(0, 110, 255);
	}

	.leave_button
	{
		width: 100%;
		background-color: red;
		color: white;
		padding: 0.5rem 1rem;
		text-align: center;
		cursor: pointer;
		border: solid 1px transparent;
		transition: all 0.25s;
	}

	.leave_button:hover
	{
		background-color: transparent;
		color: red;
		border-color: red;
	}

	.toggle_chat_list_button
	{
		display: none;
	}

	@keyframes show_info_div
	{
		from
		{
			transform: translateX(100%);
		}
		to
		{
			transform: translateX(0);
		}
	}

	@media all and (max-width: 500px)
	{
		.chat_list
		{
			position: absolute;
			top: 0;
			left: 0;
			transform: translateX(-100%);
			transition: all 0.25s ease-out;
		}

		.chat_view
		{
			width: 100%;
		}

		.toggle_chat_list_button
		{
			display: flex;
			flex-direction: column;
			justify-content: center;
			cursor: pointer;
		}

		.toggle_chat_list_button span
		{
			width: 2rem;
			height: 0.125rem;
			background-color: black;
			margin: 0.2rem
		}

		.chat_list.active
		{
			z-index: 99;
			transform: translateX(0);
			width: 80%;
		}

		.chat_container .blur
		{
			position: absolute;
			top: 0;
			left: 0;
		}

		.input_popup input
		{
			width: 100%;
		}
	}

	.switch {
	position: relative;
	display: inline-block;
	width: 3rem;
	height: 1.5rem;
	}

	.switch input { 
	opacity: 0;
	width: 0;
	height: 0;
	}

	.slider {
	position: absolute;
	cursor: pointer;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: #ccc;
	-webkit-transition: .4s;
	transition: .4s;
	}

	.slider:before {
    position: absolute;
    content: "";
    height: 1.25rem;
    width: 1.25rem;
    left: 0.125rem;
    bottom: 0.125rem;
    background-color: white;
    transition: .4s;
	}

	input:checked + .slider {
	background-color: #2196F3;
	}

	input:focus + .slider {
	box-shadow: 0 0 1px #2196F3;
	}

	input:checked + .slider:before {
	-webkit-transform: translateX(1.5rem);
	-ms-transform: translateX(1.5rem);
	transform: translateX(1.5rem);
	}

	/* Rounded sliders */
	.slider.round {
	border-radius: 34px;
	}

	.slider.round:before {
	border-radius: 50%;
	}

	.switch_container
	{
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
	}

	.generate_invitation_button
	{
		width: 100%;
		background-color: #00a1ff;
		color: white;
		padding: 0.5rem 1rem;
		text-align: center;
		cursor: pointer;
		margin: 1rem 0;
		border: solid 1px transparent;
		transition: all 0.25s;
	}

	.generate_invitation_button:hover
	{
		background-color: transparent;
		color: #00a1ff;
		border-color: #00a1ff;
	}

	.m0
	{
		margin: 0;
	}

	.channels_filter_container
	{
		margin: 1rem 0;
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
	}

	.channel_filter
	{
		padding: 0.25rem 1rem;
		border: solid 1px #01c4ff;
		cursor: pointer;
	}

	.channel_filter.selected
	{
		background: #01c4ff;
		color: white;
	}

	.loading_icon
	{
		max-width: 100%;
		width: 50%;
		justify-self: center;
		align-self: center;
	}

	.loading_icon img
	{
		max-width: 100%;
	}

</style>
