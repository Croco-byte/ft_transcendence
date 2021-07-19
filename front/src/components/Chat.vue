<script>

import $ from 'jquery';
import axios from 'axios';
import io from 'socket.io-client';

export default
{
	name: 'Chat',
	components:
	{

	},
	data: function()
	{
		return {
			mode: 'normal',
			socket: null,
			channel:
			{
				id: null,
				name: null,
				members:
				[
					{
						id: 0,
						name: 'Momo'
					},
					{
						id: 1,
						name: 'Sousou'
					},
					{
						id: 2,
						name: 'Adam'
					},
					{
						id: 3,
						name: 'Naofel'
					},
					{
						id: 4,
						name: 'Yass'
					},
				],
				administrators:
				[
					{
						id: 1,
						name: 'Yass'
					},
					{
						id: 2,
						name: 'Naofel'
					}
				],
				requirePassword: false,
				password: '',
				messages: []
			},
			friends:
			[
				{
					id: 0,
					username: "yel-alou"
				},
				{
					id: 1,
					username: "qroland"
				},
				{
					id: 2,
					username: "llefranc"
				},
				{
					id: 3,
					username: "hherin"
				}
			],
			channels:
			[
				{
					id: 1,
					name: "Abcdef",
					date: "05/07/21",
					messages: [],
				},
				{
					id: 2,
					name: "Yassine",
					date: "05/07/21",
					messages: [],
				},
				{
					id: 3,
					name: "Groupe 13",
					date: "05/07/21",
					messages: [],
				},
			]
		};
	},
	computed:
	{
		placeholder: function()
		{
			return 'Dites-bonjour à ' + this.channel.name + '...';
		}
	},
	methods:
	{
		switchChat: function(event)
		{
			let id = $(event.currentTarget).attr('data-id');
			$('.chat_item.selected').removeClass('selected');
			$(event.currentTarget).addClass('selected');

			this.channel.id = this.channels[id].id;
			this.channel.name = this.channels[id].name;
			// this.channel.members = this.channels[id].members;
			this.channel.messages = [];
			$('.view').scrollTop($('.view').scrollHeight);
		},
		

		createChannel: function()
		{
			let name = $('#create_channel_input').val().trim();
			
			if (name && name.length > 0)
			{
				// Axios send to nestjs the name
				this.mode = 'normal';
				alert("Create channel named '" + name + "'");

				axios.post('http://localhost:3000/channels', {name: name})
				.then(function(res)
				{
					console.log(res);
				})
				.catch(error =>
				{
					console.log(error)
				})
			}
		},

		expandInfoSection: function(event)
		{
			$(event.target).closest('section').toggleClass('active');
		},

		changeMode(mode)
		{
			this.mode = mode;
		},

		addMember()
		{
			let username = $('#add_member_input').val();
			alert(username);
			axios.post('http://localhost:3000/channels/' + this.channel.id + '/members', {username: username})
			.then(function(res)
			{
				console.log(res);
			})
			.catch(error =>
			{
				console.log(error)
			})
		},

		addAdmin()
		{
			let username = $('#add_admin_input').val();
			alert(username);
			axios.post('http://localhost:3000/channels/' + this.channel.id + '/admin', {username: username})
			.then(function(res)
			{
				console.log(res);
			})
			.catch(error =>
			{
				console.log(error)
			})
		},

		createMatch()
		{
			if (window.confirm("Do you want to start match with " + this.channel.name + " ?"))
			{
				alert("Start");
			}
		},

		sendMessage()
		{
			let message = $('#msg_input').val();
			this.socket.emit('send_message', {channel: this.channel.id, content: message});
			
			$('#msg_input').val('');
			// axios.post('http://localhost:3000/channels/' + this.channel.id + '/messages', {message: message})
			// .then(function(res)
			// {
			// 	console.log(res);
			// })
			// .catch(error =>
			// {
			// 	console.log(error)
			// })
		},

		muteMember(userID)
		{
			alert(userID);
			axios.post('http://localhost:3000/channels/' + this.channel.id + '/members/mute', {id: userID})
			.then(function(res)
			{
				console.log(res);
			})
			.catch(error =>
			{
				console.log(error)
			})
		},

		banMember(userID)
		{
			alert(userID);
			axios.post('http://localhost:3000/channels/' + this.channel.id + '/members/ban', {id: userID})
			.then(function(res)
			{
				console.log(res);
			})
			.catch(error =>
			{
				console.log(error)
			})
		},

		setRequirePassword()
		{
			let checked = $('#active_password:checked').length != 0;
			if (checked)
				this.channel.requirePassword = true;
			else
				this.channel.requirePassword = false;
			alert("Channel require password : " + (this.channel.requirePassword ? "on" : "off"));
			let url;
			if (!this.channel.requirePassword)
				url = 'http://localhost:3000/channels/' + this.channel.id + '/password';
			axios.delete(url)
			.then(function(res)
			{
				console.log(res);
			})
			.catch(error =>
			{
				console.log(error)
			})
		},

		updateChannelPassword()
		{
			let password = $('#channel_password').val();
			alert("Set channel password to '" + password + "'");
			axios.patch('http://localhost:3000/channels/' + this.channel.id + '/password', {password: password})
			.then(function(res)
			{
				console.log(res);
			})
			.catch(error =>
			{
				console.log(error)
			})
		},

		updateChannelName()
		{
			let new_name = $('#channel_name_input').val();
			alert("Update channel name to '" + new_name + "'");
			axios.patch('http://localhost:3000/channels/' + this.channel.id + '/name', {new_name: new_name})
			.then(function(res)
			{
				console.log(res);
			})
			.catch(error =>
			{
				console.log(error)
			})
		},
	},
	head:
	{
		link:
		[
			{rel: "stylesheet", href: "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css"}
		],
	},
	created()
	{
		this.socket = io("http://127.0.0.1:3001");
	},

	mounted()
	{
		this.socket.on('send_message', (data) =>
		{
			data = JSON.parse(data);
			this.channel.messages.push(data);
		})
	}
}
</script>

<template>
	<div id="chat">
		<div class="chat_container">
			<div class="blur" v-if="mode == 'create_channel' || mode == 'add_member' || mode == 'channel_info' || mode == 'add_admin'" v-on:click="changeMode('normal')"></div>
			<div class="chat_list">
				<div class="list">
					<div @click="switchChat" v-for="(channel, index) in channels" v-bind:key="channel.id" class="chat_item" v-bind:data-id="index">
						<div class="flex j-sb">
							<p class="title">{{ channel.name }}</p>
							<p class="date">{{ channel.date }}</p>
						</div>
						<p class="last_msg_preview">Je suis le message...</p>
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
						<p id="chat_title">{{ channel.name }}</p>
						<p id="chat_info_button" class="fas fa-info" v-on:click="changeMode('channel_info')"></p>
					</div>
					<div class="view">
						<div class="message">
							<p class="author">Tester</p>
							<p class="content">Salut ! Comment tu vas ?</p>
						</div>
						<div class="message me">
							<p class="username">Yassine</p>
							<p class="content">Salut ! ca va super et toi ?</p>
						</div>
						<div class="message">
							<p class="username">Tester</p>
							<p class="content">Ca va merci.</p>
						</div>
						<div class="message">
							<p class="username">Tester</p>
							<p class="content">Bonne journée !</p>
						</div>
						<div class="message me">
							<p class="username">Tester</p>
							<p class="content">Lorem ipsum dolor sit amet consectetur adipisicing elit. Vero dolorum rem placeat, pariatur beatae alias id reiciendis? Cumque incidunt explicabo earum voluptatem temporibus eos! Fugiat, enim officia. Doloribus, adipisci voluptas.</p>
						</div>
						<div v-for="message in channel.messages" v-bind:key="message" class="message">
							<p class="username">{{ message.author }}</p>
							<p class="content">{{ message.content }}</p>
						</div>
					</div>
					<div class="message_bar">
						<input id="msg_input" type="text" v-bind:placeholder="placeholder" v-on:keyup.enter="sendMessage"/>
						<button id="send_button" v-on:click="sendMessage">Envoyer</button>
						<p id="play_button" class="fas fa-table-tennis" v-on:click="createMatch"></p>
					</div>
				</div>
			</div>
			<div class="input_popup" v-if="mode == 'create_channel'">
				<input type="text" placeholder="Channel's name" id="create_channel_input" v-on:keyup.enter="createChannel" autofocus/>
				<button id="create_channel" @click="createChannel">
					<i class="fas fa-arrow-right"></i>
				</button>
			</div>
			<div class="channel_info_container" v-if="mode == 'channel_info'">
				<p>Info</p>
				<section class="active">
					<p class="title" v-on:click="expandInfoSection">
						Name
						<i class="arrow fas fa-chevron-left"></i>
					</p>
					<div class="content">
						<input type="text" id="channel_name_input" v-bind:value="channel.name" v-on:keyup.enter="updateChannelName"/>
						<button class="save_channel_config_button" v-on:click="updateChannelName">Save</button>
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
								{{ member.name }}
							</p>
							<div>
								<p class="fas fa-volume-mute mute_button action_button" v-on:click="muteMember(member.id)"></p>
								<p class="fas fa-sign-out-alt ban_button action_button" v-on:click="banMember(member.id)"></p>
							</div>
						</div>
						<p id="add_member_button" v-on:click="changeMode('add_member')">
							<i class="fas fa-plus-square"></i>
							Add member
						</p>
					</div>
				</section>
				<section>
					<p class="title" v-on:click="expandInfoSection">
						Administrators
						<i class="arrow fas fa-chevron-left"></i>
					</p>
					<div class="content">
						<p v-for="admin in channel.administrators" v-bind:key="admin.id">{{ admin.name }}</p>
						<p id="add_member_button" v-on:click="changeMode('add_admin')">
							<i class="fas fa-plus-square"></i>
							Add an administrator
						</p>
					</div>
				</section>
				<section>
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
			</div>
			<div class="input_popup" id="add_member_popup" v-if="mode == 'add_member'">
				<input type="text" placeholder="Member's username" id="add_member_input"/>
				<button id="add_member" @click="addMember">
					<i class="fas fa-arrow-right"></i>
				</button>
			</div>
			<div class="input_popup" id="add_admin_popup" v-if="mode == 'add_admin'">
				<input type="text" placeholder="New admin's username" id="add_admin_input"/>
				<button id="add_admin" @click="addAdmin">
					<i class="fas fa-arrow-right"></i>
				</button>
			</div>
		</div>
	</div>
</template>

<style>
	@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css');

	h1
	{
		font-weight: normal;
		text-align: center;
	}

	#chat
	{
		height: calc(100vh - 5rem);
	}

	.chat_container
	{
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		margin: 0 auto;
		border: solid 1px black;
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
		height: 100%;
		background-color: white;
		border-right: solid 1px black;
		color: black;
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
		background-color: #e2e2e2;
		width: 70%;
		height: 100%;
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
		padding: 0 0.5rem;
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
		width: 20rem;
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

	.channel_info_container .action_button
	{
		margin: 0.5rem 0;
		padding: 0.5rem 1rem;
		cursor: pointer;
		font-size: 1rem;
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

</style>