<script lang="ts">

/* 
** This component displays the match history of the current user, in a paginated way
*/

import { defineComponent } from 'vue';
import { MatchHistory, MatchDisplay } from '../types/game.interface'
import { PaginationMeta } from '@/types/pagination.interface';
import UserService from '../services/user.service';
import AuthService from '../services/auth.service';

interface MatchHistoryComponentData
{
	currUserId: number;
	matches: MatchDisplay[];
	avatars: string[];
	historyMeta: PaginationMeta;
}

export default defineComponent({
	name: 'MatchHistory',
	components: {
	},
	data(): MatchHistoryComponentData {
		return {
			currUserId: 0,
			matches: [],
			avatars: [],
			historyMeta: { totalItems: 0, itemCount: 0, itemsPerPage: 0, totalPages: 0, currentPage: 0 },
		}
	},

	/* These computed properties disable the "Previous" button if there is no previous page (we are at page 1, or the page number is invalid). Same for the "Next" button */
	computed: {
		hidePreviousPageButton: function(): boolean {
			if(typeof(this.historyMeta.currentPage) !== 'number' || this.historyMeta.currentPage <= 1 || this.historyMeta.currentPage > this.historyMeta.totalPages) {
				return true;
			}
			return false;
		},
		hideNextPageButton: function(): boolean {
			if(typeof(this.historyMeta.currentPage) !== 'number' || this.historyMeta.currentPage >= this.historyMeta.totalPages || this.historyMeta.currentPage < 1) {
				return true;
			}
			return false;
		},
	},
	
	methods: {
		showDate: function(rawTime: string): string {
			var formattedTime = rawTime;
			formattedTime = formattedTime.replace('T', ' ');
			formattedTime = formattedTime.split(' ')[0];
			return formattedTime;
		},

		showTime: function(rawTime: string): string {
			var formattedTime = rawTime;
			formattedTime = formattedTime.split('T')[1];
			formattedTime = formattedTime.split('.')[0];
			return formattedTime;
		},

		showWinOrLoose: function(winnerId: number): string {
			if (this.currUserId === winnerId) return "WIN";
			else return "LOOSE";
		},

		showOpponentName: function(match: MatchHistory): string {
			if (match.winner.id === this.currUserId) return match.looser.displayname;
			else return match.winner.displayname;	
		},

		showGameScore: function(match: MatchHistory): string {
			if (match.looserdisconnected && match.winner.id === this.currUserId) return "Opponent disconnected";
			if (match.looserdisconnected && match.winner.id !== this.currUserId) return "You disconnected"
			if (match.winner.id === this.currUserId) return match.winnerScore + " - " + match.looserScore;
			else return match.looserScore + " - " + match.winnerScore;
		},
	
		/* This method uses the UserService to get the list of the current user's friends, for the specified page (default to 1, does nothing if the page number is invalid).
		** The function retrieves all the accessible informations about the user ; we use it to display his displayname, and status.
		** If there is no more results for the specified page (someone unfriended for example), we display the previous page if there is one.
		*/
		getHistory: function(page = 1): void {
			var ref = this;
			if (ref.historyMeta.totalPages > 0 && (Number.isNaN(page) || page < 1 || page > this.historyMeta.totalPages)) return ;
			UserService.getHistory(page).then(
				response => {
					ref.matches = [];
					ref.historyMeta = response.data.meta;
					for (let i = 0; i < response.data.items.length; i++) {
						ref.matches[i] = {};
						ref.matches[i].id = i;
						ref.matches[i].date = this.showDate(response.data.items[i].time);
						ref.matches[i].time = this.showTime(response.data.items[i].time);
						ref.matches[i].winOrLoose = this.showWinOrLoose(response.data.items[i].winner.id);
						ref.matches[i].opponentName = this.showOpponentName(response.data.items[i]);
						ref.matches[i].gameScore = this.showGameScore(response.data.items[i]);
					}
					for (let i = 0; i < response.data.items.length; i++) {
						UserService.getUserAvatar(ref.currUserId === response.data.items[i].winner.id ? response.data.items[i].looser.avatar : response.data.items[i].winner.avatar).then(
							response => {
								const urlCreator = window.URL || window.webkitURL;
								ref.avatars[i] = urlCreator.createObjectURL(response.data);
							},
							() => { ref.avatars[i] = "x"; console.log("Couldn't load user's avatar") })
					}
				},
				(error) => { console.log("Couldn't retrieve match history from backend: " + error.message); })
		},

		/* This function allow the user to type a page number to directly go to the specified page, if the number is valid and within the result range */
		goToHistoryPage: function(): void {
			let data: FormData = new FormData(document.getElementById("goToHistoryPage") as HTMLFormElement);
			const destinationPage: number | null = data.get('goToHistoryPageInput') as number | null;
			if (destinationPage !== null && !Number.isNaN(destinationPage) && destinationPage >= 1 && destinationPage <= this.historyMeta.totalPages) {
				this.getHistory(destinationPage);
			}
		},
	},

	created(): void {
		this.currUserId = Number(AuthService.parseJwt().id);
		this.getHistory();
  },
})
</script>

<template>
	<div id="yourHistory">
		<div class="header">
			<div><i class="fas fa-th-list"></i></div>
			<h2 style="margin-left: 10px;">Match history</h2>
		</div>
		<div class="history_item_container">
			<div class="history_header">
				<div>
					Time
				</div>
				<div style="padding-left: 15px;">
					Result
				</div>
				<div>
					Opponent
				</div>
				<div>
					Score
				</div>
			</div>
			<div v-for="(match, index) in matches" :key="match.id">
				<div class="win_history_item" v-if="match.winOrLoose === 'WIN'">
					<div class="time">
						{{ match.date }}
						<br/>
						{{ match.time }}
					</div>
					<div class="gameResult">
						{{ match.winOrLoose }}
					</div>
					<div class="opponent">
						<div>{{ match.opponentName }}</div>
						<img :src="avatars[index]"/>
					</div>
					<p class="score">
						<i class="fas fa-clipboard-list"></i>
						{{ match.gameScore }}
					</p>
				</div>
				<div class="loose_history_item" v-else>
					<div class="time">
						{{ match.date }}
						<br/>
						{{ match.time }}
					</div>
					<div class="gameResult">
						{{ match.winOrLoose }}
					</div>
					<div class="opponent">
						<div>{{ match.opponentName }}</div>
						<img :src="avatars[index]"/>
					</div>
					<p class="score">
						<i class="fas fa-clipboard-list"></i>
						{{ match.gameScore }}
					</p>
				</div>
			</div>
			<div class="paginationMenu" v-if="matches.length > 0">
				<div class="pagination">
					<button class="paginationButtonPrev" :disabled="hidePreviousPageButton" v-on:click="getHistory(historyMeta.currentPage - 1)">Previous</button>
					<div class="paginationSpan">
						<form id="goToHistoryPage">
							<input class="goToHistoryPageInput" name="goToHistoryPageInput" v-model.number="historyMeta.currentPage" v-on:input="goToHistoryPage">
						</form>
					</div>
					<p class="paginationSpan"> /{{ historyMeta.totalPages }}</p>
					<button class="paginationButtonNext" :disabled="hideNextPageButton" v-on:click="getHistory(historyMeta.currentPage + 1)">Next</button>
				</div>
		</div>
		</div>
	</div>
</template>

<style scoped>

#yourHistory
{
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	/* border: solid 1px rgb(50, 50, 50); */
}

.header
{
	display: flex;
	align-items: center;
	justify-content: center;
	text-align: center;
	width: 100%;
}

.history_header
{
	display: flex;
	flex-wrap: nowrap;
	align-items: center;
	justify-content: space-around;
	width: 100%;
	background: white;
	margin: 0.25rem 0;
	font-weight: bold;
}

.paginationMenu
{
	width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
	margin: 0 auto;
}

.pagination
{
	width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
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
	display: block;
}

.goToHistoryPageInput
{
	width: 30px;
}

.history_item_container
{
	display: flex;
	flex-direction: column;
	overflow-y: auto;
}

.win_history_item
{
	display: flex;
	flex-wrap: nowrap;
	align-items: center;
	justify-content: space-between;
	width: 100%;
	height: 5rem;
	border: solid 1px;
	background: rgba(34, 153, 84, 0.6);
	margin: 0.25rem 0;
}

.loose_history_item
{
	display: flex;
	flex-wrap: nowrap;
	align-items: center;
	justify-content: space-between;
	width: 100%;
	height: 5rem;
	border: solid 1px;
	background: rgba(172, 7, 7, 0.6);
	margin: 0.25rem 0;
}

.time
{
	width: 25%;
	text-align: center;
}

.gameResult
{
	width: 25%;
	text-align: center;
	font-weight: bold;
}

.opponent
{
	width: 25%;
	display: flex;
	align-items: center;
	justify-content: space-evenly;
}

.score
{
	width: 25%;
	text-align: center;
} 


.win_history_item img
{
	width: 4rem;
	height: 4rem;
	max-width: 4.5rem;
	max-height: 100%;
	border-radius: 100%;
}

.loose_history_item img
{
	width: 4rem;
	height: 4rem;
	max-width: 4.5rem;
	max-height: 100%;
	border-radius: 100%;
}

@media screen and (max-width: 550px)
{
	.win_history_item img,
	.loose_history_item img,
	.win_history_item .time,
	.loose_history_item .time
	{
		display: none;
	}
}

</style>
