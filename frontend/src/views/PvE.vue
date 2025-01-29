<template>
    <div class="cyber-container">
        <TimeSniper />
    </div>
</template>

<script setup>
import { defineOptions } from 'vue';
import TimeSniper from '@/components/TimeSniper.vue';

defineOptions({
    name: 'PvE'
});

</script>