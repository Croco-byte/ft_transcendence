<template>
	<p>
		<span v-if="status === 'online'" class="green-dot"></span>
		<span v-if="status === 'offline'" class="red-dot"></span>
		<span v-if="status === 'in-game'" class="orange-dot"></span>
		({{ status }})
	</p>
</template>

<script>
	/* Small component that takes 1 property from the parent component, the status of the user. It then displays a green dot if the
	** user is online, a yellow dot if he's in game, and a red dot if he's offline
	*/
	export default {
		name: 'UserStatus',
		props: { status }
	}
</script>

<style scoped>
	.green-dot {
		height: 25px;
		width: 25px;
		background-color: green;
		border-radius: 50%;
		display: inline-block;
		margin-top: 5px;
	}

	.red-dot {
		height: 25px;
		width: 25px;
		background-color: red;
		border-radius: 50%;
		display: inline-block;
		margin-top: 5px;
	}

	.orange-dot {
		height: 25px;
		width: 25px;
		background-color: orange;
		border-radius: 50%;
		display: inline-block;
		margin-top: 5px;
	}
</style>
