<template>
	<div class="text">
		<div class="test">
			<p id="msg">{{ text }}</p>
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
		},
		isPrivate: {
			required: true,
			type: Boolean,
		}
	},

	data()
	{
		return {
			text: "Waiting for another player..."
		}
	},

	methods: {
		updateHtmlText(msg: string)
		{
			this.text = msg;
			// const obj = document.getElementById(id);
			// if (obj)
			// 	obj.innerHTML = msg;	
		}
	},

	mounted()
	{

		if (this.isPrivate)
			this.updateHtmlText('Waiting for your friend to accept the match...');

		if (this.isStarting) {
			this.isPrivate ?	this.updateHtmlText('Player found! Private game will start soon.') :
								this.updateHtmlText('Player found! Game will start soon.');
		}

		watch(() => this.isStarting, () => {
			this.isPrivate ?	this.updateHtmlText('Player found! Private game will start soon.') :
								this.updateHtmlText('Player found! Game will start soon.');
		})
	},

})
</script>

<style>
.text {
	margin-top: 20vh;
	position: relative;
	text-align: center;
	font-size:3vw;
}

#msg {
	letter-spacing: 0.2em;
	font-weight: 700;
}


</style>
