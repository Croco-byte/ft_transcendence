<template>
	<div id="yourFriends">
		<h2 style="text-align: center;">Your friends</h2>
		<div v-if="friends.length > 0">
			<ul>
				<li v-for="friend in friends" :key="friend.id">
					Friend: <router-link v-bind:to="'/user/' + friend.id">{{ friend.displayName }}</router-link>&nbsp;&nbsp;&nbsp;&nbsp;<button v-on:click="unfriendUser(friend.id)">Unfriend</button>
					<UserStatus :status="friend.status"/>
				</li>
			</ul>
		<div id="paginationMenu" v-if="friends.length > 0">
			<p style="display: flex; justify-content: space-around;">
				<button :disabled="hidePreviousPageButton" v-on:click="getFriends(friendsMeta.currentPage - 1)">Previous</button>
				<span style="display: flex;">&nbsp;&nbsp;&nbsp;&nbsp;<form id="goToFriendsPage"><input name="goToFriendsPageInput" v-model.number="friendsMeta.currentPage" v-on:input="goToFriendsPage" style="width: 30px"></form><span style="padding-top: 5px;">/{{ friendsMeta.totalPages }}</span>&nbsp;&nbsp;&nbsp;&nbsp;</span>
				<button :disabled="hideNextPageButton" v-on:click="getFriends(friendsMeta.currentPage + 1)">Next</button>
			</p>
		</div>
		</div>
		<div v-else>
			<p>No friends found</p>
		</div>
	</div>
</template>

<script lang="ts">

/* This component displays the friends of the current User.
** The list is paginated : the user can click on "Previous" or "Next" to go to change the result page.
** It is also possible to enter a number to go directly to the specified page.
** It also displays the current status of all the friends in the list.
** The displayed users are links leading to their profile pages
*/

import authService from '../services/auth.service';
import UserService from '../services/user.service';
import UserStatus from '../components/UserStatus.vue';
import { FriendStatusChangeData } from '../types/friends.interface';
import { User, UserStatusChangeData } from '../types/user.interface';
import { PaginationMeta} from '../types/pagination.interface';

interface FriendListComponentData
{
	currUserId: number;
	friends: User[];
	friendsMeta: PaginationMeta;
}

export default {
	name: 'FriendList',
	components: {
		UserStatus
	},
	data(): FriendListComponentData {
		return {
			currUserId: 0,
			friends: [],
			friendsMeta: { totalItems: 0, itemCount: 0, itemsPerPage: 0, totalPages: 0, currentPage: 0 },
		}
	},

	/* These computed properties disable the "Previous" button if there is no previous page (we are at page 1, or the page number is invalid). Same for the "Next" button */
	computed: {
		hidePreviousPageButton: function(): boolean {
			if(typeof(this.friendsMeta.currentPage) !== 'number' || this.friendsMeta.currentPage <= 1 || this.friendsMeta.currentPage > this.friendsMeta.totalPages) {
				return true;
			}
			return false;
		},
		hideNextPageButton: function(): boolean {
			if(typeof(this.friendsMeta.currentPage) !== 'number' || this.friendsMeta.currentPage >= this.friendsMeta.totalPages || this.friendsMeta.currentPage < 1) {
				return true;
			}
			return false;
		}
	},
	
	methods: {
	
		/* This method uses the UserService to get the list of the current user's friends, for the specified page (default to 1, does nothing if the page number is invalid).
		** The function retrieves all the accessible informations about the user ; we use it to display his displayName, and status.
		** If there is no more results for the specified page (someone unfriended for example), we display the previous page if there is one.
		*/
		getFriends: function(page = 1): void {
			var ref = this;
			if (ref.friendsMeta.totalPages > 0 && (Number.isNaN(page) || page < 1 || page > this.friendsMeta.totalPages)) return ;
			UserService.getFriends(page).then(
				response => {
					ref.friends = response.data.items;
					ref.friendsMeta = response.data.meta;
					if (ref.friendsMeta.itemCount < 1 && ref.friendsMeta.currentPage > 1) ref.getFriends(ref.friendsMeta.currentPage - 1);
				},
				(error) => { console.log("Couldn't retrieve friends from backend: " + error.message); })
		},

		/* This function allow the user to type a page number to directly go to the specified page, if the number is valid and within the result range */
		goToFriendsPage: function(): void {
			let data: FormData = new FormData(document.getElementById("goToFriendsPage") as HTMLFormElement);
			const destinationPage: number | null = data.get('goToFriendsPageInput') as number | null;
			if (destinationPage !== null && !Number.isNaN(destinationPage) && destinationPage >= 1 && destinationPage <= this.friendsMeta.totalPages) {
				this.getFriends(destinationPage);
			}
		},

		/* This function emits the signal to unfriend a user. Upon reception, the Websocket server will send back a "friendStatusChanged",
		** that will update our friend list (and the one of the other user).
		*/
		unfriendUser: function(friendId: number): void {
			this.$store.state.auth.websockets.friendRequestsSocket.emit('unfriendUser', { friendId, user: null });
		},

		/* This functon is fired upon reception of a "statusChange" signal, which means that a user of our app changed his status.
		** If the user ID of this user corresponds to a friend that we are currently displaying, we update the friend's status accordingly.
		*/
		changeUserStatus: function(data: UserStatusChangeData): void {
			for(var i=0; i < this.friends.length; i++) {
				if (this.friends[i].id == data.userId) {
					this.friends[i].status = data.status;
				}
			}
		},
		/* This functon is fired upon reception of a "friendStatusChanged" signal, which means that a user interacted with a friend request.
		** If the friendrequest is related to our current user, the friend list might have changed ; we update it.
		*/
		changeFriendRequestStatus: function(data: FriendStatusChangeData): void {
			if (data.creatorId == this.currUserId || data.receiverId == this.currUserId) {
				this.getFriends(this.friendsMeta.currentPage);
			}
		}
	},

	created(): void {
		/* Getting the current user ID from the JWT, and the friends of the user */
		this.currUserId = authService.parseJwt().id;
		this.getFriends();
  },

	mounted(): void {
		/* Starting listeners to automatically update the friendlist (status of users and changes in friendship) */
		this.$store.state.auth.websockets.friendRequestsSocket.on('friendStatusChanged', this.changeFriendRequestStatus);
		this.$store.state.auth.websockets.connectionStatusSocket.on('statusChange', this.changeUserStatus);
	},

	beforeUnmount(): void {
		/* Stopping listeners to avoid catching signals after leaving this component */
		this.$store.state.auth.websockets.friendRequestsSocket.off('friendStatusChanged', this.changeFriendRequestStatus);
		this.$store.state.auth.websockets.connectionStatusSocket.off('statusChange', this.changeUserStatus);
	}
}
</script>

<style scoped>
	#yourFriends {
		width: 50%;
		margin: 0 auto;
		border: solid;
	}

	li a {
		text-decoration: underline;
		color: blue;
	}
</style>
