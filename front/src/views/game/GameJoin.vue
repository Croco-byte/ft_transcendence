<template>
	<div class="text">
		<div class="test">
			<p id="msg">Waiting for another player...</p>
		</div>
		<div class="image">
			<img class='gif' src="https://i.pinimg.com/originals/d7/65/ca/d765cadd577d6901922c2bfcd8419015.gif ">
		</div>
	</div>
</template>


<script lang="ts">
import { defineComponent, watch } from 'vue'

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

	mounted()
	{
		console.log('gamejoin mounted');

		if (this.isStarting) 
			this.updateHtmlText('msg', 'Player found! Game will start soon.');

		watch(() => this.isStarting, () => {
			this.updateHtmlText('msg', 'Player found! Game will start soon.');
		})
	},

})
</script>

<style>
.text {
	margin-top: 30%;
	position: relative;
	text-align: center;
	font-size:3vw;
	font-weight: bold;
}

p {
	top: 40%;
}

.test {
	height: 50%;
}


</style>
