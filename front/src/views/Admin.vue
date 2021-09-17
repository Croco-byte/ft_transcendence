<template>
<div style="background-color: white;">
    <h2>Website administration</h2>
    <p>Owner : {{ owner.username }} </p>
    <div v-if="moderators.length > 0" v_for="moderator in moderators" :key="moderator.id">
        <p>Moderator : {{ moderator.username }}</p>
    </div>
    <div v-else>
        No moderators yet.
    </div>
</div>
<div>
    <h2>Manage users</h2>

</div>
</template>

<script lang="ts">

import { defineComponent } from 'vue';
import { User } from '../types/user.interface';
import UserService from '../services/user.service';


interface AdminViewData
{
    owner: User;
    moderators: User[];
    users: User[];
}

export default defineComponent ({
	name: 'Admin',


	data(): AdminViewData {
		return {
            owner: {id: 0, username: '', displayname: '', status: ''},
            moderators: [],
            users: []
		}
	},

    methods: {

    },

    created() {
        UserService.getWebsiteOwner().then(
            response => {
                console.log(response.data);
                this.owner = response.data;
            },
            error => { console.log("Couldn't get website owner from backend : " + error.messgae)}
        )

        UserService.getWebsiteModerators().then(
            response => {
                console.log(response.data);
                this.moderators = response.data;
            },
            error => { console.log("Couldn't get website owner from backend : " + error.messgae)}
        )
        
    }

})
</script>