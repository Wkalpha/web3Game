<template>
    <div class="prize-item-pool">
        <h1 class="title">抽獎</h1>
        <div v-if="prizeItemPools.length === 0" class="loading">加載中...</div>
        <div v-else class="prize-container">
            <div v-for="(prizeItemPool, index) in prizeItemPools" :key="index">
                <button @click="openPrizeModal(prizeItemPool.PoolName, prizeItemPool.EntryFee)"
                    class="draw-button pulse glow">
                    {{ prizeItemPool.PoolName }} 獎池
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useGameStore } from '@/stores/game';
const gameStore = useGameStore();

const prizeItemPools = ref([]);
const prizeItems = ref([]);
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
    await getPrizeItem(poolName);
    showPrizeModal();
};

const getPrizeItem = async (poolName) => {
    const payload = { poolName, walletAddress: gameStore.walletAddress };
    const response = await axios.post(`${process.env.VUE_APP_API_URL}/get-prize-item`, payload);
    prizeItems.value = response.data.prizeItems;
    bigPrize.value = response.data.bigPrize;
    guaranteeDraw.value = response.data.guaranteeDraw;
    userDrawCounter.value = response.data.userDrawCounter;
};

const showPrizeModal = () => {
    Swal.fire({
        title: `${selectedPoolName.value} 獎池`,
        html: `
            <h2>抽一次 ${prizeItemPoolEntryFee.value} Time Coin</h2>
            <h3>已累計 ${userDrawCounter.value} 抽</h3>
            <button id="drawOnce" class="draw-button">開始抽獎</button>
            <button id="drawTen" class="draw-button">10 連抽</button>
            <ul>
                ${prizeItems.value.map(item => `<li><strong>${item.ItemName}</strong> - 數量: ${item.ItemValue} - 機率: ${item.DropRatePercent}</li>`).join('')}
            </ul>
        `,
        showCloseButton: true,
        allowOutsideClick: false,
        didOpen: () => {
            document.getElementById('drawOnce').addEventListener('click', () => drawPrize(selectedPoolName.value));
            document.getElementById('drawTen').addEventListener('click', () => tendrawPrize(selectedPoolName.value));
        }
    });
};

const drawPrize = async (poolName) => {
    try {
        const payload = { poolName, walletAddress: gameStore.walletAddress };
        Swal.fire({ title: '抽獎中', text: '請稍候...', allowOutsideClick: false, showConfirmButton: false });
        const response = await axios.post(`${process.env.VUE_APP_API_URL}/draw-prize`, payload);
        userDrawCounter.value = response.data.userDrawCounter;
        Swal.fire({ title: '恭喜！', text: `抽中 ${response.data.prize.ItemName}`, icon: 'success' }).then(() => showPrizeModal());
    } catch (error) {
        Swal.fire({ title: '錯誤', text: '抽獎失敗，請稍後再試。', icon: 'error' }).then(() => showPrizeModal());
    }
};

const tendrawPrize = async (poolName) => {
    try {
        const payload = { poolName, walletAddress: gameStore.walletAddress };
        const interval = setInterval(() => {
            const randomIndex = Math.floor(Math.random() * prizeItems.value.length);
            Swal.update({ html: `<h2>正在抽獎...</h2><p>獎品：${prizeItems.value[randomIndex].ItemName}</p>` });
        }, 100);

        Swal.fire({
            title: '抽獎中',
            html: `<h2>正在抽獎...</h2>`,
            allowOutsideClick: false,
            showConfirmButton: false,
            didOpen: async () => {
                Swal.showLoading();
                const response = await axios.post(`${process.env.VUE_APP_API_URL}/ten-draw-prize`, payload);
                clearInterval(interval);
                let resultHtml = '<h2>抽獎結果</h2>';
                response.data.prizes.forEach(prize => {
                    resultHtml += `<p>${prize.ItemName} x ${prize.ItemValue}</p>`;
                });
                Swal.fire({ title: '恭喜！', html: resultHtml, icon: 'success' }).then(() => showPrizeModal());
            }
        });
    } catch (error) {
        Swal.fire({ title: '錯誤', text: '抽獎失敗，請稍後再試。', icon: 'error' }).then(() => showPrizeModal());
    }
};

onMounted(() => {
    getPrizeItemPool();
});
</script>

<style scoped>
.title {
    text-align: center;
    font-size: 2.5rem;
    color: #00eaff;
    text-shadow: 0 0 20px #00eaff;
    font-family: 'Orbitron', sans-serif;
}

.prize-container {
    display: flex;
    justify-content: center;
    gap: 1rem;
    flex-wrap: wrap;
}

.draw-button {
    padding: 2rem 2rem;
    font-size: 1rem;
    color: #fff;
    background: linear-gradient(45deg, #0f0f0f, #00eaff);
    border: 2px solid #00eaff;
    border-radius: 20px;
    cursor: pointer;
    box-shadow: 0 0 30px rgba(0, 234, 255, 0.8);
    transition: transform 0.3s, box-shadow 0.3s;
    font-family: 'Orbitron', sans-serif;
}

.draw-button:hover {
    transform: scale(1.2);
    box-shadow: 0 0 40px rgba(0, 234, 255, 1);
}

@media (max-width: 480px) {
    .prize-container {
        display: flex;
        justify-content: center;
        gap: 1rem;
        flex-wrap: nowrap;
    }
}
</style>