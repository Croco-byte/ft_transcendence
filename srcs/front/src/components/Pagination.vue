<script lang="ts">
import { defineComponent } from "vue";


export default defineComponent({
	name: 'Pagination',
	props: ['page', 'page_nb', 'prev', 'next'],
	data()
	{
		return {
			currentPage: this.page,
			pageNumber: this.page_nb,
			prevAction: this.prev,
			nextAction: this.next,
		};
	},
	computed:
	{
		hidePreviousPageButton: function(): boolean
		{
			if(typeof(this.currentPage) !== 'number' || this.currentPage <= 1 || this.currentPage > this.pageNumber)
				return true;

			return false;
		},
		hideNextPageButton: function(): boolean
		{
			if(typeof(this.currentPage) !== 'number' || this.currentPage >= this.pageNumber || this.currentPage < 1)			
				return true;

			return false;
		}
	}
})
</script>

<template>
	<div class="pagination">
		<div class="prev_button" @click="prevAction(currentPage - 1)">Prev</div>
		<div class="next_button" @click="nextAction(currentPage + 1)">Next</div>
	</div>
</template>

<style scoped>

.pagination
{
	display: flex;
	justify-content: space-between;
	flex-wrap: nowrap;
	width: 100%;
	padding: 1rem 0;
}

.pagination > div
{
	padding: 0 1rem;
	cursor: pointer;
}

</style>
