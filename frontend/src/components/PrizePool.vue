<template>
    <div class="prize-container">
        <p class="prize-title">主獎金池</p>
        <div class="prize-amount">
            <span v-if="gameStore.prizePool !== null">{{ formattedPrizePool }}</span>
            <span v-else class="loading-text">載入中...</span>
            <span class="tc-label"> TC</span>
        </div>
    </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useGameStore } from '@/stores/game';

const gameStore = useGameStore();

// 當元件掛載時呼叫 API 獲取獎金池數據
onMounted(async () => {
    await gameStore.getMainPrizePool();
});

const formattedPrizePool = computed(() => {
    if (gameStore.prizePool !== null && !isNaN(gameStore.prizePool)) {
        return Number(gameStore.prizePool).toLocaleString('en-US');  // 美國格式 1,000,000
    }
    return null;
});
</script>

<style scoped>
.prize-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    background: linear-gradient(135deg, #ff8c00, #ff416c);
    border-radius: 20px;
    padding: 50px 30px;
    box-shadow: 0 10px 30px rgba(255, 65, 108, 0.5);
    max-width: 400px;
    margin: 50px auto;
    animation: fadeIn 1.2s ease-in-out;
}

.prize-title {
    font-size: 2rem;
    font-weight: bold;
    text-transform: uppercase;
    color: #fff;
    text-shadow: 0 0 15px rgba(255, 255, 255, 0.9);
    margin-bottom: 15px;
    text-align: center;
}

.prize-amount {
    font-size: 3rem;
    font-weight: bold;
    color: #fff;
    text-shadow: 0 0 20px rgba(255, 255, 255, 0.8);
    letter-spacing: 2px;
    display: flex;
    justify-content: center;
    align-items: center;
}

.tc-label {
    font-size: 1.5rem;
    font-weight: normal;
    margin-left: 10px;
    color: #ffeb3b;
    text-shadow: 0 0 15px rgba(255, 235, 59, 0.8);
}

/* 載入中文字樣動畫 */
.loading-text {
    font-size: 1.5rem;
    font-weight: bold;
    color: #fff;
    animation: blink 1.5s infinite alternate;
}

@keyframes blink {
    from {
        opacity: 1;
    }
    to {
        opacity: 0.5;
    }
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>
