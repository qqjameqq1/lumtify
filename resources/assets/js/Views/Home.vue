<style></style>

<template>
<div>
    <h1>Welcome to lumtify!</h1>
    <articles v-bind:auth="auth"></articles>
</div>
</template>

<script>
import Articles from './Articles.vue'

export default {
	props: {
        auth: {
            isAuth: false,
            user: {},
            roles: []
        }
    },
	components: {
		Articles
	}
}
</script>