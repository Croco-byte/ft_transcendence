<template>
	<p>
		<span v-if="status === 'online'" class="green-dot"></span>
		<span v-if="status === 'offline'" class="red-dot"></span>
		<span v-if="status === 'in-game'" class="orange-dot"></span>
		({{ status }})
	</p>
</template>

<script>
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
