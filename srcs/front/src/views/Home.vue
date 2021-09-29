<template>
<div class='fullPage'>

	<div class="container1">
		<p class="text1">Welcome to</p>
		<p class="text2">Pong Game</p>
		<div class="auth_container" v-if="$store.state.status.loggedIn === false">
			<div class="auth">
				<div>
					<h2> Login with username and password</h2>
				</div>
				<div class="buttons_container">
					<div class="buttons_wrapper">
						<div class="conf_selected" id="login_button" @click="changeBasicAuthMode($event, 'login')">Login</div>
						<div id="register_button" @click="changeBasicAuthMode($event, 'register')">Register</div>
					</div>
				</div>
				<div class="container1_5" v-if="config_mode === 'register'">
					<div><input type="text" name="registerUsername" v-model="registerInput.username" placeholder="Username" /></div>
					<div><input type="password" name="registerPassword" v-model="registerInput.password" placeholder="Password"/></div>
					<div style="margin-top: 10px;"><button type="button" @click="register()">Register</button></div>
				</div>
				<div class="container1_7" v-if="config_mode === 'login'">
					<div><input type="text" name="loginUsername" v-model="loginInput.username" placeholder="Username" /></div>
					<div><input type="password" name="loginPassword" v-model="loginInput.password" placeholder="Password"/></div>
					<div style="margin-top: 10px;"><button type="button" @click="login()">Login</button></div>
				</div>
			</div>
			<div class="container2">
				<h2>Login with 42</h2>
				<LoggingButton/>
			</div>
		</div>
		<div class="auth_container" v-else>
			<LoggingButton/>
		</div>
		<div class="container3">
			<Leaderboard class="childLeader"/>
		</div>
	</div>
	
</div>
</template>

<style scoped>

.fullPage {
	padding: 2rem 0;
	width: 100%;
	display: block;
	background-color: #E6EFF2;
	z-index: 100;
}

.container1 p {
	text-transform: uppercase;
	display: block;
}

.container1 {
	text-align: center;
	position: relative;
}

.text1 .text2
{
	transform: translate(-50%, -50%);
	width: 100%;
	margin: 0 auto;
}

.text1 {
	color: #73C6B6;
	font-size:3.5em;
	font-weight: 700;
	letter-spacing: 0.1em;
	margin-bottom: 0.2em;
	background: #E6EFF2;
	position: relative;
	animation: textAnim 4s forwards;
}

.text2 {
	font-weight: bold;
	font-size: 1.7em;
	color: #117864;
}

@keyframes textAnim {
	0% {
		color: #E6EFF2;
		margin-bottom: -2em;
	}
	50% {
		letter-spacing: 0.3em;
		margin-bottom: -1rem;
	}
	85% {
		letter-spacing: 0.1em;
		margin-bottom: -1rem;
	}
	
}

.auth_container
{
	display: flex;
	flex-direction: row-reverse;
	flex-wrap: wrap;
	justify-content: center;
	margin-bottom: 30px;
	margin-top: 20px;
}

.auth_container > *
{
	padding: 0 2rem;
}

.auth
{
	display: flex;
	flex-direction: column;
	justify-content: space-around;
	text-align: center;
}

.auth input
{
	margin: 0.25rem 0;
}

.auth button
{
	padding: 0.25rem 2rem;
	border: solid 1px transparent;
	background: #39d88f;
	color: white;
	cursor: pointer;
	transition: all 0.25s;
}

.auth button:hover
{
	background: transparent;
	color: #39d88f;
	border-color: #39d88f;
}

.container2
{
	position: relative;
	margin-top: 2.5em;
	margin-bottom: 2.5em;
}

.container3 {
	width: 50vw;
	margin-top: 2.5em;
	margin: 0 auto;
	padding: 0 2rem;
}

.buttons_container
{
	display: flex;
	justify-content: center;
	margin-bottom: 10px;
}

.buttons_wrapper
{
	display: flex;
	flex-wrap: wrap;
	align-self: center;
}

.buttons_wrapper > div
{
	padding: 0.25rem 1rem;
	border: solid 1px #39d88f;
	color: #39d88f;
	font-size: 1rem;
	cursor: pointer;
	transition: all 0.25s;
}

.buttons_wrapper > .conf_selected
{
	background-color: #39d88f;
	color: white;
}

</style>

<script lang="ts">

import { defineComponent } from 'vue';
import Leaderboard from '../components/Leaderboard.vue';
import LoggingButton from '../components/LoggingButton.vue';
import AuthService from '../services/auth.service';
import { createToast } from 'mosha-vue-toastify';
import 'mosha-vue-toastify/dist/style.css';

interface LoginViewData
{
	registerInput: { username: string, password: string };
	loginInput: { username: string, password: string };
	config_mode: string;
}

export default defineComponent ({
	name: 'Home',


	data(): LoginViewData {
		return {
			registerInput: { username: "", password: "" },
			loginInput: { username: "", password: "" },
			config_mode: "login"
		}
	},

	components: {
		Leaderboard, LoggingButton
	},

	methods: {
		register: function() {
			AuthService.registerUserBasicAuth(this.registerInput.username, this.registerInput.password).then(
				() => {
					this.confirmNotification("User successfully registered");
					this.registerInput.username = "";
					this.registerInput.password = "";
				},
				(error) => {
					this.registerInput.username = "";
					this.registerInput.password = "";
					if (error.response.data.message) this.errorNotification(error.response.data.message);
					else this.errorNotification("Something went wrong");
				}
			)
		},

		login: async function() {
			try {
				const result = await this.$store.dispatch('basicAuthLogin', { username: this.loginInput.username, password: this.loginInput.password });
				this.loginInput.username = "";
				this.loginInput.password = "";
				if (result.twoFARedirect === true) { this.$router.push('/twoFA'); }
				else { this.$store.commit('loginSuccess', result); } 
			} catch(e) {
				this.loginInput.username = "";
				this.loginInput.password = "";
				this.$store.commit('disconnectUser', { message: e.message });
			}
		},

		changeBasicAuthMode(event, mode)
		{
			let elem = document.getElementById(this.config_mode + '_button');
			if (elem)
				elem.classList.remove('conf_selected');
			event.currentTarget.classList.add('conf_selected');
			this.config_mode = mode;
		},

		confirmNotification: function(message: string): void {
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

		errorNotification: function(message: string): void {
			createToast({
				title: 'Error',
				description: message
			},
			{
				position: 'top-right',
				type: 'danger',
				transition: 'slide'
			})
		}
	},
})
</script>
