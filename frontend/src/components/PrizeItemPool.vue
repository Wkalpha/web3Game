<template>
    <div class="prize-item-pool">
        <h1>抽獎</h1>
        <div v-if="prizeItemPools.length === 0">加載中...</div>
        <div v-else>
            <div v-for="(prizeItemPool, index) in prizeItemPools" :key="index">
                <button @click="openPrizeModal(prizeItemPool.PoolName, prizeItemPool.EntryFee)" class="draw-button">
                    {{ prizeItemPool.PoolName }}
                </button>
            </div>
        </div>
        <!-- Modal 彈窗 -->
        <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
            <div class="modal-content">
                <h2>{{ selectedPoolName }}</h2>
                <button @click="drawPrize(selectedPoolName)" class="draw-button"
                    :class="{ 'disabled-button': userTimeCoin < prizeItemPoolEntryFee }"
                    :disabled="userTimeCoin < prizeItemPoolEntryFee">
                    開始抽獎
                </button>
                <ul>
                    <li v-for="(item, index) in prizeItems" :key="index">
                        <strong>{{ item.ItemName }}</strong> - 數量: {{ item.ItemValue }} - 機率: {{ item.DropRate }}
                    </li>
                </ul>
                <button @click="closeModal" class="close-button">關閉</button>
            </div>
        </div>
    </div>
</template>

<script>
import axios from 'axios';
import Swal from 'sweetalert2';

export default {
    name: 'PrizeItemPool',
    props: {
        walletAddress: {
            type: String,
            required: true
        },
        userTimeCoin: {
            type: Number,
            required: true,
        }
    },
    data() {
        return {
            prizeItemPools: [],
            prizeItems: [],
            showModal: false, // 控制 Modal 顯示
            selectedPoolName: '', // 選中的獎池名稱
            prizeItemPoolEntryFee: null
        };
    },
    mounted() {
        this.getPrizeItemPool(); // 調用方法
    },
    methods: {
        // 打開 Modal 並加載對應獎品列表
        async openPrizeModal(poolName, entryFee) {
            this.selectedPoolName = poolName;
            this.prizeItemPoolEntryFee = entryFee;
            this.showModal = true;
            await this.getPrizeItem(poolName); // 加載獎品列表
        },
        // 關閉 Modal
        closeModal() {
            this.showModal = false;
        },
        async getPrizeItem(poolName) {
            //開啟相對應獎池
            const payload = {
                poolName: poolName
            }
            await axios.post('http://localhost:3000/get-prize-item', payload).then(rs => {
                this.prizeItems = rs.data.prizeItems;
            });
        },
        async getPrizeItemPool() {
            await axios.get('http://localhost:3000/get-prize-item-pool').then(rs => {
                this.prizeItemPools = rs.data.prizeItemPool;
            });
        },
        async drawPrize(poolName) {
            console.log(poolName, this.walletAddress);
            try {
                const payload = {
                    poolName,
                    walletAddress: this.walletAddress
                };

                // 1. 開始輪詢動畫
                const interval = setInterval(() => {
                    const randomIndex = Math.floor(Math.random() * this.prizeItems.length);
                    Swal.update({
                        html: `<h2>正在抽獎...</h2><p>獎品：${this.prizeItems[randomIndex].ItemName}</p>`,
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
                        const response = await axios.post('http://localhost:3000/draw-prize', payload);
                        const finalPrize = response.data.prize;

                        // 4. 停止輪詢動畫
                        clearInterval(interval);

                        // 5. 更新 SweetAlert 顯示抽中的獎品
                        Swal.fire({
                            title: '恭喜！',
                            html: `<h2>抽中獎品：${finalPrize.ItemName}</h2><p>價值：${finalPrize.ItemValue}</p>`,
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


            // 給後端 walletAddress
            // const payload = {
            //     walletAddress: this.walletAddress
            // }
            // await axios.get('http://localhost:3000/draw-prize-item', payload).then(rs => {
            //     this.prizeItemPools = rs.data.prizeItemPool;
            // });
        }
    }
};
</script>

<style scoped>
.prize-item-pool {
    text-align: center;
}

.draw-button {
    background-color: #4caf50;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 10px 20px;
    font-size: 18px;
    cursor: pointer;
    transition: background-color 0.3s;
}

.draw-button:hover {
    background-color: #45a049;
}

.draw-button:disabled,
.disabled-button:hover {
    background-color: gray; /* 禁用時按鈕的背景色 */
    cursor: not-allowed; /* 禁用時改變游標 */
    opacity: 0.6; /* 禁用時的透明度 */
}

.drawn-prize {
    margin-top: 20px;
    font-size: 20px;
    font-weight: bold;
}

.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.modal-content {
    background: white;
    border-radius: 8px;
    padding: 20px;
    width: 80%;
    max-width: 500px;
    text-align: center;
    position: relative;
}

.modal-content h2 {
    margin-bottom: 20px;
}

.modal-content ul {
    list-style: none;
    padding: 0;
    margin: 0;
}

.modal-content li {
    margin: 10px 0;
}

.close-button {
    background: #f44336;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 10px 20px;
    font-size: 16px;
    cursor: pointer;
    margin-top: 20px;
}

.close-button:hover {
    background: #e53935;
}
</style>