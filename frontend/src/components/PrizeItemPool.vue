<template>
    <div class="prize-item-pool">
        <h1>抽獎</h1>
        <BigPrizeMarquee />
        <div v-if="prizeItemPools.length === 0" class="loading">加載中...</div>
        <div v-else>
            <div v-for="(prizeItemPool, index) in prizeItemPools" :key="index">
                <button @click="openPrizeModal(prizeItemPool.PoolName, prizeItemPool.EntryFee)"
                    class="draw-button pulse">
                    {{ prizeItemPool.PoolName }} 獎池
                </button>
            </div>
        </div>
        <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
            <div class="modal-content fade-in">
                <h2>{{ selectedPoolName }} 獎池</h2>
                <h2>抽一次 {{ prizeItemPoolEntryFee }} Time Coin</h2>
                <h3>已累計 {{ userDrawCounter }} 抽</h3>
                <button @click="drawPrize(selectedPoolName)" class="draw-button shine"
                    :class="{ 'disabled-button': gameStore.userInfo.timeCoin < prizeItemPoolEntryFee }"
                    :disabled="gameStore.userInfo.timeCoin < prizeItemPoolEntryFee">
                    開始抽獎
                </button>
                <button @click="tendrawPrize(selectedPoolName)" class="draw-button shine"
                    :class="{ 'disabled-button': gameStore.userInfo.timeCoin < prizeItemPoolEntryFee * 10 }"
                    :disabled="gameStore.userInfo.timeCoin < prizeItemPoolEntryFee * 10">
                    10 連抽
                </button>
                <ul class="prize-list">
                    <li v-for="(item, index) in prizeItems" :key="index">
                        <strong>{{ item.ItemName }}</strong> - 數量: {{ item.ItemValue }} - 機率: {{ item.DropRatePercent }}
                    </li>
                </ul>
                <button @click="showPrizeDescription">說明</button>
                <button @click="closeModal">關閉</button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import Swal from 'sweetalert2';
import BigPrizeMarquee from './BigPrizeMarquee.vue';
import { useGameStore } from '@/stores/game';
const gameStore = useGameStore();

const prizeItemPools = ref([]);
const prizeItems = ref([]);
const showModal = ref(false);
const selectedPoolName = ref('');
const userDrawCounter = ref(null);
const prizeItemPoolEntryFee = ref(null);
const guaranteeDraw = ref(null);
const bigPrize = ref(null);

const getPrizeItemPool = async () => {
    const response = await axios.get(`${process.env.VUE_APP_API_URL}/get-prize-item-pool`);
    prizeItemPools.value = response.data.prizeItemPool;
};

const openPrizeModal = async (poolName, entryFee) => {
    selectedPoolName.value = poolName;
    prizeItemPoolEntryFee.value = entryFee;
    showModal.value = true;
    await getPrizeItem(poolName);
};

const getPrizeItem = async (poolName) => {
    const payload = { poolName, walletAddress: gameStore.walletAddress };
    const response = await axios.post(`${process.env.VUE_APP_API_URL}/get-prize-item`, payload);
    prizeItems.value = response.data.prizeItems;
    bigPrize.value = response.data.bigPrize;
    guaranteeDraw.value = response.data.guaranteeDraw;
    userDrawCounter.value = response.data.userDrawCounter;
};

const showPrizeDescription = () => {
    Swal.fire({
        title: '說明',
        html: `<p>1. 抽一次會消耗對應的 Time Coin。</p><p>2. 累計 ${guaranteeDraw.value} 抽必得 ${bigPrize.value.ItemName}。</p>`,
        icon: 'info',
        confirmButtonText: '了解了',
    });
};

const closeModal = () => {
    showModal.value = false;
};

const drawPrize = async (poolName) => {
    try {
        const payload = { poolName, walletAddress: gameStore.walletAddress };
        Swal.fire({ title: '抽獎中', text: '請稍候...', allowOutsideClick: false, showConfirmButton: false });
        const response = await axios.post(`${process.env.VUE_APP_API_URL}/draw-prize`, payload);
        userDrawCounter.value = response.data.userDrawCounter;
        Swal.fire({ title: '恭喜！', text: `抽中 ${response.data.prize.ItemName}`, icon: 'success' });
    } catch (error) {
        Swal.fire({ title: '錯誤', text: '抽獎失敗，請稍後再試。', icon: 'error' });
    }
};

const tendrawPrize = async (poolName) => {
    try {
        const payload = {
            poolName,
            walletAddress: gameStore.walletAddress
        };

        // 1. 開始輪詢動畫
        const interval = setInterval(() => {
            const randomIndex = Math.floor(Math.random() * prizeItems.value.length);
            Swal.update({
                html: `<h2>正在抽獎...</h2><p>獎品：${prizeItems.value[randomIndex].ItemName}</p>`,
            });
        }, 100);

        // 2. 顯示 SweetAlert 的 loading 狀態
        Swal.fire({
            title: '抽獎中',
            html: `<h2>正在抽獎...</h2>`,
            allowOutsideClick: false,
            showConfirmButton: false,
            didOpen: async () => {
                Swal.showLoading();

                // 3. 發送請求，模擬等待後端返回
                const response = await axios.post(`${process.env.VUE_APP_API_URL}/ten-draw-prize`, payload);
                const finalPrize = response.data.prizes;
                userDrawCounter.value = response.data.userDrawCounter;

                // 4. 停止輪詢動畫
                clearInterval(interval);

                // 5. 顯示 10 連抽結果
                let resultHtml = '<h2>抽獎結果</h2>';
                finalPrize.forEach((prize) => {
                    resultHtml += `<p>${prize.ItemName} x ${prize.ItemValue}</p>`;
                });

                Swal.fire({
                    title: '恭喜！',
                    html: resultHtml,
                    icon: 'success',
                    confirmButtonText: '確定',
                });
            },
        });
    } catch (error) {
        console.error('抽獎失敗:', error);

        // 顯示錯誤提示
        Swal.fire({
            title: '抽獎失敗',
            text: '請稍後再試。',
            icon: 'error',
            confirmButtonText: '確定',
        });
    }
};

onMounted(() => {
    getPrizeItemPool();
});
</script>

<style scoped>
.prize-item-pool {
    text-align: center;
    padding: 20px;
    background: #121212;
    color: #fff;
    font-family: 'Arial', sans-serif;
}

.title {
    font-size: 2rem;
    text-transform: uppercase;
    font-weight: bold;
    margin-bottom: 20px;
}

.draw-button {
    background: linear-gradient(90deg, #6a11cb, #2575fc);
    color: white;
    border: none;
    border-radius: 30px;
    padding: 15px 30px;
    font-size: 20px;
    font-weight: bold;
    cursor: pointer;
    transition: transform 0.3s;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.draw-button:hover {
    transform: scale(1.05);
}

.modal-overlay {
    background: rgba(0, 0, 0, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
}

.modal-content {
    background: #fff;
    color: #000;
    border-radius: 10px;
    padding: 30px;
    width: 80%;
    max-width: 500px;
    text-align: center;
}

.info-button,
.close-button {
    background: #333;
    color: #fff;
    border: none;
    padding: 10px 20px;
    border-radius: 5px;
    margin-top: 15px;
    cursor: pointer;
}

.info-button:hover,
.close-button:hover {
    background: #555;
}
</style>