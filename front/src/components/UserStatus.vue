<template>
	<div class="user_status">
		<p v-if="status === 'online'" class="online">online</p>
		<p v-if="status === 'offline'" class="offline">offline</p>
		<p v-if="status === 'in-queue'" class="in-queue">in queue</p>
		<span v-if="status === 'in-game'">
			<span class="in-game">in game</span>
			<button @click="launchSpectating()">watch</button>
		</span>
		<span v-else-if="status === 'online' && friendId">
			<button @click="launchChallenge()">challenge</button>
		</span>
	</div>
</template>

<script lang="ts">
	/* Small component that takes 1 property from the parent component, the status of the user. It then displays a green dot if the
	** user is online, a yellow dot if he's in game, and a red dot if he's offline
	*/

import { defineComponent } from 'vue'
import router from '../router/index';
import axios from '../axios-instance';
import authHeader from '../services/auth-header';

export default defineComponent({
	name: 'UserStatus',
	props: {
		status: {
			required: true,
			type: String,
		}, 
		friendId: {
			required: false,
			type: Number,
		},
		userId: {
			required: false,
			type: Number,
		}
	},

	data() {
		return {
			serverURL: "http://" + window.location.hostname + ":3000" as string,
		}
	},

	methods: {
		launchSpectating()
		{
			this.$store.state.websockets.connectionStatusSocket.emit('getSpectating', { 
				friendId: this.friendId,
				userId: this.userId 
			});

			this.$store.state.websockets.connectionStatusSocket.on('goToSpectateView',() => {
				router.push(({name: 'Game', params: { 
					RenderGameOption: 'false',
					RenderGamePlay: 'true', 
				}}));
			});
		},

		async launchChallenge()
		{
			
			const newRoomId: string = await axios.post(this.serverURL + '/game/challenge/' + this.userId, {},
				{headers: authHeader()});
				
			this.$store.state.websockets.connectionStatusSocket.emit('challengeSomebody', {
				userId: this.userId,
				friendId: this.friendId,
				newRoomId: newRoomId,
			});
			
			router.push(({name: 'Game', params: { 
				RenderGameOption: 'false',
				RenderGameJoin: 'true',
			}}));
		},
	},
})
</script>

<style scoped>
.online
{
	position: relative;
	padding-left: 1.25rem;
}

.offline
{
	position: relative;
	padding-left: 1.25rem;
}

.in-queue
{
	position: relative;
	padding-left: 1.25rem;
}

.in-game
{
	position: relative;
	padding-left: 1.25rem;
}

.online::before
{
	content: ' ';
	position: absolute;
	top: 50%;
	left: 0;
	transform: translateY(-50%);
	width: 1rem;
	height: 1rem;
	background-color: #00a100;
	border-radius: 100%;
}

.offline::before
{
	content: ' ';
	position: absolute;
	top: 50%;
	left: 0;
	transform: translateY(-50%);
	width: 1rem;
	height: 1rem;
	background-color: #d41717;
	border-radius: 100%;
}

.in-game::before
{
	content: ' ';
	position: absolute;
	top: 50%;
	left: 0;
	transform: translateY(-50%);
	width: 1rem;
	height: 1rem;
	background-color: #fc8600;
	border-radius: 100%;
}

.in-queue::before
{
	content: ' ';
	position: absolute;
	top: 50%;
	left: 0;
	transform: translateY(-50%);
	width: 1rem;
	height: 1rem;
	background-color: #00b4cc;
	border-radius: 100%;
}

button
{
	background: red;
    padding: 0.25rem 1rem;
    border-radius: 5rem;
    color: white;
    cursor: pointer;
}

</style>
