<template>
<div class="container">
<div class="website_admin">
    <h1>Website administration</h1>
	<div class="owner">
		<h2>Owner</h2>
		<p><i class="fas fa-crown"></i> <router-link :to="{ name: 'User', params: { id: owner.id }}">{{ owner.displayname }}</router-link></p>
	</div>
	<div class="mods">
		<h2>Moderators</h2>
		<div v-if="moderators.length > 0">
			<div class="mods_items" v-for="(moderator, index) in moderators" :key="moderator.id">
				<div class="mods_avatar">
					<img :src="moderatorsAvatars[index]"/>
				</div>
				<p><router-link :to="{ name: 'User', params: { id: moderator.id }}">{{ moderator.displayname }}</router-link></p>
			</div>
			<div class="paginationMenu">
				<p class="pagination">
					<button class="paginationButtonPrev" :disabled="hideModeratorsPreviousPageButton" v-on:click="getWebsiteModerators(moderatorsMeta.currentPage - 1)">Previous</button>
					<span class="paginationSpan">
						<form id="goToModeratorsPage">
							<input class="goToModeratorsPageInput" name="goToModeratorsPageInput" v-model.number="moderatorsMeta.currentPage" v-on:input="goToModeratorsPage">
						</form>
					</span>
					<span class="paginationSpan"> /{{ moderatorsMeta.totalPages }}</span>
					<button class="paginationButtonNext" :disabled="hideModeratorsNextPageButton" v-on:click="getWebsiteModerators(moderatorsMeta.currentPage + 1)">Next</button>
				</p>
		</div>
		</div>
		<div v-else>
			No moderators yet.
		</div>
	</div>
	<div class="blocked_users">
		<h2>Blocked users</h2>
				<div v-if="blockedUsers.length > 0">
			<div class="blockedUsers_items" v-for="(blockedUser) in blockedUsers" :key="blockedUser.id">
				<p><i class="fas fa-caret-right"></i> <router-link :to="{ name: 'User', params: { id: blockedUser.id }}">{{ blockedUser.displayname }}</router-link></p>
			</div>
			<div class="paginationMenu">
				<p class="pagination">
					<button class="paginationButtonPrev" :disabled="hideBlockedUsersPreviousPageButton" v-on:click="getWebsiteBlockedUsers(blockedUsersMeta.currentPage - 1)">Previous</button>
					<span class="paginationSpan">
						<form id="goToBlockedUsersPage">
							<input class="goToBlockedUsersPageInput" name="goToBlockedUsersPageInput" v-model.number="blockedUsersMeta.currentPage" v-on:input="goToBlockedUsersPage">
						</form>
					</span>
					<span class="paginationSpan"> /{{ blockedUsersMeta.totalPages }}</span>
					<button class="paginationButtonNext" :disabled="hideBlockedUsersNextPageButton" v-on:click="getWebsiteBlockedUsers(blockedUsersMeta.currentPage + 1)">Next</button>
				</p>
		</div>
		</div>
		<div v-else>
			No blocked users.
		</div>
	</div>
</div>
<div class="users_admin">
    <h2>Manage users</h2>
	<div v-if="users.length > 0" class="users_item_container">
		<div class="users_item" v-for="user in users" :key="user.id">
			<div class="displayname">
				<router-link :to="{ name: 'User', params: { id: user.id }}">{{ user.displayname }}</router-link>
			</div>
			<div class="users_buttons">
				<button v-if="user.is_admin !=='moderator' && user.is_admin !== 'owner'" class="make_mod" @click="makeModerator(user.id)">make moderator</button>
				<button v-else-if="user.is_admin === 'moderator'" class="block" @click="deleteModerator(user.id)">delete moderator</button>
				<button v-if="user.is_blocked === false" class="block" @click="blockUser(user.id)">block</button>
				<button v-else class="unblock" @click="unblockUser(user.id)">Unblock</button>
			</div>
		</div>
		<div class="paginationMenu">
				<p class="pagination">
					<button class="paginationButtonPrev" :disabled="hideUsersPreviousPageButton" v-on:click="getUsers(usersMeta.currentPage - 1)">Previous</button>
					<span class="paginationSpan">
						<form id="goToFriendsPage">
							<input class="goToUsersPageInput" name="goToUsersPageInput" v-model.number="usersMeta.currentPage" v-on:input="goToUsersPage">
						</form>
					</span>
					<span class="paginationSpan"> /{{ usersMeta.totalPages }}</span>
					<button class="paginationButtonNext" :disabled="hideUsersNextPageButton" v-on:click="getUsers(usersMeta.currentPage + 1)">Next</button>
				</p>
		</div>

	</div>

</div>
<div class="channels_admin">
	<h2>Manage channels</h2>
	<AdminChannel/>
</div>
</div>
</template>

<script lang="ts">

import { defineComponent } from 'vue';
import { User } from '../types/user.interface';
import { PaginationMeta } from '../types/pagination.interface';
import UserService from '../services/user.service';
import { createToast } from 'mosha-vue-toastify';
import 'mosha-vue-toastify/dist/style.css';
import AdminChannel from '../components/AdminChannel.vue';


interface AdminViewData
{
    owner: User;
    moderators: User[];
	moderatorsMeta: PaginationMeta;
	moderatorsAvatars: string[];
	blockedUsers: User[];
	blockedUsersMeta: PaginationMeta;
    users: User[];
	usersMeta: PaginationMeta;
}

export default defineComponent ({
	name: 'Admin',
	components:
	{
		AdminChannel
	},
	data(): AdminViewData {
		return {
            owner: {id: 0, username: '', displayname: '', status: ''},
            moderators: [],
			moderatorsAvatars: [],
			moderatorsMeta: { totalItems: 0, itemCount: 0, itemsPerPage: 0, totalPages: 0, currentPage: 0 },
			blockedUsers: [],
			blockedUsersMeta: { totalItems: 0, itemCount: 0, itemsPerPage: 0, totalPages: 0, currentPage: 0 },
            users: [],
			usersMeta: { totalItems: 0, itemCount: 0, itemsPerPage: 0, totalPages: 0, currentPage: 0 }
		}
	},

	/* These computed properties disable the "Previous" button if there is no previous page (we are at page 1, or the page number is invalid). Same for the "Next" button */
	computed: {
		hideUsersPreviousPageButton: function(): boolean {
			if(typeof(this.usersMeta.currentPage) !== 'number' || this.usersMeta.currentPage <= 1 || this.usersMeta.currentPage > this.usersMeta.totalPages) {
				return true;
			}
			return false;
		},
		hideUsersNextPageButton: function(): boolean {
			if(typeof(this.usersMeta.currentPage) !== 'number' || this.usersMeta.currentPage >= this.usersMeta.totalPages || this.usersMeta.currentPage < 1) {
				return true;
			}
			return false;
		},

		hideModeratorsPreviousPageButton: function(): boolean {
			if(typeof(this.moderatorsMeta.currentPage) !== 'number' || this.moderatorsMeta.currentPage <= 1 || this.moderatorsMeta.currentPage > this.moderatorsMeta.totalPages) {
				return true;
			}
			return false;
		},
		hideModeratorsNextPageButton: function(): boolean {
			if(typeof(this.moderatorsMeta.currentPage) !== 'number' || this.moderatorsMeta.currentPage >= this.moderatorsMeta.totalPages || this.moderatorsMeta.currentPage < 1) {
				return true;
			}
			return false;
		},

		hideBlockedUsersPreviousPageButton: function(): boolean {
			if(typeof(this.blockedUsersMeta.currentPage) !== 'number' || this.blockedUsersMeta.currentPage <= 1 || this.blockedUsersMeta.currentPage > this.blockedUsersMeta.totalPages) {
				return true;
			}
			return false;
		},
		hideBlockedUsersNextPageButton: function(): boolean {
			if(typeof(this.blockedUsersMeta.currentPage) !== 'number' || this.blockedUsersMeta.currentPage >= this.blockedUsersMeta.totalPages || this.blockedUsersMeta.currentPage < 1) {
				return true;
			}
			return false;
		},
	},

    methods: {
		getUsers: function(page = 1): void {
			var ref = this;
			if (ref.usersMeta.totalPages > 0 && (Number.isNaN(page) || page < 1 || page > this.usersMeta.totalPages)) return ;
			UserService.searchUser(null, page).then(
				response => {
					ref.users = response.data.items;
					ref.usersMeta = response.data.meta;
				},
				error => { console.log("Couldn't load users : " + error.message); }
			)
		},

		getWebsiteModerators: function(page = 1): void {
			var ref = this;
			UserService.getWebsiteModerators(page).then(
			response => {
				ref.moderators = response.data.items;
				ref.moderatorsMeta = response.data.meta;
				for (let i = 0; i < ref.moderators.length; i++) {
						UserService.getUserAvatar(ref.moderators[i].avatar).then(
							response => {
								const urlCreator = window.URL || window.webkitURL;
								ref.moderatorsAvatars[i] = urlCreator.createObjectURL(response.data);
							},
							() => { ref.moderatorsAvatars[i] = "x"; console.log("Couldn't load user's avatar") })
					}
					if (ref.moderatorsMeta.itemCount < 1 && ref.moderatorsMeta.currentPage > 1) ref.getWebsiteModerators(ref.moderatorsMeta.currentPage - 1);
			},
			error => { console.log("Couldn't get website moderators from backend : " + error.message); }
			)
		},

		getWebsiteBlockedUsers: function(page = 1): void {
			var ref = this;
			UserService.getWebsiteBlockedUsers(page).then(
				response => {
					ref.blockedUsers = response.data.items;
					ref.blockedUsersMeta = response.data.meta;
					if (ref.blockedUsersMeta.itemCount < 1 && ref.blockedUsersMeta.currentPage > 1) ref.getWebsiteBlockedUsers(ref.blockedUsersMeta.currentPage - 1);
				},
				error => { console.log("Couldn't retrieve blocked users from backend : " + error.message); }
			)
		},

		getWebsiteOwner: function(): void {
			UserService.getWebsiteOwner().then(
				response => {
					this.owner = response.data;
				},
				error => { console.log("Couldn't get website owner from backend : " + error.messgae)}
			)
		},

		goToUsersPage: function(): void {
			let data: FormData = new FormData(document.getElementById("goToUsersPage") as HTMLFormElement);
			const destinationPage: number | null = data.get('goToUsersPageInput') as number | null;
			if (destinationPage !== null && !Number.isNaN(destinationPage) && destinationPage >= 1 && destinationPage <= this.usersMeta.totalPages) {
				this.getUsers(destinationPage);
			}
		},

		goToModeratorsPage: function(): void {
			let data: FormData = new FormData(document.getElementById("goToModeratorsPage") as HTMLFormElement);
			const destinationPage: number | null = data.get('goToModeratorsPageInput') as number | null;
			if (destinationPage !== null && !Number.isNaN(destinationPage) && destinationPage >= 1 && destinationPage <= this.moderatorsMeta.totalPages) {
				this.getWebsiteModerators(destinationPage);
			}
		},
		
		goToBlockedUsersPage: function(): void {
			let data: FormData = new FormData(document.getElementById("goToBlockedUsersPage") as HTMLFormElement);
			const destinationPage: number | null = data.get('goToBlockedUsersPageInput') as number | null;
			if (destinationPage !== null && !Number.isNaN(destinationPage) && destinationPage >= 1 && destinationPage <= this.moderatorsMeta.totalPages) {
				this.getWebsiteBlockedUsers(destinationPage);
			}
		},

		makeModerator: function(userId: number): void {
			var ref = this;
			UserService.makeModerator(userId).then(
				() => {
					ref.confirmNotification('Moderator successfully created');
					ref.getWebsiteModerators(ref.moderatorsMeta.currentPage);
					ref.getUsers(ref.usersMeta.currentPage);
				},
				error => {
					if (error.response.data.message) ref.errorNotification(error.response.data.message);
					else ref.errorNotification("Something went wrong");
				}
			)
		},

		deleteModerator: function(userId: number): void {
			var ref = this;
			UserService.makeRegularUser(userId).then(
				() => {
					ref.confirmNotification('Moderator successfully deleted');
					ref.getWebsiteModerators(ref.moderatorsMeta.currentPage);
					ref.getUsers(ref.usersMeta.currentPage);
				},
				error => {
					if (error.response.data.message) ref.errorNotification(error.response.data.message);
					else ref.errorNotification("Something went wrong");
				}
			)
		},

		blockUser: function(userId: number): void {
			var ref = this;
			UserService.blockUserFromWebsite(userId).then(
				() => {
					ref.confirmNotification('User successfully blocked');
					ref.getWebsiteBlockedUsers(ref.blockedUsersMeta.currentPage);
					ref.getUsers(ref.usersMeta.currentPage);
				},
				error => {
					if (error.response.data.message) ref.errorNotification(error.response.data.message);
					else ref.errorNotification("Something went wrong");
				}
			)
		},

		unblockUser: function(userId: number): void {
			var ref = this;
			UserService.unblockUserFromWebsite(userId).then(
				() => {
					ref.confirmNotification('User successfully unblocked');
					ref.getWebsiteBlockedUsers(ref.blockedUsersMeta.currentPage);
					ref.getUsers(ref.usersMeta.currentPage);
				},
				error => {
					if (error.response.data.message) ref.errorNotification(error.response.data.message);
					else ref.errorNotification("Something went wrong");
				}
			)
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

    created() {
		this.getWebsiteOwner();
		this.getWebsiteModerators();
		this.getWebsiteBlockedUsers();
		this.getUsers();
	}

})
</script>

<style scoped>

h2
{
	text-align: left;
	font-weight: normal;
	font-size: 1.5rem;
	padding: 0.5rem 1rem;
	margin: 0;
}

.container
{
	background-color: white;
	display: flex;
	flex-wrap: wrap;
	justify-content: space-around;
}

.container > div
{
	margin: 1rem;
}


.owner
{
	text-align: center;
	overflow-y: auto;
}

.mods
{
	overflow-y: auto;
}

.mods div
{
	text-align: center;
}

.mods .mods_items
{
	display: flex;
	flex-wrap: nowrap;
	justify-content: center;
	align-items: center;
	height: 5rem;
	margin: 0.25rem 0;
}

.mods .mods_avatar
{
	overflow: hidden;
}

.mods_avatar img
{
	width: 4rem;
	height: 4rem;
	max-width: 4.5rem;
	max-height: 100%;
	border-radius: 100%;
}

.blocked_users
{
	text-align: center;
}

.users_admin
{
	text-align: center;
}

.channels_admin
{
	text-align: center;
}

.paginationMenu
{
	width: 50%;
	margin: 0 auto;
}

.pagination
{
	display: inline-block;
	height: 3rem;
	width: 100%;
	text-align: center;
}

.paginationButtonPrev
{
	float: left;
	line-height: 1.5rem;
}

.paginationButtonNext
{
	float: right;
	line-height: 1.5rem;
}

.paginationSpan
{
	display: inline-block;
}

.goToUsersPageInput
{
	width: 30px;
}

.goToModeratorsPageInput
{
	width: 30px;
}

.goToBlockedUsersPageInput
{
	width: 30px;
}

.users_item_container
{
	display: flex;
	flex-direction: column;
	overflow-y: auto;
}

.users_item
{
	display: flex;
	flex-wrap: nowrap;
	align-items: center;
	justify-content: space-between;
	height: 5rem;
	border: solid 1px #39D88F;
	background: white;
	margin: 0.25rem 1rem;
}

.users_item > *
{
	margin: 0 1rem;
}

.users_item .displayname
{
	width: 50px;
}

.users_item .users_buttons
{
	display: flex;
	flex-direction: column;
	justify-content: space-between;
}

.make_mod
{
	padding: 0.25rem 1rem;
	background-color: #39d88f;
	color: white;
	border-radius: 2rem;
	cursor: pointer;
	border: solid 1px #39d88f;
	transition: all 0.25s;
}

.make_mod:hover
{
	border-color: #39d88f;
	color: #39d88f;
	background-color: white;
}

.block
{
	margin-top: 5px;
	padding: 0.25rem 1rem;
	background-color: #c40707;
	color: white;
	border-radius: 2rem;
	cursor: pointer;
	border: solid 1px #c40707;
	transition: all 0.25s;
}

.block:hover
{
	border-color: #c40707;
	color: #c40707;
	background-color: white;
}

.unblock
{
	margin-top: 5px;
	padding: 0.25rem 1rem;
	background-color: #39d88f;
	color: white;
	border-radius: 2rem;
	cursor: pointer;
	border: solid 1px #39d88f;
	transition: all 0.25s;
}

.unblock:hover
{
	border-color: #39d88f;
	color: #39d88f;
	background-color: white;
}

</style>
