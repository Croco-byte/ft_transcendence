<script lang="ts">

import { defineComponent } from 'vue';
import UserService from '../services/user.service';
import { LeaderboardUser } from '../types/user.interface';
import { PaginationMeta} from '../types/pagination.interface';


interface LeaderboardComponentData
{
	leaderboardUsers: LeaderboardUser[];
	avatars: string[];
	leaderboardMeta: PaginationMeta;
	rankStart: number;
}

export default defineComponent({
	name: 'Leaderboard',
	components: {
	},
	data(): LeaderboardComponentData {
		return {
			leaderboardUsers: [],
			avatars: [],
			leaderboardMeta: { totalItems: 0, itemCount: 0, itemsPerPage: 0, totalPages: 0, currentPage: 0 },
			rankStart: 1,
		}
	},

	/* These computed properties disable the "Previous" button if there is no previous page (we are at page 1, or the page number is invalid). Same for the "Next" button */
	computed: {
		hidePreviousPageButton: function(): boolean {
			if(typeof(this.leaderboardMeta.currentPage) !== 'number' || this.leaderboardMeta.currentPage <= 1 || this.leaderboardMeta.currentPage > this.leaderboardMeta.totalPages) {
				return true;
			}
			return false;
		},
		hideNextPageButton: function(): boolean {
			if(typeof(this.leaderboardMeta.currentPage) !== 'number' || this.leaderboardMeta.currentPage >= this.leaderboardMeta.totalPages || this.leaderboardMeta.currentPage < 1) {
				return true;
			}
			return false;
		},

	},
	
	methods: {
		/* This method uses the UserService to get the list of the current user's leaderboardUsers, for the specified page (default to 1, does nothing if the page number is invalid).
		** The function retrieves all the accessible informations about the user ; we use it to display his displayName, and status.
		** If there is no more results for the specified page (someone unfriended for example), we display the previous page if there is one.
		*/
		getLeaderboardUsers: function(page = 1): void {
			var ref = this;
			ref.avatars = [];
			if (ref.leaderboardMeta.totalPages > 0 && (Number.isNaN(page) || page < 1 || page > this.leaderboardMeta.totalPages)) return ;
			UserService.getLeaderboardUsers(page).then(
				response => {
					ref.leaderboardUsers = response.data.items;
					ref.leaderboardMeta = response.data.meta;
					for (let i = 0; i < ref.leaderboardUsers.length; i++) {
						UserService.getUserAvatar(ref.leaderboardUsers[i].user.avatar).then(
							response => {
								const urlCreator = window.URL || window.webkitURL;
								ref.avatars[i] = urlCreator.createObjectURL(response.data);
							},
							() => { ref.avatars[i] = "x"; console.log("Couldn't load user's avatar") })
					}
				},
				(error) => { console.log("Couldn't retrieve leaderboardUsers from backend: " + error.message); })
		},

		/* This function allow the user to type a page number to directly go to the specified page, if the number is valid and within the result range */
		goToleaderboardUsersPage: function(): void {
			let data: FormData = new FormData(document.getElementById("goToleaderboardUsersPage") as HTMLFormElement);
			const destinationPage: number | null = data.get('goToleaderboardUsersPageInput') as number | null;
			if (destinationPage !== null && !Number.isNaN(destinationPage) && destinationPage >= 1 && destinationPage <= this.leaderboardMeta.totalPages) {
				this.getLeaderboardUsers(destinationPage);
			}
		},
	},

	created(): void {
		this.getLeaderboardUsers();
  },
})
</script>

<template>
	<div id="leaderboard">
		<div class="leaderboardUsers_item_container">
			<h2>Leaderboard</h2>
			<div class="leaderboard_header">
				<div class="userInfo">
					<div class="rank">
						Rank
					</div>
					<div class="profile">
						Profile
					</div>
					<div class="username">
						Name
					</div>
				</div>
				<div class="stat">
					<div class="score">
						Score
					</div>
					<div class="wins">
						Wins
					</div>
					<div class="loses">
						Loses
					</div>
				</div>
			</div>
			<div class="leaderboard_item" v-for="(leaderboarduser, index) in leaderboardUsers" :key="leaderboarduser.user.id">
				<div class="userInfo"> 
					<div class="rank">
						<p class="rankNumber"> {{ leaderboarduser.rank }} </p>
					</div>
					<div class="image">
						<img :src="avatars[index]"/>
					</div>
					<p class="username">
						<a :href="'/user/' + leaderboarduser.user.id ">{{ leaderboarduser.user.displayName }}</a>
					</p>
				</div>
				<div class="stat">
					<div class="score">
						{{ leaderboarduser.user.score }}
						<i class="fas fa-trophy"></i>
					</div>
					<div class="wins">
						{{ leaderboarduser.user.wins }}
					</div>
					<div class="loses">
						{{ leaderboarduser.user.loses }}
					</div>
				</div>
			</div>
			<div class="paginationMenu" v-if="leaderboardUsers.length > 0">
				<p class="pagination">
					<button class="paginationButtonPrev" :disabled="hidePreviousPageButton" v-on:click="getLeaderboardUsers(leaderboardMeta.currentPage - 1)">Previous</button>
					<span class="paginationSpan">
						<form id="goToleaderboardUsersPage">
							<input class="goToleaderboardUsersPageInput" name="goToleaderboardUsersPageInput" v-model.number="leaderboardMeta.currentPage" v-on:input="goToleaderboardUsersPage">
						</form>
					</span>
					<span class="paginationSpan"> /{{ leaderboardMeta.totalPages }}</span>
					<button class="paginationButtonNext" :disabled="hideNextPageButton" v-on:click="getLeaderboardUsers(leaderboardMeta.currentPage + 1)">Next</button>
				</p>
			</div>
		</div>
	</div>
</template>

<style scoped>

h2
{
	text-align: center;
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

.goToleaderboardUsersPageInput
{
	width: 30px;
}

.leaderboardUsers_item_container
{
	width: 100%;
	display: flex;
	flex-direction: column;
	overflow-y: auto;
}

.leaderboard_header
{
	display: flex;
	flex-wrap: nowrap;
	align-items: center;
	justify-content: space-around;
	width: 100%;
	height: 5rem;
	border: solid 3px #000000;
	background: white;
	margin: 0.25rem 0;
}

.leaderboard_header .rank
{
	font-weight: bold;
}

.leaderboard_header .profile
{
	font-weight: bold;
}

.leaderboard_header .username
{
	font-weight: bold;
}

.leaderboard_header .score
{
	font-weight: bold;
	width: 33%;
	text-align: center;
}

.leaderboard_header .wins
{
	font-weight: bold;
	width: 33%;
	text-align: center;
}

.leaderboard_header .loses
{
	font-weight: bold;
	width: 33%;
	text-align: center;
}

.leaderboard_item
{
	display: flex;
	flex-wrap: nowrap;
	align-items: center;
	justify-content: space-around;
	width: 100%;
	height: 5rem;
	border: solid 1px #39D88F;
	background: white;
	margin: 0.25rem 0;
}

.userInfo
{
	width: 40%;
	display: flex;
	justify-content: space-between;
	align-items: center;
	height: 5rem;
}

.userInfo .username
{
	width: 33%;
}

.stat
{
	display: flex;
	justify-content: space-around;
	flex-wrap: nowrap;
	align-items: center;
	width: 40%;
	height: 5rem;
	margin: 0.25rem 0;
}



.leaderboard_item .score
{
	display: flex;
	justify-content: space-around;
	align-items: center;
	width: 33%;
	height: 100%;
	color: white;
	padding: 0 1rem;
	font-size: 1.125rem;
	align-self: center;
	background-color: #39D88F;
}

.wins
{
	text-align: center;
	width: 33%;

}

.loses
{
	text-align: center;
	width: 33%;

}


.leaderboard_item .score i
{
	padding: 0 0.25rem;
}

.leaderboard_item .image
{
	overflow: hidden;
}

.leaderboard_item img
{
	width: 4rem;
	height: 4rem;
	max-width: 4.5rem;
	max-height: 100%;
	border-radius: 100%;
}

.leaderboard_item p,
.leaderboard_item .image
{
	margin: 0 0.5rem;
}


</style>
