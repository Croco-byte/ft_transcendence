<template>
		<div id="searchUser">
		<h2 style="text-align: center;">Search a user</h2>
		<form id="userSearchForm">
			<input type="text" name="searchUserInput" placeholder="Search a user" style="margin-right: 20px; margin-left: 20px;">
			<button type="button" v-on:click="searchUser()">Search</button>
		</form>
		<div v-if="searchResults.length > 0">
		<ul>
			<li v-for="result in searchResults" :key="result.username">
				<router-link v-bind:to="'/user/' + result.id" style="text-decoration: underlined;">{{ result.username }}</router-link>
				<br/><br/>
			</li>
		</ul>
		<div id="paginationMenu" v-if="searchResults.length > 0">
			<p style="display: flex; justify-content: space-around;">
				<button :disabled="hidePreviousPageButton" v-on:click="changeSearchPage(searchUsername, searchMeta.currentPage - 1)">Previous</button>
				<span style="display: flex;">&nbsp;&nbsp;&nbsp;&nbsp;<form id="goToSearchPage"><input name="goToSearchPageInput" v-model.number="searchMeta.currentPage" v-on:input="goToSearchPage" style="width: 30px"></form><span style="padding-top: 5px;">/{{ searchMeta.totalPages }}</span>&nbsp;&nbsp;&nbsp;&nbsp;</span>
				<button :disabled="hideNextPageButton" v-on:click="changeSearchPage(searchUsername, searchMeta.currentPage + 1)">Next</button>
			</p>
		</div>
		</div>
		<div v-else>
			<p>No search results</p>
		</div>
	</div>
</template>

<script>
import UserService from '../services/user.service'

export default {
	name: "UserSearch",
	data() {
		return {
			searchResults: [],
			searchMeta: {},
			searchUsername: ''
		}
	},

  computed: {
	  hidePreviousPageButton: function() {
		  if(typeof(this.searchMeta.currentPage) !== 'number' || this.searchMeta.currentPage <= 1 || this.searchMeta.currentPage > this.searchMeta.totalPages) {
			  return true;
		  }
		  return false;
	  },

	  hideNextPageButton: function() {
		  if(typeof(this.searchMeta.currentPage) !== 'number' || this.searchMeta.currentPage >= this.searchMeta.totalPages || this.searchMeta.currentPage < 1) {
			  return true;
		  }
		  return false;
	  }
  },

  methods: {
	  searchUser: function() {
		  var ref = this;
		  let data = new FormData(document.getElementById("userSearchForm"));
		  this.searchUsername = data.get('searchUserInput');
		  UserService.searchUser(this.searchUsername).then(
			  response => {
				  ref.searchResults = response.data.items;
				  ref.searchMeta = response.data.meta;
				},
			  () => { ref.searchUsername = ''; console.log("Couldn't get search results from backend") }
		  )
	  },

	  goToSearchPage: function() {
		  let data = new FormData(document.getElementById("goToSearchPage"));
		  const destinationPage = data.get('goToSearchPageInput');
		  if (!Number.isNaN(destinationPage) && destinationPage >= 1 && destinationPage <= this.searchMeta.totalPages) {
			  this.changeSearchPage(this.searchUsername, destinationPage);
		  }
	  },

	  changeSearchPage: function(username, page) {
		  var ref = this;
		  if (Number.isNaN(page) || page < 1 || page > this.searchMeta.totalPages) return ;
		  UserService.searchUser(username, page).then(
			  response => {
				  ref.searchResults = response.data.items;
				  ref.searchMeta.currentPage = response.data.meta.currentPage;
			  },
			  () => { console.log("Failed to change search result page") }
		  )
	  },
  }



}
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
</style>
