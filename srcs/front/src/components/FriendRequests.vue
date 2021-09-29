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
import { FriendRequest, FriendStatusChangeData } from '../types/friends.interface';
import { PaginationMeta } from '../types/pagination.interface';
import { UserStatusChangeData } from '../types/user.interface';
import { createToast } from 'mosha-vue-toastify';
import 'mosha-vue-toastify/dist/style.css';

interface FriendsRequestComponentData
{
	currUserId: number;
	sentRequests: FriendRequest[];
	avatarsSent: string[];
	sentRequestsMeta: PaginationMeta;
	receivedRequests: FriendRequest[];
	avatarsReceived: string[];
	receivedRequestsMeta: PaginationMeta;
	mode: string;
}

export default defineComponent({
	name: "FriendRequests",
	data(): FriendsRequestComponentData {
		return {
			currUserId: 0,
			sentRequests: [],
			avatarsSent: [],
			sentRequestsMeta: { totalItems: 0, itemCount: 0, itemsPerPage: 0, totalPages: 0, currentPage: 0 },
			receivedRequests: [],
			avatarsReceived: [],
			receivedRequestsMeta: { totalItems: 0, itemCount: 0, itemsPerPage: 0, totalPages: 0, currentPage: 0 },
			mode: 'received',
		}
	},

	computed: {
		/* These computed properties disable the "Previous" button if there is no previous page (we are at page 1, or the page number is invalid). Same for the "Next" button */
		hideSentPreviousPageButton: function(): boolean {
			if(typeof(this.sentRequestsMeta.currentPage) !== 'number' || this.sentRequestsMeta.currentPage <= 1 || this.sentRequestsMeta.currentPage > this.sentRequestsMeta.totalPages) {
				return true;
			}
			return false;
		},
		hideSentNextPageButton: function(): boolean {
			if(typeof(this.sentRequestsMeta.currentPage) !== 'number' || this.sentRequestsMeta.currentPage >= this.sentRequestsMeta.totalPages || this.sentRequestsMeta.currentPage < 1) {
				return true;
			}
			return false;
		},

		hideReceivedPreviousPageButton: function(): boolean {
			if(typeof(this.receivedRequestsMeta.currentPage) !== 'number' || this.receivedRequestsMeta.currentPage <= 1 || this.receivedRequestsMeta.currentPage > this.receivedRequestsMeta.totalPages) {
				return true;
			}
			return false;
		},
		hideReceivedNextPageButton: function(): boolean {
			if(typeof(this.receivedRequestsMeta.currentPage) !== 'number' || this.receivedRequestsMeta.currentPage >= this.receivedRequestsMeta.totalPages || this.receivedRequestsMeta.currentPage < 1) {
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
					for (let i = 0; i < ref.sentRequests.length; i++) {
						UserService.getUserAvatar(ref.sentRequests[i].receiver.avatar).then(
							response => {
								const urlCreator = window.URL || window.webkitURL;
								ref.avatarsSent[i] = urlCreator.createObjectURL(response.data);
							},
							() => { ref.avatarsSent[i] = "x"; console.log("Couldn't load user's avatar") })
						}
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
			for(let i=0; i < this.sentRequests.length; i++) {
				if (this.sentRequests[i].receiver.id == data.userId) {
					this.sentRequests[i].receiver.status = data.status;
				}
			}

			for(let i=0; i < this.receivedRequests.length; i++) {
				if (this.receivedRequests[i].creator.id == data.userId) {
					this.receivedRequests[i].creator.status = data.status;
				}
			}
		},

		/* This functon is fired upon reception of a "friendStatusChange" signal, which means that a user of our app interacted with a friend request.
		** If we were the creator of this request, we update the sent friendrequests list.
		*/
		changeFriendRequestStatus: function(data: FriendStatusChangeData): void {
			if (data.creatorId == this.currUserId)
				this.getFriendRequestsToRecipients(this.sentRequestsMeta.currentPage);
			if (data.receiverId == this.currUserId)
				this.getFriendRequestsFromRecipients(this.receivedRequestsMeta.currentPage);
		},

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
					for (let i = 0; i < ref.receivedRequests.length; i++) {
						UserService.getUserAvatar(ref.receivedRequests[i].creator.avatar).then(
							response => {
								const urlCreator = window.URL || window.webkitURL;
								ref.avatarsReceived[i] = urlCreator.createObjectURL(response.data);
							},
							() => { ref.avatarsReceived[i] = "x"; console.log("Couldn't load user's avatar") })
						}
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

		/**
		 * Remove a friend request
		 */
		cancelFriendRequest: function(currUserId: number, receiverId: number): void {
			this.$store.state.websockets.friendRequestsSocket.emit('cancelFriendRequest', { currUserId, receiverId });
		},

		/**
		 * Change viewed request mode : received or sent
		 */
		changeMode(event, mode)
		{
			let elem = document.getElementById(this.mode + '_button');
			if (elem)
				elem.classList.remove('selected');
			event.currentTarget.classList.add('selected');
			this.mode = mode;
		},

		confirmFriendRequest: function(data: { type: string, message: string }): void {
			if (data.type === "accept" || data.type === "decline" || data.type === "cancel") {
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
			if (data.type === "accept" || data.type === "decline" || data.type === "cancel") {
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
		}
	},

	created(): void {
		/* Getting initial informations */
		this.getFriendRequestsToRecipients();
		this.getFriendRequestsFromRecipients();
		this.currUserId = authService.parseJwt().id;
	},

	mounted(): void
	{
		/* Starting listeners to automatically update users' status and friendrequests */
		this.$store.state.websockets.friendRequestsSocket.on('friendStatusChanged', this.changeFriendRequestStatus);
		this.$store.state.websockets.connectionStatusSocket.on('statusChange', this.changeUserStatus);

		this.$store.state.websockets.friendRequestsSocket.on('friendRequestConfirmation', this.confirmFriendRequest);
		this.$store.state.websockets.friendRequestsSocket.on('friendRequestError', this.errorFriendRequest);
	},

	beforeUnmount(): void {
		/* Stopping listeners to avoid catching signals after leaving this component */
		this.$store.state.websockets.friendRequestsSocket.off('friendStatusChanged', this.changeFriendRequestStatus);
		this.$store.state.websockets.connectionStatusSocket.off('statusChange', this.changeUserStatus);

		this.$store.state.websockets.friendRequestsSocket.off('friendRequestConfirmation', this.confirmFriendRequest);
		this.$store.state.websockets.friendRequestsSocket.off('friendRequestError', this.errorFriendRequest);
	}
})
</script>

<template>
	<div class="friend_request_div">
		<div class="flex-column j-sb">
			<h2>Requests</h2>
			<div class="buttons_container">
				<div class="selected" id="received_button" @click="changeMode($event, 'received')">Received</div>
				<div id="sent_button" @click="changeMode($event, 'sent')">Sent</div>
			</div>
		</div>
		<div class="friends_item_container" v-if="mode == 'received'">
			<div class="friend_item" v-for="(request, index) in receivedRequests" :key="request.id">
				<div class="score">
					{{ request.creator.score }}
					<i class="fas fa-trophy"></i>
				</div>
				<div class="image">
					<img :src="avatarsReceived[index]"/>
				</div>
				<p class="username">
					<router-link :to="{ name: 'User', params: { id: request.creator.id }}">{{ request.creator.displayname }}</router-link>
				</p>
				<div class="flex">
					<div class="refuse_button" @click="declineFriendRequest(request.id)">
						<i class="fas fa-times"></i>
					</div>
					<div class="accept_button" @click="acceptFriendRequest(request.id)">
						<i class="fas fa-check"></i>
					</div>
				</div>
			</div>
			<div id="paginationMenu" v-if="receivedRequests.length > 0">
				<p class="pagination">
					<button class="paginationButtonPrev" :disabled="hideReceivedPreviousPageButton" v-on:click="getFriendRequestsFromRecipients(receivedRequestsMeta.currentPage - 1)">Previous</button>
					<span class="paginationSpan">
						<form id="goToReceivedRequestsPage">
							<input class="goToRequestsPageInput" name="goToReceivedRequestsPageInput" v-model.number="receivedRequestsMeta.currentPage" v-on:input="goToReceivedRequestsPage">
						</form>
					</span>
					<span class="paginationSpan"> /{{ receivedRequestsMeta.totalPages }}</span>
					<button class="paginationButtonNext" :disabled="hideReceivedNextPageButton" v-on:click="getFriendRequestsFromRecipients(receivedRequestsMeta.currentPage + 1)">Next</button>
				</p>
			</div>
		</div>
		<div class="friends_item_container" v-if="mode == 'sent'">
			<div class="friend_item" v-for="(request, index) in sentRequests" :key="request.id">
				<div class="score">
					{{ request.receiver.score }}
					<i class="fas fa-trophy"></i>
				</div>
				<div class="image">
					<img :src="avatarsSent[index]"/>
				</div>
				<p class="username">
					<router-link :to="{ name: 'User', params: { id: request.receiver.id }}">{{ request.receiver.displayname }}</router-link>
				</p>
				<div class="flex">
					<div class="refuse_button" @click="cancelFriendRequest(request.creator.id, request.receiver.id)">
						<i class="fas fa-times"></i>
					</div>
				</div>
			</div>
			<div id="paginationMenu" v-if="sentRequests.length > 0">
				<p class="pagination">
					<button class="paginationButtonPrev" :disabled="hideSentPreviousPageButton" v-on:click="getFriendRequestsToRecipients(sentRequestsMeta.currentPage - 1)">Previous</button>
					<span class="paginationSpan">
						<form id="goToSentRequestsPage">
							<input class="goToRequestsPageInput" name="goToSentRequestsPageInput" v-model.number="sentRequestsMeta.currentPage" v-on:input="goToSentRequestsPage">
						</form>
					</span>
					<span class="paginationSpan"> /{{ sentRequestsMeta.totalPages }}</span>
					<button class="paginationButtonNext" :disabled="hideSentNextPageButton" v-on:click="getFriendRequestsToRecipients(sentRequestsMeta.currentPage + 1)">Next</button>
				</p>
			</div>
		</div>
	</div>
</template>

<style scoped>

.friend_request_div
{
	display: flex;
	flex-direction: column;
	width: 100%;
	height: 50%;
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

.goToRequestsPageInput
{
	width: 30px;
}

.buttons_container
{
	display: flex;
	flex-wrap: wrap;
	align-self: center;
}

.buttons_container > div
{
	padding: 0.25rem 1rem;
	border: solid 1px #39d88f;
	color: #39d88f;
	font-size: 1rem;
	cursor: pointer;
	transition: all 0.25s;
}

.buttons_container > .selected
{
	background-color: #39d88f;
	color: white;
}

.friends_item_container
{
	display: flex;
	flex-direction: column;
	overflow-y: auto;
	margin: 1rem 0;
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
	width: 5rem;
	height: 5rem;
}

.friend_item img
{
	max-width: 100%;
	max-height: 100%;
	height: 100%;
	border-radius: 100%;
}


.friend_item p
{
	margin: 0 1rem;
}

.accept_button,
.refuse_button
{
	display: flex;
	align-items: center;
	padding: 0.25rem 1rem;
	background-color: transparent;
	color: #39d88f;
	border-radius: 2rem;
	margin-right: 1rem;
	cursor: pointer;
	border: solid 1px #39d88f;
	transition: all 0.25s;
}

.refuse_button
{
	color: red;
	border-color: red;
	margin-right: 0.5rem;
}

.accept_button:hover
{
	color: white;
	background-color: #39d88f;
}

.refuse_button:hover
{
	color: white;
	background-color: red;
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
