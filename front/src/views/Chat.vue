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
			channelID: null,
			channelName: null,
			messages:
			[	
			
			]
		};
	},
	computed:
	{
		placeholder: function()
		{
			return 'Dites-bonjour à ' + this.channelName;
		}
	},
	methods:
	{
		switchChat: function(event)
		{
			let id = $(event.currentTarget).attr('data-id');
			$('.chat_item.selected').removeClass('selected');
			$(event.currentTarget).addClass('selected');

			this.channelID = id;
			this.channelName = "Yassine";
			if (id % 2 == 0)
				this.messages.push(
				{
					author: "Yass",
					content: "Je suis un msg chargé avec vue.js"
				});
			else
				this.messages = [];
			$('.view').scrollTop($('.view').height());
		}
	}
}
</script>

<template>
	<h1>Chat</h1>
	<div class="chat_container">
		<div class="chat_list">
			<div class="chat_list_header">
				<p>Chat</p>
				<p>+</p>
			</div>
			<div class="list">
				<div @click="switchChat" v-bind:key="n" v-for="n in 10" class="chat_item" v-bind:data-id="n">
					<div class="flex j-sb">
						<p class="title">Yassine</p>
						<p class="date">05/07/21</p>
					</div>
					<p class="last_msg_preview">Je suis le message {{n}}...</p>
				</div>
			</div>
		</div>
		<div class="chat_view">
			<div v-if="channelID">
				<div class="chat_view_header">
					<p>Test</p>
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
	</div>
</template>

<style>
	h1
	{
		font-weight: normal;
		text-align: center;
	}

	.chat_container
	{
		display: flex;
		flex-direction: row;
		width: 80vw;
		margin: 0 auto;
		height: 500px;
		border: solid 1px black;
	}

	.chat_list
	{
		display: flex;
		flex-direction: column;
		width: 30%;
		height: 100%;
		background-color: white;
		border-right: solid 1px black;
		color: black;
	}

	.chat_list_header
	{
		display: flex;
		justify-content: space-between;
		padding: 0 1rem;
		border-bottom: solid 1px black;
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

	.chat_view
	{
		color: black;
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
		background-color: #00c4ff;
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
		margin-top: 0.5rem;
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
		background: rgb(92, 92, 92);
		color: white;
	}
</style>