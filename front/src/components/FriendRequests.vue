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
		// UserStatus
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
		** The function retrieves all the accessible informations about the target user ; we use it to display his displayName, and status.
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
		},
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

<template>
	<div class="friend_request_div">
		<div class="flex j-sb">
			<h2>Requests</h2>
			<div class="buttons_container">
				<div class="selected">Received</div>
				<div>Sent</div>
			</div>
		</div>
		<div class="friends_item_container">
			<div class="friend_item" v-for="friend in 3" :key="friend.id">
				<div class="score">
					187
					<i class="fas fa-trophy"></i>
				</div>
				<div class="image">
					<img :src="$store.state.avatar"/>
				</div>
				<p class="username">
					yel-alou
				</p>
				<div class="flex">
					<div class="refuse_button">
						<i class="fas fa-times"></i>
					</div>
					<div class="accept_button">
						<i class="fas fa-check"></i>
					</div>
				</div>
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

</style>
