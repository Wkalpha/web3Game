<template>
    <div class="cyberpunk-container">
        <h3 class="neon-title">PRIZE POOL</h3>
        <div class="cyber-display">
            <span v-if="gameStore.prizePool !== null" class="glowing-number">
                {{ formattedPrizePool }}
            </span>
            <span v-else class="loading-text cyber-glitch">LOADING...</span>
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
.cyberpunk-container {
    background: linear-gradient(145deg, #0a0a2e 0%, #1a1a4a 100%);
    border-radius: 12px;
    padding: 1.5rem;
    position: relative;
    box-shadow: 0 0 20px rgba(0, 247, 255, 0.3);
    max-width: 100%;
    box-sizing: border-box;
}

.neon-title {
    color: #00f7ff;
    font-family: 'Orbitron', sans-serif;
    text-transform: uppercase;
    letter-spacing: 3px;
    text-shadow: 0 0 10px rgba(0, 247, 255, 0.8);
    position: relative;
    margin-bottom: 1.5rem;
    font-weight: 700;
    text-align: center;
}

.cyber-display {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 0.8rem;
    position: relative;
    padding: 1rem;
    background: rgba(0, 10, 20, 0.6);
    border-radius: 8px;
    flex-wrap: wrap;
    /* 在小螢幕時允許換行 */
}

.glowing-number {
    font-family: 'Segment7', monospace;
    color: #00ff9d;
    font-size: 3rem;
    font-weight: 700;
    text-shadow: 0 0 15px rgba(0, 255, 157, 0.5);
    animation: pulse 1.5s infinite alternate;
    white-space: nowrap;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
}

.neon-unit {
    color: #ff007a;
    font-family: 'Arial Narrow', sans-serif;
    font-weight: 900;
    text-shadow: 0 0 10px rgba(255, 0, 122, 0.6);
    letter-spacing: 1px;
}

.loading-text.cyber-glitch {
    position: relative;
    color: #00f7ff;
    animation: glitch 2s infinite;
}

@keyframes scan {
    0% {
        transform: translateY(-50%) rotate(45deg);
    }

    100% {
        transform: translateY(50%) rotate(45deg);
    }
}

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

/* 响应式设计 */
@media (max-width: 768px) {
    .glowing-number {
        font-size: 2rem;
    }

    .neon-title {
        font-size: 1.2rem;
    }

    .neon-unit {
        font-size: 0.9rem;
    }
}

/* 手機版專用調整 */
@media (max-width: 480px) {
    .cyberpunk-container {
        margin-bottom: 1rem;
    }

    .neon-title {
        font-size: 1rem;
        /* 進一步縮小標題 */
        letter-spacing: 1px;
    }

    .glowing-number {
        font-size: 1.5rem !important;
        /* 強制覆蓋 */
        white-space: nowrap;
        /* 防止數字換行 */
    }

    .cyber-display {
        padding: 0.5rem;
        /* 縮小內間距 */
        gap: 0.5rem;
        /* 縮小元素間距 */
    }

    .neon-unit {
        font-size: 0.8rem !important;
        /* 強制縮小單位 */
    }

    .cyberpunk-container::before {
        animation-duration: 3s;
        /* 加快掃描線速度 */
    }
}

/* 超小螢幕專用 (例如摺疊手機) */
@media (max-width: 360px) {
    .glowing-number {
        font-size: 1.2rem !important;
        letter-spacing: -1px;
    }

    .neon-unit {
        font-size: 0.7rem !important;
    }

    .neon-title {
        font-size: 0.9rem;
    }
}
</style>