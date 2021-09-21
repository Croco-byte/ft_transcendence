<template>
	<div id="receivedFriendRequests">
		<h2 style="text-align: center;">Received friend requests</h2>
		<div v-if="receivedRequests.length > 0">
		<ul>
			<li v-for="request in receivedRequests" :key="request.id">
				<p>
					From: <router-link v-bind:to="'/user/' + request.creator.id" style="text-decoration: underlined;">{{ request.creator.displayname }}</router-link>
				</p>
				<UserStatus :status="request.creator.status"/>
				<p>
					<button @click="acceptFriendRequest(request.id)">Accept</button>
					<button @click="declineFriendRequest(request.id)">Decline</button>
				</p>
				<br/>
			</li>
		</ul>
		<div id="paginationMenu" v-if="receivedRequests.length > 0">
			<p style="display: flex; justify-content: space-around;">
				<button :disabled="hidePreviousPageButton" v-on:click="getFriendRequestsFromRecipients(receivedRequestsMeta.currentPage - 1)">Previous</button>
				<span style="display: flex;">&nbsp;&nbsp;&nbsp;&nbsp;<form id="goToReceivedRequestsPage"><input name="goToReceivedRequestsPageInput" v-model.number="receivedRequestsMeta.currentPage" v-on:input="goToReceivedRequestsPage" style="width: 30px"></form><span style="padding-top: 5px;">/{{ receivedRequestsMeta.totalPages }}</span>&nbsp;&nbsp;&nbsp;&nbsp;</span>
				<button :disabled="hideNextPageButton" v-on:click="getFriendRequestsFromRecipients(receivedRequestsMeta.currentPage + 1)">Next</button>
			</p>
		</div>
		</div>
		<div v-else>
			<p>Nothing to show here</p>
		</div>
	</div>
</template>

<script lang="ts">

/* This component displays the received friend requests from the current User.
** The list is paginated : the user can click on "Previous" or "Next" to go to change the result page.
** It is also possible to enter a number to go directly to the specified page.
** It also displays the current status of all the friends in the list.
** A "decline" and "accept" button allows the user to accept or declined the displayed friend request
** The displayed users are links leading to their profile pages
*/

import { defineComponent } from 'vue'
import authService from '../services/auth.service';
import UserService from '../services/user.service';
import UserStatus from '../components/UserStatus.vue'
import { FriendRequest, FriendStatusChangeData } from '../types/friends.interface';
import { PaginationMeta } from '../types/pagination.interface';
import { UserStatusChangeData } from '../types/user.interface';

interface ReceivedFriendRequestsComponentData
{
	currUserId: number;
	receivedRequests: FriendRequest[];
	receivedRequestsMeta: PaginationMeta;
}

export default defineComponent({
	name: "ReceivedFriendRequests",
	components: {
		UserStatus
	},
	data(): ReceivedFriendRequestsComponentData {
		return {
			currUserId: 0,
			receivedRequests: [],
			receivedRequestsMeta: { totalItems: 0, itemCount: 0, itemsPerPage: 0, totalPages: 0, currentPage: 0 },
		}
	},

	computed: {
		/* These computed properties disable the "Previous" button if there is no previous page (we are at page 1, or the page number is invalid). Same for the "Next" button */
		hidePreviousPageButton: function(): boolean {
			if(typeof(this.receivedRequestsMeta.currentPage) !== 'number' || this.receivedRequestsMeta.currentPage <= 1 || this.receivedRequestsMeta.currentPage > this.receivedRequestsMeta.totalPages) {
				return true;
			}
			return false;
		},
		hideNextPageButton: function(): boolean {
			if(typeof(this.receivedRequestsMeta.currentPage) !== 'number' || this.receivedRequestsMeta.currentPage >= this.receivedRequestsMeta.totalPages || this.receivedRequestsMeta.currentPage < 1) {
				return true;
			}
			return false;
		}
	},

	methods: {
		
		/* This method uses the UserService to get the list of the received friend requests, for the specified page (default to 1, does nothing if the page number is invalid).
		** The function retrieves all the accessible informations about the user that sent the request ; we use it to display his displayname, and status.
		** If there is no more results for the specified page (someone unfriended for example), we display the previous page if there is one.
		*/
		getFriendRequestsFromRecipients: function(page = 1): void {
			var ref = this;
			if (this.receivedRequestsMeta.totalPages > 0 && (Number.isNaN(page) || page < 1 || page > this.receivedRequestsMeta.totalPages)) return ;
			UserService.getFriendRequestsFromRecipients(page).then(
				response => {
					ref.receivedRequests = response.data.items;
					ref.receivedRequestsMeta = response.data.meta;
					if (ref.receivedRequestsMeta.itemCount < 1 && ref.receivedRequestsMeta.currentPage > 1) ref.getFriendRequestsFromRecipients(ref.receivedRequestsMeta.currentPage - 1);
				},
				() => { console.log("Couldn't retrieve received friend requests from backend")})
		},

		/* This function allow the user to type a page number to directly go to the specified page, if the number is valid and within the result range */
		goToReceivedRequestsPage: function(): void {
			let data: FormData = new FormData(document.getElementById("goToReceivedRequestsPage") as HTMLFormElement);
			const destinationPage: number | null = data.get('goToReceivedRequestsPageInput') as number | null;
			if (destinationPage !== null && !Number.isNaN(destinationPage) && destinationPage >= 1 && destinationPage <= this.receivedRequestsMeta.totalPages) {
				this.getFriendRequestsFromRecipients(destinationPage);
			}
		},

		/* This function emits the signal that allows to accept the friendRequest. Upon reception of the signal, the WebSocket server will
		** send the "friendStatusChanged" signal, that will be caught by the current user and the friend, allowing them to update their requests / friend list
		*/
		acceptFriendRequest: function(friendRequestId: number): void {
			this.$store.state.websockets.friendRequestsSocket.emit('acceptFriendRequest', { friendRequestId });
		},

		/* This function emits the signal that allows to decline the friendRequest. Upon reception of the signal, the WebSocket server will
		** send the "friendStatusChanged" signal, that will be caught by the current user and the former friend, allowing them to update their requests / friend list
		*/
		declineFriendRequest: function(friendRequestId: number): void {
			this.$store.state.websockets.friendRequestsSocket.emit('declineFriendRequest', { friendRequestId });
		},

		/* This functon is fired upon reception of a "statusChange" signal, which means that a user of our app changed his status.
		** If the user ID of this user corresponds to a friend that we are currently displaying, we update the friend's status accordingly.
		*/
		changeUserStatus: function(data: UserStatusChangeData): void {
			for(var i=0; i < this.receivedRequests.length; i++) {
				if (this.receivedRequests[i].creator.id == data.userId) {
					this.receivedRequests[i].creator.status = data.status;
				}
			}
		},

		/* This functon is fired upon reception of a "friendStatusChange" signal, which means that a user of our app interacted with a friend request.
		** If we were the receiver of this request, we update the received friendrequests list.
		*/
		changeFriendRequestStatus: function(data: FriendStatusChangeData): void {
			if (data.receiverId == this.currUserId) this.getFriendRequestsFromRecipients(this.receivedRequestsMeta.currentPage);
		}
	},

	created(): void {
		/* Getting initial informations */
		this.getFriendRequestsFromRecipients();
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
	#receivedFriendRequests {
		width: 50%;
		margin: 0 auto;
		border: solid;
	}

	li a {
		text-decoration: underline;
		color: blue;
	}
</style>
