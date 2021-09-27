<script lang="ts">

/* This component allows to search for users by displayname. If no displayname is provided, all the users are returned.
** The results are displayed paginated, just like the friend list and the friend requests.
** The search is case-insensitive. Typing "a" returns all usernames with a "a" in it. "au" all usernames with "au" in it. Etc...
*/

import { defineComponent } from 'vue';
import UserService from '../services/user.service';
import { PaginationMeta } from '../types/pagination.interface';
import { User } from '../types/user.interface';
import { createToast } from 'mosha-vue-toastify';
import 'mosha-vue-toastify/dist/style.css';

interface UserSearchComponentData
{
	searchResults: User[];
	avatars: string[];
	searchMeta: PaginationMeta;
	searchdisplayname: string | null;
}

export default defineComponent({
	name: "UserSearch",
	data(): UserSearchComponentData {
		return {
			searchResults: [],
			avatars: [],
			searchMeta: { totalItems: 0, itemCount: 0, itemsPerPage: 0, totalPages: 0, currentPage: 0 },
			searchdisplayname: ''
		}
	},

	computed: {
		
		/* These computed properties disable the "Previous" button if there is no previous page (we are at page 1, or the page number is invalid). Same for the "Next" button */
		hidePreviousPageButton: function(): boolean {
			if(typeof(this.searchMeta.currentPage) !== 'number' || this.searchMeta.currentPage <= 1 || this.searchMeta.currentPage > this.searchMeta.totalPages) {
				return true;
			}
			return false;
		},
		hideNextPageButton: function(): boolean {
			if(typeof(this.searchMeta.currentPage) !== 'number' || this.searchMeta.currentPage >= this.searchMeta.totalPages || this.searchMeta.currentPage < 1) {
				return true;
			}
			return false;
		}
  },

	methods: {
		/* This function uses the UserService to return the corresponding displayname. */
		searchUser: function(username: string): void
		{
			var ref = this;
			this.searchdisplayname = username;
			if (!this.searchdisplayname)
			{
				this.searchdisplayname = '';
				this.searchResults = [];
				return ;
			}
			UserService.searchUser(this.searchdisplayname).then(
				response =>
				{
					ref.searchResults = response.data.items;
					ref.searchMeta = response.data.meta;
					for (let i = 0; i < ref.searchResults.length; i++) {
						UserService.getUserAvatar(ref.searchResults[i].avatar).then(
							response => {
								const urlCreator = window.URL || window.webkitURL;
								ref.avatars[i] = urlCreator.createObjectURL(response.data);
							},
							() => { ref.avatars[i] = "x"; console.log("Couldn't load user's avatar") })
					}
				},
				() => { ref.searchdisplayname = ''; console.log("Couldn't get search results from backend") }
			)
		},

		/* This function allow the user to type a page number to directly go to the specified page, if the number is valid and within the result range */
		goToSearchPage: function(): void {
			let data: FormData = new FormData(document.getElementById("goToSearchPage") as HTMLFormElement);
			const destinationPage: number | null = data.get('goToSearchPageInput') as number | null;
			if (destinationPage !== null && !Number.isNaN(destinationPage) && destinationPage >= 1 && destinationPage <= this.searchMeta.totalPages) {
				this.changeSearchPage(this.searchdisplayname, destinationPage);
			}
		},

		/* This function is fired when the user changes a page (with the Previous or Next button, or specifying a correct page).
		** We're not using the "searchUser" directly because of a bug (or "feature") of the backend, that defines the totalPages
		** by the rest of the users (switching to page 2 reduces the "totalPages" of 1, etc...) when filtering by usernames
		*/
		changeSearchPage: function(username: string | null, page: number): void {
			var ref = this;
			if (Number.isNaN(page) || page < 1 || page > this.searchMeta.totalPages) return ;
			if (username === null) username = '';
			UserService.searchUser(username, page).then(
				response => {
					ref.avatars = [];
					ref.searchResults = response.data.items;
					ref.searchMeta.currentPage = response.data.meta.currentPage;
					for (let i = 0; i < ref.searchResults.length; i++) {
						UserService.getUserAvatar(ref.searchResults[i].avatar).then(
							response => {
								const urlCreator = window.URL || window.webkitURL;
								ref.avatars[i] = urlCreator.createObjectURL(response.data);
							},
							() => { ref.avatars[i] = "x"; console.log("Couldn't load user's avatar") })
					}
				},
				() => { console.log("Failed to change search result page") }
			)
		},

		confirmFriendRequest: function(data: { type: string, message: string }): void {
			if (data.type === "send") {
					createToast({
					title: 'Success',
					description: data.message
				},
				{
					position: 'top-right',
					type: 'success',
					transition: 'slide'
				})
			}
		},

		errorFriendRequest: function(data: { type: string, message: string }): void {
			if (data.type === "send") {
				createToast({
					title: 'Error',
					description: data.message
				},
				{
					position: 'top-right',
					type: 'danger',
					transition: 'slide'
				})
			}
		},
	
		sendFriendRequest: function(userId: number): void
		{
			this.$store.state.websockets.friendRequestsSocket.emit('sendFriendRequest', { receiverId: userId, user: null });
		},
	},

	/* Starting then stopping the listeners that handle the status change of displayed users */
	mounted(): void {
		this.$store.state.websockets.friendRequestsSocket.on('friendRequestConfirmation', this.confirmFriendRequest);
		this.$store.state.websockets.friendRequestsSocket.on('friendRequestError', this.errorFriendRequest);
	},

	beforeUnmount(): void {
		this.$store.state.websockets.friendRequestsSocket.off('friendRequestConfirmation', this.confirmFriendRequest);
		this.$store.state.websockets.friendRequestsSocket.off('friendRequestError', this.errorFriendRequest);
	}
})
</script>

<template>
	<div id="searchUser">
		<h2>Search</h2>
		<input class="searchInput" type="text" placeholder="Search for a user..." @input="searchUser($event.target.value)"/>
		<div class="friends_item_container">
			<div class="friend_item" v-for="(result, index) in searchResults" :key="result.displayname">
				<div class="score">
					{{ result.score }}
					<i class="fas fa-trophy"></i>
				</div>
				<div class="image">
					<img :src="avatars[index]"/>
				</div>
				<p class="username">
					<router-link :to="{ name: 'User', params: { id: result.id }}">{{ result.displayname }}</router-link>
				</p>
				<div class="add_friend_button" @click="sendFriendRequest(result.id)">
					Add
				</div>
			</div>
			<div class="paginationMenu" v-if="searchResults.length > 0">
				<p class="pagination">
					<button class="paginationButtonPrev" :disabled="hidePreviousPageButton" v-on:click="changeSearchPage(searchdisplayname, searchMeta.currentPage - 1)">Previous</button>
					<span class="paginationSpan">
						<form id="goToSearchPage">
							<input class="goToSearchPageInput" name="goToSearchPageInput" v-model.number="searchMeta.currentPage" v-on:input="goToSearchPage">
						</form>
					</span>
					<span class="paginationSpan"> /{{ searchMeta.totalPages }}</span>
					<button class="paginationButtonNext" :disabled="hideNextPageButton" v-on:click="changeSearchPage(searchdisplayname, searchMeta.currentPage + 1)">Next</button>
				</p>
			</div>
		</div>
	</div>
</template>

<style scoped>

#searchUser
{
	width: 100%;
	height: 50%;
	display: flex;
	flex-direction: column;
	padding: 1rem;
	margin: 1rem 0;
	background-color: white;
	/* border: solid 1px black; */
}

h2
{
	text-align: left;
	font-weight: normal;
	font-size: 1.5rem;
	padding: 0.5rem 1rem;
	margin: 0;
}

.paginationMenu
{
	margin: 0 auto;
}

.pagination
{
	display: flex;
    justify-content: center;
    align-items: center;
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

.goToSearchPageInput
{
	width: 30px;
}

.searchInput
{
	padding: 0.5rem 1rem;
	border-radius: 1rem;
	border: solid 1px #959595;
	outline: none;
	margin: 1rem 0;
}

input:placeholder
{
	font-size: 1rem;
}

.friends_item_container
{
	display: flex;
	flex-direction: column;
	overflow-y: auto;
    overflow-x: hidden;
}

.friend_item
{
	display: flex;
	flex-wrap: nowrap;
	align-items: center;
	justify-content: space-between;
	width: 100%;
	height: 5rem;
	border: solid 1px #39D88F;
	background: white;
	margin: 0.25rem 0;
}

.friend_item .username
{
	width: 50px;
}

.friend_item .score
{
	display: flex;
	align-items: center;
	height: 100%;
	color: white;
	padding: 0 1rem;
	font-size: 1.125rem;
	align-self: center;
	background-color: #39D88F;
}

.friend_item .score i
{
	padding: 0 0.25rem;
}

.friend_item .image
{
	display: flex;
	align-items: center;
	padding: 1rem 0;
	overflow: hidden;
}

.friend_item img
{
	width: 4rem;
	height: 4rem;
	max-width: 4.5rem;
	max-height: 100%;
	border-radius: 100%;
}

.friend_item p
{
	margin: 0 1rem;
}

.add_friend_button
{
	padding: 0.25rem 1rem;
	background-color: #39d88f;
	color: white;
	border-radius: 2rem;
	margin-right: 1rem;
	cursor: pointer;
	border: solid 1px #39d88f;
	transition: all 0.25s;
}

.add_friend_button:hover
{
	border-color: #39d88f;
	color: #39d88f;
	background-color: white;
}

@media screen and (max-width: 850px)
{
	h2
	{
		width: 100%;
		text-align: center;
	}

	.buttons_container
	{
		justify-content: center;
	}

	.friend_item
	{
		min-height: 3rem;
		height: 3rem;
	}

	.friend_item img
	{
		width: 2rem;
		height: 2rem;
	}
}

@media screen and (max-width: 500px)
{
	.user_status,
	.friend_item .image
	{
		display: none;
	}
}

</style>
