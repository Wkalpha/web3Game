<template>
    <h3 class="title">📅 每日任務</h3>
    <ul class="quest-list">
        <li v-for="quest in quests" :key="quest.DailyQuestId" class="quest-item">
            <div class="quest-content">
                <span class="quest-name">{{ quest.Name }}</span>
                <span v-if="quest.Progress < quest.Target" class="progress">{{ quest.Progress }}/{{ quest.Target
                    }}</span>
                <button v-if="quest.Progress >= quest.Target && !quest.RewardClaimed"
                    @click="claimReward(quest.DailyQuestId)" class="claim-button">
                    領取 {{ quest.Reward }} TC
                </button>
                <span v-if="quest.RewardClaimed" class="claimed">已領取</span>
            </div>
        </li>
    </ul>
</template>

<script setup>
import axios from 'axios';
import { ref, watch, onMounted } from 'vue';
import { useGameStore } from '@/stores/game';

const gameStore = useGameStore();
const quests = ref([]);
const refreshKey = ref(0);

watch(refreshKey, async () => {
    await fetchUserDailyQuest();
});

onMounted(async () => {
    await fetchUserDailyQuest();
});

const fetchUserDailyQuest = async () => {
    try {
        const response = await axios.post(`${process.env.VUE_APP_API_URL}/daily-quests`, {
            walletAddress: gameStore.walletAddress
        });
        quests.value = response.data;
    } catch (error) {
        console.error("取得每日任務時發生錯誤:", error);
    }
};

const claimReward = async (questId) => {
    try {
        await axios.post(`${process.env.VUE_APP_API_URL}/daily-quests/claim`, {
            walletAddress: gameStore.walletAddress,
            questId
        });
        await fetchUserDailyQuest();
    } catch (error) {
        console.error("領取獎勵時發生錯誤:", error);
    }
};
</script>

<style scoped>
.title {
    text-align: center;
    font-size: 1.5rem;
    color: #00ffcc;
    text-shadow: 0 0 20px #00ffcc;
    font-family: 'Orbitron', sans-serif;
}

.quest-list {
    list-style: none;
    padding: 0;
    max-width: 600px;
    margin: 0 auto;
}

.quest-item {
    background: linear-gradient(135deg, #1a1a1a, #00ffcc);
    border: 2px solid #00ffcc;
    border-radius: 15px;
    padding: 0.5rem;
    margin: 10px 0;
    box-shadow: 0 0 15px rgba(0, 255, 204, 0.8);
    transition: transform 0.3s ease-in-out;
}

.quest-item:hover {
    transform: scale(1.05);
}

.quest-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.claim-button {
    padding: 10px 20px;
    color: #fff;
    background: #000000;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    font-family: 'Orbitron', sans-serif;
    box-shadow: 0 0 15px rgba(0, 255, 204, 0.8);
}

.claim-button:hover {
    background: #00bfa5;
}

.progress,
.claimed {
    font-size: 1.2rem;
    color: #fff;
    font-family: 'Orbitron', sans-serif;
}
</style>
