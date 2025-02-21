<template>
    <div class="time-battle-wrapper">

        <div class="time-battle-container">
            <!-- 遊戲進行階段 -->
            <div v-if="gameStarted" class="game-stage">
                <p v-if="countdownTime >= 60">倒數時間：{{ Math.floor(countdownTime / 60) }} 分鐘</p>
                <p v-else>遊戲即將結束</p>
                <h3>回合 {{ currentRound }} / 10</h3>

                <p v-if="!targetTime">目標秒數: -</p>
                <p v-else>目標秒數: {{ targetTime }}</p>

                <button v-if="!targetTime" @click="getTargetTime">取得目標時間</button>
                <button v-if="targetTime && !timing" @click="startTiming">攻擊</button>
                <button v-if="timing" @click="stopTiming">停止</button>

                <p v-if="timing">計時中...</p>
                <p v-if="elapsedTime">您的秒數: {{ elapsedTime }}</p>
                <p v-if="!timing && currentRoundScore !== null">本回合得分：{{ currentRoundScore }}</p>
                <p>總分：{{ totalScores }}</p>
            </div>

            <!-- 結算階段 -->
            <div v-if="gameFinished" class="game-finished-stage">
                <div v-if="gameStore.roomDetail.gameOver">
                    <h3>遊戲結束</h3>
                    <p>總分：{{ totalScores }} 分</p>
                    <div v-if="gameStore.roomDetail.winner === gameStore.walletAddress">
                        恭喜您戰勝所有對手並獲得獎勵
                    </div>
                    <div v-else>
                        很遺憾您沒有戰勝其他對手
                    </div>
                    <button @click="getGameLog" v-show="false">遊戲紀錄</button>
                </div>
                <div v-else>
                    等待其他玩家...
                </div>

            </div>

            <!-- Game Log Modal -->
            <div v-if="isGameLogModalVisible" class="modal-overlay">
                <div class="modal">
                    <div class="modal-header">
                        <h3>遊戲紀錄</h3>
                        <button @click="isGameLogModalVisible = false">X</button>
                    </div>
                    <div class="modal-body">
                        <div v-if="gameLog">
                            <div v-for="(log, index) in gameLog" :key="index" class="log-entry">
                                <p>回合數: {{ log.Round }}</p>
                                <p>目標秒數: {{ log.TargetTime }}</p>
                                <p>得分: {{ log.Scores }}</p>
                                <hr v-if="index < gameLog.length - 1" />
                            </div>
                        </div>
                        <div v-else>
                            <p>載入中...</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, defineProps, onMounted, computed } from 'vue'
import { useGameStore } from '@/stores/game';

onMounted(() => {
    startCountdown();
})

const gameStore = useGameStore();

const props = defineProps({
    roomId: {
        type: String,
        required: true
    }
})

const gameStarted = ref(true);
const gameFinished = ref(false);
const targetTime = ref(null);
const timing = ref(false);
const elapsedTime = ref(null);
const currentRound = ref(1);
const currentRoundScore = ref(null);
const countdownTime = ref(180);
const countdownInterval = ref(null);
const gameLog = ref([]);
const isGameLogModalVisible = ref(false);

const totalScores = computed(() => {
    return gameStore.roomDetail.players.find(player => player.walletAddress === gameStore.walletAddress).totalScores;
});

const startCountdown = () => {
    countdownTime.value = 180;
    countdownInterval.value = setInterval(() => {
        if (countdownTime.value > 0) {
            countdownTime.value--;
        } else {
            clearInterval(countdownInterval.value);
            gameFinished.value = true;
            gameStarted.value = false;
        }
    }, 1000);
};

const getTargetTime = async () => {
    try {
        // 根據回合數，從 roomDetail.targetTime 陣列取得
        targetTime.value = gameStore.roomDetail.targetTime[currentRound.value - 1];
    } catch (error) {
        console.error('錯誤:', error);
    }
};

const startTiming = async () => {
    timing.value = true;
    const message = {
        event: 'startTimer',
        data: {
            walletAddress: gameStore.walletAddress,
            roomId: props.roomId
        }
    }
    gameStore.webSocket.send(JSON.stringify(message));
};

const stopTiming = async () => {
    console.log("StopTiming")
    timing.value = false;
    const message = {
        event: 'endTimer',
        data: {
            walletAddress: gameStore.walletAddress,
            roomId: props.roomId
        }
    }
    gameStore.webSocket.send(JSON.stringify(message));

    // 回合結束
    targetTime.value = null;
    currentRound.value++;

    if (currentRound.value > 10) {
        gameFinished.value = true;
        gameStarted.value = false;

        clearInterval(countdownInterval.value);
    }
};

const getGameLog = async () => {
    try {
        gameLog.value = gameStore.roomDetail.gameLog;
        isGameLogModalVisible.value = true;
    } catch (error) {
        console.error('錯誤:', error);
    }
}

</script>

<style scoped>
.time-battle-wrapper {
    display: flex;
    justify-content: center;
    /* 水平置中 */
    align-items: center;
    /* 垂直置中 */
}

.time-battle-container {
    font-family: 'Orbitron', sans-serif;
    border-radius: 8px;
    color: #e5e5e5;
    padding: 2rem;
    box-sizing: border-box;
}

/* 文字標題 */
h3 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #21f1ff;
    /* 科技感的螢光藍色 */
}

/* 按鈕的統一風格 */
button {
    font-family: inherit;
    background: transparent;
    color: #21f1ff;
    border: 1px solid #21f1ff;
    padding: 0.5rem 1rem;
    margin: 0.25rem;
    cursor: pointer;
    transition: all 0.25s ease;
    outline: none;
    text-transform: uppercase;
}

button:hover {
    background: #21f1ff;
    color: #0e0e0e;
    box-shadow: 0 0 8px #21f1ff;
}

/* 在disabled時改為灰色 */
button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    box-shadow: none;
    border-color: #555;
    color: #555;
}

/* 針對黑色特別按鈕 (如不使用道具) */
.black-button {
    background: #333;
    border: 1px solid #333;
    color: #fff;
}

.black-button:hover {
    background: #555;
    border-color: #555;
    color: #fff;
    box-shadow: 0 0 8px #555;
}

/* 錯誤訊息 */
.error {
    color: #ff5757;
    margin-top: 0.5rem;
}

/* 階段容器分段 */
.game-stage,
.game-finished-stage {
    margin-bottom: 2rem;
    border: 1px solid #21f1ff;
    padding: 1rem;
    border-radius: 8px;
    box-shadow: 0 0 15px rgba(33, 241, 255, 0.2);
}

/* modal區 */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(14, 14, 14, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999;
}

.modal {
    background: #1c1c1c;
    border: 1px solid #21f1ff;
    box-shadow: 0 0 15px rgba(33, 241, 255, 0.2);
    width: 80%;
    max-width: 600px;
    border-radius: 8px;
    padding: 1rem;
    position: relative;
    /* ★ 新增以下兩行 ★ */
    max-height: 80vh;
    overflow-y: auto;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.modal-header h3 {
    margin: 0;
    color: #21f1ff;
}

.modal-header button {
    border: none;
    background: none;
    color: #21f1ff;
    font-size: 1.2rem;
}

.modal-header button:hover {
    color: #0ff;
}

.modal-body ul {
    list-style: none;
    padding-left: 0;
    margin: 0;
}

.modal-body li {
    margin-bottom: 0.5rem;
}

/* 遊戲紀錄 */
.log-entry {
    margin-bottom: 1rem;
}

/* 捲動條樣式 (可選) */
::-webkit-scrollbar {
    width: 8px;
}

::-webkit-scrollbar-thumb {
    background: #21f1ff;
}

::-webkit-scrollbar-track {
    background: #0e0e0e;
}

.btn-back {
    position: fixed;
    /* 使其固定於視窗，不受父層限制 */
    top: 1rem;
    left: 1rem;
    z-index: 999;
    /* 確保在最上層，避免被其他元素蓋住 */

    /* 其他樣式可自由調整 */
    background-color: #333;
    color: #fff;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
}

/* 小螢幕固定左上角 */
@media (max-width: 767px) {
    .btn-back {
        top: 1rem;
        left: 1rem;
    }
}

/* 大螢幕可再調整位置 */
@media (min-width: 768px) {
    .btn-back {
        top: 2rem;
        left: 2rem;
    }
}
</style>