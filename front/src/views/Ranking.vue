<script lang="ts">

import axios from 'axios';
import Vue, { defineComponent } from 'vue';
import authHeader from '../services/auth-header';


export default defineComponent({
	name: "Ranking",
	data()
	{
		return {
			users: []
		}
	},
	mounted()
	{
		axios.get("http://localhost:3000/ranking", { headers: authHeader() }).then(res =>
		{
			this.users = res.data;
			console.log(this.users);
		});
	}
})

</script>

<template>
	<div class="ranking">
		<h1>Ranking</h1>
		<table>
			<tbody>
				<tr v-for="(user, index) in users" :key="user.id" class="online">
					<td>{{ index }}</td>
					<td>
						{{ $store.avatar }}
						<img :src="$store.avatar"/>
					</td>
					<td>{{ user.username }}</td>
					<td>
						<div class="watch_button">
							<i class="far fa-dot-circle"></i>
							online
						</div>
					</td>
					<td>{{ user.wins }}</td>
					<td>{{ user.loses }}</td>
					<td>{{ user.score }}</td>
				</tr>
			</tbody>
		</table>
	</div>
</template>

<style scoped>

h1
{
	font-weight: normal;
	font-size: 2.5rem;
	text-align: center;
}

table
{
	width: 80%;
	border: solid 1px black;
	margin: 0 auto;
	border-collapse: collapse;
}

tr:nth-child(2n+1)
{
	background-color: #f3f3f3;
}

tr:nth-child(0n+1)
{
	background-color: gold;
}

tr:nth-child(0n+2)
{
	background-color: #e2e2e2;
}

tr:nth-child(0n+3)
{
	background-color: #cc6633;
}

td
{
	padding: 1rem;
	border: none;
}

.watch_button
{
	display: none;
}

.online .watch_button
{
	display: block;
	background: red;
    padding: 0.25rem 1rem;
	padding-left: 0.5rem;
    border-radius: 5rem;
    color: white;
    cursor: pointer;
	width: fit-content;
}

</style>
