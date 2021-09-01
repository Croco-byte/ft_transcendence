<script lang="ts">

/* This component allows to search for users by displayName. If no displayName is provided, all the users are returned.
** The results are displayed paginated, just like the friend list and the friend requests.
** The search is case-insensitive. Typing "a" returns all usernames with a "a" in it. "au" all usernames with "au" in it. Etc...
*/

import { defineComponent } from 'vue'
import UserService from '../services/user.service'
import UserStatus from '../components/UserStatus.vue'
import { PaginationMeta } from '../types/pagination.interface';
import { UserStatusChangeData, User } from '../types/user.interface';

interface UserSearchComponentData
{
	searchResults: User[];
	searchMeta: PaginationMeta;
	searchDisplayName: string | null;
}

export default defineComponent({
	name: "UserSearch",
	components: {
		// UserStatus
	},
	data(): UserSearchComponentData {
		return {
			searchResults: [],
			searchMeta: { totalItems: 0, itemCount: 0, itemsPerPage: 0, totalPages: 0, currentPage: 0 },
			searchDisplayName: ''
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
		/* This function uses the UserService to return the corresponding displayName when the user clicks on "Search". */
		searchUser: function(username): void
		{
			var ref = this;
			this.searchDisplayName = username;
			if (!this.searchDisplayName)
			{
				this.searchDisplayName = '';
				this.searchResults = [];
				return ;
			}
			UserService.searchUser(this.searchDisplayName).then(
				response =>
				{
					ref.searchResults = response.data.items;
					ref.searchMeta = response.data.meta;
				},
				() => { ref.searchDisplayName = ''; console.log("Couldn't get search results from backend") }
			)
		},

		/* This function allow the user to type a page number to directly go to the specified page, if the number is valid and within the result range */
		goToSearchPage: function(): void {
			let data: FormData = new FormData(document.getElementById("goToSearchPage") as HTMLFormElement);
			const destinationPage: number | null = data.get('goToSearchPageInput') as number | null;
			if (destinationPage !== null && !Number.isNaN(destinationPage) && destinationPage >= 1 && destinationPage <= this.searchMeta.totalPages) {
				this.changeSearchPage(this.searchDisplayName, destinationPage);
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
					ref.searchResults = response.data.items;
					ref.searchMeta.currentPage = response.data.meta.currentPage;
				},
				() => { console.log("Failed to change search result page") }
			)
		},

		/* This functon is fired upon reception of a "statusChange" signal, which means that a user of our app changed his status.
		** If the user ID of this user corresponds to a user that we are currently displaying, we update the user's status accordingly.
		*/
		changeUserStatus: function(data: UserStatusChangeData): void {
			for(var i=0; i < this.searchResults.length; i++) {
				if (this.searchResults[i].id == data.userId) {
					this.searchResults[i].status = data.status;
				}
			}
		},

		sendFriendRequest: function(userId): void
		{
			this.$store.state.websockets.friendRequestsSocket.emit('sendFriendRequest', { receiverId: userId, user: null });
		},
	},

	/* Starting then stopping the listeners that handle the status change of displayed users */
	mounted(): void {
		this.$store.state.websockets.connectionStatusSocket.on('statusChange', this.changeUserStatus);
	},

	beforeUnmount(): void {
		this.$store.state.websockets.connectionStatusSocket.off('statusChange', this.changeUserStatus);
	}
})
</script>

<template>
	<div id="searchUser">
		<h2>Search</h2>
		<input type="text" placeholder="Search for a user..." @input="searchUser($event.target.value)"/>
		<div class="friends_item_container">
			<div class="friend_item" v-for="result in searchResults" :key="result.displayName">
				<div class="score">
					187
					<i class="fas fa-trophy"></i>
				</div>
				<div class="image">
					<img :src="$store.state.avatar"/>
				</div>
				<p class="username">
					{{ result.displayName }}
				</p>
				<div class="add_friend_button" @click="sendFriendRequest(result.id)">
					Add
				</div>
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

input
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
	overflow-y: hidden;
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
	width: auto;
	height: auto;
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

</style>
