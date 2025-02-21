<template>
    <div class="room-container">
        <!-- 左上角返回按鈕：回到所有房間列表 -->
        <button class="back-button" @click="goBack">返回房間列表</button>

        <!-- 房間資訊區塊 (若房間資料尚未載入則顯示載入中) -->
        <div v-if="gameStore.roomDetail" class="room-info">
            <h1>房間 {{ gameStore.roomDetail.id }}</h1>
            <p>最低下注金額: {{ gameStore.roomDetail.minBet }}</p>
            <p>目前下注金額: {{ gameStore.roomDetail.totalBet }}</p>
            <p>玩家人數: {{ gameStore.roomDetail.playerCount }} / {{ gameStore.roomDetail.maxPlayers }}</p>

            <!-- 顯示目前所有玩家 -->
            <div class="players-list">
                <h2>玩家列表</h2>
                <ul>
                    <li v-for="player in gameStore.roomDetail.players" :key="player.id">
                        <div>
                            {{ player.walletAddress === gameStore.roomDetail.creator ? '房主：' : '玩家：' }}
                            {{ formatWalletAddress(player.walletAddress) }}
                            <span v-if="player.walletAddress === gameStore.walletAddress"> (你)</span>
                        </div>
                        <div>下注：{{ player.betAmount }} Time Coin</div>
                        <div v-if="player.walletAddress !== gameStore.roomDetail.creator">
                            {{ player.ready ? '就緒' : '尚未準備' }}
                        </div>
                        <div v-if="isRoomCreator && player.walletAddress !== gameStore.walletAddress">
                            <button class="ready-button" @click="kickPlayer(player.walletAddress)">踢出房間</button>
                        </div>
                    </li>
                </ul>
            </div>

            <!-- 顯示準備/取消準備按鈕 -->
            <button v-if="isRoomCreator" class="ready-button" @click="startGame" :disabled="isDisabled">開始</button>
            <button v-else class="ready-button" @click="handleReady">
                {{ isReady ? '取消準備' : '準備' }}
            </button>
        </div>
        <div v-else>
            載入中...
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, defineProps, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'
import axios from 'axios'

const props = defineProps({
    roomId: {
        type: String,
        required: true
    }
})

const gameStore = useGameStore();

const router = useRouter();

const isDisabled = computed(() => {
    const nonCreatorPlayers = gameStore.roomDetail.players.filter(
        player => player.walletAddress !== gameStore.roomDetail.creator
    );

    // 條件 1: 至少要有一位非房主玩家
    if (nonCreatorPlayers.length === 0) {
        return true;
    }

    // 條件 2: 確認所有非房主玩家的 ready 都是 true
    return !nonCreatorPlayers.every(player => player.ready === true);
});

// 玩家是否準備的狀態
const isReady = ref(false);

// 計算是否是房主
const isRoomCreator = computed(() => gameStore.walletAddress === gameStore.roomDetail.creator);

// 處理踢出房間
const kickPlayer = async (walletAddress) => {
    const payload = {
        roomId: props.roomId,
        walletAddress: walletAddress
    }
    await axios.post(`${process.env.VUE_APP_API_URL}/kick-player`, payload);
};

// 處理開始遊戲
const startGame = async () => {
    const payload = {
        walletAddress: gameStore.walletAddress,
        roomId: props.roomId
    }
    await axios.post(`${process.env.VUE_APP_API_URL}/game-start`, payload);
};

// 處理準備/取消準備
const handleReady = async () => {
    const payload = {
        roomId: props.roomId,
        walletAddress: gameStore.walletAddress
    }

    await axios.post(`${process.env.VUE_APP_API_URL}/toggle-ready`, payload);
};

const goBack = async () => {
    try {
        const payload = {
            walletAddress: gameStore.walletAddress,
            roomId: props.roomId
        };

        // 發送請求通知後端移除 player 或整個房間
        await axios.post(`${process.env.VUE_APP_API_URL}/leave-room`, payload);

        // 返回房間列表頁面
        router.push('/pvp');
    } catch (error) {
        console.error('離開房間時出錯:', error);
    }
}

const getRoomInfo = async () => {
    try {
        const payload = {
            walletAddress: gameStore.walletAddress,
            token: gameStore.pvpRoomInfo.token
        }
        await axios.post(`${process.env.VUE_APP_API_URL}/rooms/${props.roomId}`, payload).then(rs => {
            if (!rs.data.room) {
                router.push('/pvp')
                return
            }
            gameStore.roomDetail = rs.data.room;
        })

    } catch (error) {
        if (error.response && error.response.status === 404) {
            console.log("error")
        } else {
            console.error('查詢房間錯誤:', error)
        }
        router.push('/pvp')
    }
}

const formatWalletAddress = (address) => {
    if (!address || address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

onMounted(async () => {
    await getRoomInfo();
})

// 監聽 joinRoomKey 的變化
watch(
    () => gameStore.joinRoomKey,  // 使用 getter 函數取得反應式值
    getRoomInfo  // 當值變化時執行的函數
);

// 監聽 roomDestroyKey 的變化
watch(
    () => gameStore.roomDestroyKey,  // 使用 getter 函數取得反應式值
    () => router.push('/pvp')  // 當值變化時直接執行路由跳轉
);

// 監聽 roomStartKey 的變化
watch(
    () => gameStore.roomStartKey,  // 使用 getter 函數取得反應式值
    () => router.push(`/pvp/gameplay/${props.roomId}`)  // 當值變化時直接執行路由跳轉
);

// 監聽 kickPlayerKey 的變化
watch(
    () => gameStore.kickPlayerKey,  // 使用 getter 函數取得反應式值
    () => router.push(`/pvp`)  // 當值變化時直接執行路由跳轉
);
</script>

<style scoped>
/* 科技感十足但簡約的風格 */
.room-container {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: #121212;
    /* 深色背景 */
    color: #e0e0e0;
    font-family: 'Roboto', sans-serif;
    padding: 20px;
    text-align: center;
}

/* 左上角返回按鈕 */
.back-button {
    position: absolute;
    top: 20px;
    left: 20px;
    background: transparent;
    border: 2px solid #00ffcc;
    border-radius: 4px;
    padding: 5px 10px;
    color: #00ffcc;
    font-size: 1rem;
    cursor: pointer;
    transition: background 0.3s;
}

.back-button:hover {
    background: rgba(0, 255, 204, 0.2);
}

.room-info {
    max-width: 600px;
    width: 100%;
}

.room-info h1 {
    font-size: 2.5rem;
    margin-bottom: 20px;
    color: #00ffcc;
    /* 霓虹綠 */
    text-shadow: 0 0 10px rgba(0, 255, 204, 0.7);
}

.room-info p {
    font-size: 1.2rem;
    line-height: 1.6;
    margin-bottom: 20px;
}

.players-list {
    margin-bottom: 20px;
    text-align: left;
}

.players-list h2 {
    font-size: 1.8rem;
    margin-bottom: 10px;
    color: #00ffcc;
}

.players-list ul {
    list-style: none;
    padding: 0;
}

.players-list li {
    margin-bottom: 5px;
    padding: 5px;
    border-bottom: 1px solid rgba(0, 255, 204, 0.3);
}

/* 準備/取消準備按鈕 */
.ready-button {
    background: transparent;
    border: 2px solid #00ffcc;
    border-radius: 4px;
    padding: 10px 20px;
    color: #00ffcc;
    font-size: 1rem;
    cursor: pointer;
    transition: background 0.3s;
}

.ready-button:disabled {
    background-color: #8a2828;
    cursor: not-allowed;
}

.ready-button:hover {
    background: rgba(0, 255, 204, 0.2);
}
</style>