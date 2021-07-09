<script>

import $ from 'jquery';

export default
{
	name: 'Chat',
	components:
	{

	},
	data: function()
	{
		return {
			channel:
			{
				id: null,
				name: null
			},
			messages:
			[	
			
			],
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
					date: "05/07/21"
				},
				{
					id: 2,
					name: "Yassine",
					date: "05/07/21"
				},
				{
					id: 3,
					name: "Groupe 13",
					date: "05/07/21"
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
			if (id % 2 == 0)
				this.messages.push(
				{
					author: "Yass",
					content: "Je suis un msg chargé avec vue.js"
				});
			else
				this.messages = [];
			$('.view').scrollTop($('.view').scrollHeight);
		},

		onCreateChannelButtonClick: function(event)
		{
			console.log('click')
		}
	},
	link: [
      { rel: 'canonical', href: 'http://example.com/#!/contact/', id: 'canonical' },
      { rel: 'author', href: 'author', undo: false }, // undo property - not to remove the element
      { rel: 'icon', href: require('./path/to/icon-16.png'), sizes: '16x16', type: 'image/png' }, 
      // with shorthand
      { r: 'icon', h: 'path/to/icon-32.png', sz: '32x32', t: 'image/png' },
      // ...
    ],
}
</script>

<template>
	<div>
		<div class="blur"></div>
		<div class="chat_container">
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
				<div id="create_channel_button" v-on:click="onCreateChannelButtonClick">
					<span>+</span>
				</div>
			</div>
			<div class="chat_view">
				<div v-if="channel.id">
					<div class="chat_view_header">
						<p>{{ channel.name }}</p>
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
						<div v-for="message in messages" v-bind:key="message" class="message">
							<p class="username">{{ message.author }}</p>
							<p class="content">{{ message.content }}</p>
						</div>
					</div>
					<div class="message_bar">
						<input id="msg_input" type="text" v-bind:placeholder="placeholder"/>
						<button id="send_button">Envoyer</button>
					</div>
				</div>
			</div>
			<div class="popup" id="create_channel_popup">
				<div class="header">
					<p class="title">Create channel</p>
				</div>
				<div class="body">
					<div class="new_channel_name_div">
						<i class="fa-solid fa-magnifying-glass"></i>
						<input type="text" id="channel_name_input">
					</div>
				</div>
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

	.chat_container
	{
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		width: 80vw;
		height: 80vh;
		margin: 0 auto;
		border: solid 1px black;
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
		color: white;
		background-color: #00c4ff;
		width: 70%;
		height: 100%;
	}

	.chat_view > div
	{
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.chat_view .chat_view_header
	{
		font-size: 1.25rem;
		text-align: center;
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
		background-color: white;
		color: dimgrey;
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
		background-color: #39ea88;
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
		padding: 0.25rem 1rem;
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

	.blur
	{
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background-color: rgba(50, 50, 50, 0.55);
		z-index: 99;
	}

	.popup
	{
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 60vw;
		height: 70vh;
		z-index: 999;
		background-color: white;
	}

	.popup .title
	{
		font-size: 1.5rem;
	}

	#create_channel_popup .new_channel_name_div
	{
		display: flex;
	}

	#create_channel_input
	{
		font-size: 1rem;
		height: 1.2rem;
		padding: 0.1rem 0.5rem;
		border: none;
	}

</style>