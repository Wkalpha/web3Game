<template>
    <button @click="showUserInventory">道具</button>
</template>

<script>

export default {
    name: 'UserInventory',
    props: {
    },
    data() {
        return {
        };
    },
    computed: {
    },
    methods: {
        async showUserInventory() {
            console.log("show user inventory");
        }
    },
};
</script>