<template>
	<div class="text">
		<div class="test">
			<p id="msg">Waiting for another player...</p>
			<div class="loader"></div>
		</div>
	</div>
</template>


<script lang="ts">
import { defineComponent, watch, PropType } from 'vue'

export default defineComponent({

	props: {
		isStarting: {
		required: true,
		type: Boolean,
		}
	},

	methods: {
		updateHtmlText(id: string, msg: string)
		{
			const obj = document.getElementById(id);
			if (obj)
				obj.innerHTML = msg;	
		}
	},

	mounted() {

		if (this.isStarting) 
			this.updateHtmlText('msg', 'Player found! Game will start soon.');

		watch(() => this.isStarting, () => {
			this.updateHtmlText('msg', 'Player found! Game will start soon.');
		})
	},

})
</script>

<style>

html, body {
	height:100vh;
}

.text {
	margin-top: 30%;
	position: relative;
	text-align: center;
	font-family: Verdana, Arial, Helvetica, sans-serif;
	font-size:3vw;
}

p {
	top: 40%;

}

.test {
	height: 50%;
}

.loader {
	position: absolute;
	left: 40%;
	border: 16px solid #f3f3f3; /* Light grey */
	border-top: 16px solid #3498db; /* Blue */
	border-radius: 50%;
	width: 120px;
	height: 120px;
	animation: spin 2s linear infinite;
}

@keyframes spin {
	0% { transform: rotate(0deg); }
	100% { transform: rotate(360deg); }
}

</style>