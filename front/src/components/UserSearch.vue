<template>
		<div id="searchUser">
			<h2 style="text-align: center;">Search a user</h2>
			<form id="userSearchForm">
				<input type="text" name="searchUserInput" placeholder="Search a user" style="margin-right: 20px; margin-left: 20px;">
				<button type="button" v-on:click="searchUser()">Search</button>
			</form>
			<div v-if="searchResults.length > 0">
			<ul>
				<li v-for="result in searchResults" :key="result.displayname">
					<router-link v-bind:to="'/user/' + result.id" style="text-decoration: underlined;">{{ result.displayname }}</router-link>
					<br/>
					<UserStatus :status="result.status" />
				</li>
			</ul>
			<div id="paginationMenu" v-if="searchResults.length > 0">
				<p style="display: flex; justify-content: space-around;">
					<button :disabled="hidePreviousPageButton" v-on:click="changeSearchPage(searchdisplayname, searchMeta.currentPage - 1)">Previous</button>
					<span style="display: flex;">&nbsp;&nbsp;&nbsp;&nbsp;<form id="goToSearchPage"><input name="goToSearchPageInput" v-model.number="searchMeta.currentPage" v-on:input="goToSearchPage" style="width: 30px"></form><span style="padding-top: 5px;">/{{ searchMeta.totalPages }}</span>&nbsp;&nbsp;&nbsp;&nbsp;</span>
					<button :disabled="hideNextPageButton" v-on:click="changeSearchPage(searchdisplayname, searchMeta.currentPage + 1)">Next</button>
				</p>
			</div>
		</div>
		<div v-else>
			<p>No search results</p>
		</div>
	</div>
</template>

<script lang="ts">

/* This component allows to search for users by displayname. If no displayname is provided, all the users are returned.
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
	searchdisplayname: string | null;
}

export default defineComponent({
	name: "UserSearch",
	components: {
		UserStatus
	},
	data(): UserSearchComponentData {
		return {
			searchResults: [],
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
		/* This function uses the UserService to return the corresponding displayname when the user clicks on "Search". */
		searchUser: function(): void {
			var ref = this;
			let data: FormData = new FormData(document.getElementById("userSearchForm") as HTMLFormElement);
			this.searchdisplayname = data.get('searchUserInput') as string | null;
			if (this.searchdisplayname === null) this.searchdisplayname = '';
			UserService.searchUser(this.searchdisplayname).then(
				response => {
					ref.searchResults = response.data.items;
					ref.searchMeta = response.data.meta;
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
		}
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

<style scoped>
	#searchUser {
		border: solid;
		width: 50%;
		margin: 0 auto;
	}
	
	li a {
		text-decoration: underline;
		color: blue;
	}

	.green-dot {
		height: 25px;
		width: 25px;
		background-color: green;
		border-radius: 50%;
		display: inline-block;
		margin-top: 5px;
	}

	.red-dot {
		height: 25px;
		width: 25px;
		background-color: red;
		border-radius: 50%;
		display: inline-block;
		margin-top: 5px;
	}

	.orange-dot {
		height: 25px;
		width: 25px;
		background-color: orange;
		border-radius: 50%;
		display: inline-block;
		margin-top: 5px;
	}
</style>
