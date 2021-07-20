<template>
  <h1>Your account informations</h1>
  <p>{{ content }}</p>
</template>

<script>
import AccountService from '../services/account.service'

export default {
  name: 'Account',
  data() {
	  return {
		  content: ''
	  };
  },
  mounted() {
	  AccountService.getAccountInfo().then(
		  response => {
		  this.content = response.data[0].username;
	  },
	  error => { return ; })
	}

}
</script>
