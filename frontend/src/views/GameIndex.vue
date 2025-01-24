<template>
    <div id="game-index">
        <DailyQuest />
        <PrizePool />
        <LeaderboardPrizePool />
        <ShowLeaderboard />

    </div>
</template>

<script setup>
import { defineOptions } from 'vue';
import DailyQuest from '@/components/DailyQuest.vue';
import PrizePool from '@/components/PrizePool.vue';
import LeaderboardPrizePool from '@/components/LeaderboardPrizePool.vue';
import ShowLeaderboard from '@/components/ShowLeaderboard.vue';

defineOptions({
    name: 'GameIndex'
});

</script>

<style scoped>
#game-index {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    padding: 20px;
}
</style>