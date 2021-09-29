<script lang="ts">

/* This component displays the friends of the current User.
** The list is paginated : the user can click on "Previous" or "Next" to go to change the result page.
** It is also possible to enter a number to go directly to the specified page.
** It also displays the current status of all the friends in the list.
** The displayed users are links leading to their profile pages
*/

import { defineComponent } from 'vue';
import authService from '../services/auth.service';
import UserService from '../services/user.service';
import UserStatus from './UserStatus.vue';
import { FriendStatusChangeData } from '../types/friends.interface';
import { User, UserStatusChangeData } from '../types/user.interface';
import { PaginationMeta} from '../types/pagination.interface';
import { createToast } from 'mosha-vue-toastify';
import 'mosha-vue-toastify/dist/style.css';

interface FriendListComponentData
{
	currUserId: number;
	friends: User[];
	avatars: string[];
	friendsMeta: PaginationMeta;
}

export default defineComponent({
	name: 'FriendList',
	components: {
		UserStatus
	},
	data(): FriendListComponentData {
		return {
			currUserId: 0,
			friends: [],
			avatars: [],
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
		** The function retrieves all the accessible informations about the user ; we use it to display his displayname, and status.
		** If there is no more results for the specified page (someone unfriended for example), we display the previous page if there is one.
		*/
		getFriends: function(page = 1): void {
			var ref = this;
			if (ref.friendsMeta.totalPages > 0 && (Number.isNaN(page) || page < 1 || page > this.friendsMeta.totalPages)) return ;
			UserService.getFriends(page).then(
				response => {
					ref.friends = response.data.items;
					ref.friendsMeta = response.data.meta;
					for (let i = 0; i < ref.friends.length; i++) {
						UserService.getUserAvatar(ref.friends[i].avatar).then(
							response => {
								const urlCreator = window.URL || window.webkitURL;
								ref.avatars[i] = urlCreator.createObjectURL(response.data);
							},
							() => { ref.avatars[i] = "x"; console.log("Couldn't load user's avatar") })
					}
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
			this.$store.state.websockets.friendRequestsSocket.emit('unfriendUser', { friendId, user: null });
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
		},

		confirmFriendRequest: function(data: { type: string, message: string }): void {
			if (data.type === "unfriend") {
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
			if (data.type === "unfriend") {
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
		/* Getting the current user ID from the JWT, and the friends of the user */
		this.currUserId = authService.parseJwt().id;
		this.getFriends();
  },

	mounted(): void {
		/* Starting listeners to automatically update the friendlist (status of users and changes in friendship) */
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
	<div id="yourFriends">
		<h2>Friends</h2>
		<div class="friends_item_container">
			<div class="friend_item" v-for="(friend, index) in friends" :key="friend.id">
				<div class="score">
					{{ friend.score }}
					<i class="fas fa-trophy"></i>
				</div>
				<div class="image">
					<img :src="avatars[index]"/>
				</div>
				<p class="username">
					<router-link :to="{ name: 'User', params: { id: friend.id }}">{{ friend.displayname }}</router-link>
				</p>
				<UserStatus :status="friend.status" :friendId="friend.id" :userId="currUserId"/>
				<button class="unfriend_button" v-on:click="unfriendUser(friend.id)">Unfriend</button>
			</div>
			<div class="paginationMenu" v-if="friends.length > 0">
				<div class="pagination">
					<button class="paginationButtonPrev" :disabled="hidePreviousPageButton" v-on:click="getFriends(friendsMeta.currentPage - 1)">Previous</button>
					<div class="paginationSpan">
						<form id="goToFriendsPage">
							<input class="goToFriendsPageInput" name="goToFriendsPageInput" v-model.number="friendsMeta.currentPage" v-on:input="goToFriendsPage">
						</form>
					</div>
					<p class="paginationSpan"> /{{ friendsMeta.totalPages }}</p>
					<button class="paginationButtonNext" :disabled="hideNextPageButton" v-on:click="getFriends(friendsMeta.currentPage + 1)">Next</button>
				</div>
		</div>
		</div>
	</div>
</template>

<style scoped>

#yourFriends
{
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	/* border: solid 1px rgb(50, 50, 50); */
	padding: 1rem;
	background-color: white;
}

h2
{
	text-align: left;
	font-weight: normal;
	font-size: 1.5rem;
	padding: 0.5rem 1rem;
	margin-top: 0;
}

.paginationMenu
{
	width: 50%;
	margin: 0 auto;
}

.pagination
{
	display: flex;
    align-items: center;
    justify-content: center;
	height: 3rem;
	width: 100%;
	text-align: center;
}

.pagination > *
{
	margin: 0 0.25rem;
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

.goToFriendsPageInput
{
	width: 30px;
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

.friend_item p,
.friend_item .image
{
	margin: 0 0.5rem;
}

.friend_item .watch_button
{
	background: red;
    padding: 0.25rem 1rem;
    border-radius: 5rem;
    color: white;
    cursor: pointer;
}

.friend_item .watch_button svg
{
	width: 1rem;
	height: 1rem;
	color: blue;
	margin-right: 0.25rem;
}

.unfriend_button
{
	padding: 0.25rem 0.5rem;
	background-color: #c40707;
	color: white;
	border-radius: 2rem;
	margin-right: 1rem;
	cursor: pointer;
	border: solid 1px #c40707;
	transition: all 0.25s;
}

.unfriend_button:hover
{
	border-color: #c40707;
	color: #c40707;
	background-color: white;
}

@media screen and (max-width: 850px)
{
	h2
	{
		width: 100%;
		text-align: center;
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

	.paginationMenu
	{
		width: 100%;
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
