<template>
    <div class="leaderboard-container">
        <h3 class="neon-title">LEADERBOARD PRIZE POOL</h3>
        <div class="cyber-display">
            <span v-if="gameStore.leaderboardPrizePoolTimeCoin !== null" class="glowing-number">
                {{ formattedLeaderboardPrizePool }}
            </span>
            <span v-else class="loading-text cyber-glitch">載入中...</span>
            <span class="tc-label neon-unit">TC</span>
        </div>
    </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useGameStore } from '@/stores/game';

const gameStore = useGameStore();

// 當元件掛載時呼叫 API 獲取獎金池數據
onMounted(async () => {
    await gameStore.getLeaderboardPrizePool();
});

const formattedLeaderboardPrizePool = computed(() => {
    if (gameStore.leaderboardPrizePoolTimeCoin !== null && !isNaN(gameStore.leaderboardPrizePoolTimeCoin)) {
        return Number(gameStore.leaderboardPrizePoolTimeCoin).toLocaleString('en-US');  // 美國格式 1,000,000
    }
    return null;
});
</script>

<style scoped>
/* 外框設計，霓虹科技風 */
.leaderboard-container {
    background: linear-gradient(145deg, #0a0a2e 0%, #1a1a4a 100%);
    border-radius: 12px;
    padding: 1.5rem;
    position: relative;
    overflow: hidden;
    box-shadow: 0 0 20px rgba(0, 247, 255, 0.3);
    text-align: center;
    max-width: 100%;
    min-width: 300px;
    box-sizing: border-box;
}

/* 標題科技感 */
.neon-title {
    font-family: 'Orbitron', sans-serif;
    color: #00f7ff;
    text-transform: uppercase;
    letter-spacing: 3px;
    text-shadow: 0 0 10px rgba(0, 247, 255, 0.8);
    position: relative;
    margin-bottom: 1.5rem;
    font-weight: 700;
}

/* 數字顯示區域 */
.cyber-display {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 1rem;
    position: relative;
    padding: 1rem;
    background: rgba(0, 10, 20, 0.6);
    border-radius: 8px;
    box-shadow: 0 0 15px rgba(0, 247, 255, 0.2);
}

/* 獎金數字，科技感動效 */
.glowing-number {
    font-family: 'Digital-7', monospace;
    color: #00ff9d;
    font-size: 3rem;
    font-weight: bold;
    text-shadow: 0 0 20px rgba(0, 255, 157, 0.5);
    animation: pulse 1.5s infinite alternate;
}

/* TC 單位 */
.neon-unit {
    color: #ff007a;
    font-family: 'Arial Narrow', sans-serif;
    font-weight: 900;
    text-shadow: 0 0 10px rgba(255, 0, 122, 0.6);
    letter-spacing: 1px;
}

/* 載入中文字的特效 */
.loading-text.cyber-glitch {
    font-size: 2rem;
    font-weight: bold;
    color: #00f7ff;
    animation: glitch 2s infinite;
}

/* 霓虹脈衝效果 */
@keyframes pulse {
    0% {
        opacity: 0.9;
        text-shadow: 0 0 10px rgba(0, 255, 157, 0.5);
    }
    100% {
        opacity: 1;
        text-shadow: 0 0 20px rgba(0, 255, 157, 0.8);
    }
}

/* 類似故障的顯示動畫 */
@keyframes glitch {
    0% {
        text-shadow: -2px 0 #ff00c1, 2px 0 #00fff9;
    }
    25% {
        transform: translateX(2px);
    }
    50% {
        transform: translateX(-2px);
    }
    75% {
        text-shadow: 2px 0 #ff00c1, -2px 0 #00fff9;
    }
    100% {
        text-shadow: -2px 0 #ff00c1, 2px 0 #00fff9;
    }
}

/* 響應式調整 */
@media (max-width: 768px) {
    .glowing-number {
        font-size: 2rem;
    }
    .neon-title {
        font-size: 1.5rem;
    }
    .neon-unit {
        font-size: 1rem;
    }
}

@media (max-width: 480px) {
    .leaderboard-container {
        padding: 1rem;
    }
    .neon-title {
        font-size: 1.2rem;
    }
    .glowing-number {
        font-size: 1.8rem;
    }
}
</style>