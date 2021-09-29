<template>
	<div id="sentFriendRequests">
		<h2 style="text-align: center;">Sent friend requests</h2>
		<div v-if="sentRequests.length > 0">
		<ul>
			<li v-for="request in sentRequests" :key="request.id">
				<p>
					To: <router-link v-bind:to="'/user/' + request.receiver.id" style="text-decoration: underlined;">{{ request.receiver.displayname }}</router-link>
				</p>
				<UserStatus :status="request.receiver.status"/>
				<p>
					[Still Pending]
				</p>
				<br/>
			</li>
		</ul>
		<div id="paginationMenu" v-if="sentRequests.length > 0">
			<p style="display: flex; justify-content: space-around;">
				<button :disabled="hidePreviousPageButton" v-on:click="getFriendRequestsToRecipients(sentRequestsMeta.currentPage - 1)">Previous</button>
				<span style="display: flex;">&nbsp;&nbsp;&nbsp;&nbsp;<form id="goToSentRequestsPage"><input name="goToSentRequestsPageInput" v-model.number="sentRequestsMeta.currentPage" v-on:input="goToSentRequestsPage" style="width: 30px"></form><span style="padding-top: 5px;">/{{ sentRequestsMeta.totalPages }}</span>&nbsp;&nbsp;&nbsp;&nbsp;</span>
				<button :disabled="hideNextPageButton" v-on:click="getFriendRequestsToRecipients(sentRequestsMeta.currentPage + 1)">Next</button>
			</p>
		</div>
		</div>
		<div v-else>
			<p>Nothing to show here</p>
		</div>
	</div>
</template>

<script lang="ts">

/* This component displays the sent friend requests from the current User.
** The list is paginated : the user can click on "Previous" or "Next" to go to change the result page.
** It is also possible to enter a number to go directly to the specified page.
** It also displays the current status of all the friends in the list.
** The displayed users are links leading to their profile pages
*/

import { defineComponent } from 'vue'
import authService from '../services/auth.service';
import UserService from '../services/user.service';
import UserStatus from '../components/UserStatus.vue'
import { FriendRequest, FriendStatusChangeData } from '../types/friends.interface';
import { PaginationMeta } from '../types/pagination.interface';
import { UserStatusChangeData } from '../types/user.interface';

interface SentFriendRequestsComponentData
{
	currUserId: number;
	sentRequests: FriendRequest[];
	sentRequestsMeta: PaginationMeta;

}

export default defineComponent({
	name: "SentFriendRequests",
	components: {
		UserStatus
	},
	data(): SentFriendRequestsComponentData {
		return {
			currUserId: 0,
			sentRequests: [],
			sentRequestsMeta: { totalItems: 0, itemCount: 0, itemsPerPage: 0, totalPages: 0, currentPage: 0 },
		}
	},

	computed: {
		/* These computed properties disable the "Previous" button if there is no previous page (we are at page 1, or the page number is invalid). Same for the "Next" button */
		hidePreviousPageButton: function(): boolean {
			if(typeof(this.sentRequestsMeta.currentPage) !== 'number' || this.sentRequestsMeta.currentPage <= 1 || this.sentRequestsMeta.currentPage > this.sentRequestsMeta.totalPages) {
				return true;
			}
			return false;
		},
		hideNextPageButton: function(): boolean {
			if(typeof(this.sentRequestsMeta.currentPage) !== 'number' || this.sentRequestsMeta.currentPage >= this.sentRequestsMeta.totalPages || this.sentRequestsMeta.currentPage < 1) {
				return true;
			}
			return false;
		}
	},

	methods: {
		
		/* This method uses the UserService to get the list of the sent friend requests, for the specified page (default to 1, does nothing if the page number is invalid).
		** The function retrieves all the accessible informations about the target user ; we use it to display his displayname, and status.
		** If there is no more results for the specified page (someone unfriended for example), we display the previous page if there is one.
		*/
		getFriendRequestsToRecipients: function(page = 1): void {
			var ref = this;
			if (this.sentRequestsMeta.totalPages > 0 && (Number.isNaN(page) || page < 1 || page > this.sentRequestsMeta.totalPages)) return ;
			UserService.getFriendRequestsToRecipients(page).then(
				response => {
					ref.sentRequests = response.data.items;
					ref.sentRequestsMeta = response.data.meta;
					if (ref.sentRequestsMeta.itemCount < 1 && ref.sentRequestsMeta.currentPage > 1) ref.getFriendRequestsToRecipients(ref.sentRequestsMeta.currentPage - 1);
				},
				() => { console.log("Couldn't retrieve sent friend requests from backend")})
		},

		/* This function allow the user to type a page number to directly go to the specified page, if the number is valid and within the result range */
		goToSentRequestsPage: function(): void {
			let data: FormData = new FormData(document.getElementById("goToSentRequestsPage") as HTMLFormElement);
			const destinationPage: number | null = data.get('goToSentRequestsPageInput') as number | null;
			if (destinationPage !== null && !Number.isNaN(destinationPage) && destinationPage >= 1 && destinationPage <= this.sentRequestsMeta.totalPages) {
				this.getFriendRequestsToRecipients(destinationPage);
			}
		},

		/* This functon is fired upon reception of a "statusChange" signal, which means that a user of our app changed his status.
		** If the user ID of this user corresponds to a friend that we are currently displaying, we update the friend's status accordingly.
		*/
		changeUserStatus: function(data: UserStatusChangeData): void {
			for(var i=0; i < this.sentRequests.length; i++) {
				if (this.sentRequests[i].receiver.id == data.userId) {
					this.sentRequests[i].receiver.status = data.status;
				}
			}
		},

		/* This functon is fired upon reception of a "friendStatusChange" signal, which means that a user of our app interacted with a friend request.
		** If we were the creator of this request, we update the sent friendrequests list.
		*/
		changeFriendRequestStatus: function(data: FriendStatusChangeData): void {
			if (data.creatorId == this.currUserId) this.getFriendRequestsToRecipients(this.sentRequestsMeta.currentPage);
		}

	},

	created(): void {
		/* Getting initial informations */
		this.getFriendRequestsToRecipients();
		this.currUserId = authService.parseJwt().id;
	},

	mounted(): void {
		/* Starting listeners to automatically update users' status and friendrequests */
		this.$store.state.websockets.friendRequestsSocket.on('friendStatusChanged', this.changeFriendRequestStatus);
		this.$store.state.websockets.connectionStatusSocket.on('statusChange', this.changeUserStatus);
	},

	beforeUnmount(): void {
		/* Stopping listeners to avoid catching signals after leaving this component */
		this.$store.state.websockets.friendRequestsSocket.off('friendStatusChanged', this.changeFriendRequestStatus);
		this.$store.state.websockets.connectionStatusSocket.off('statusChange', this.changeUserStatus);
	}
})
</script>

<style scoped>
	#sentFriendRequests {
		width: 50%;
		margin: 0 auto;
		border: solid;
	}

	li a {
		text-decoration: underline;
		color: blue;
	}
</style>
