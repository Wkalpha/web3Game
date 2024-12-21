<template>
    <div class="prize-item-pool">
        <h1>抽獎</h1>
        <div v-if="prizeItemPools.length === 0">加載中...</div>
        <div v-else>
            <div v-for="(prizeItemPool, index) in prizeItemPools" :key="index">
                <button @click="openPrizeModal(prizeItemPool.PoolName)" class="draw-button">
                    {{ prizeItemPool.PoolName }}
                </button>
            </div>
        </div>
        <!-- Modal 彈窗 -->
        <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
            <div class="modal-content">
                <h2>{{ selectedPoolName }}</h2>
                <button @click="drawPrize(selectedPoolName)" class="draw-button">
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

export default {
    name: 'PrizeItemPool',
    props: {
        walletAddress: {
            type: String,
            required: true
        }
    },
    data() {
        return {
            prizeItemPools: [],
            prizeItems: [],
            showModal: false, // 控制 Modal 顯示
            selectedPoolName: '' // 選中的獎池名稱
        };
    },
    mounted() {
        this.getPrizeItemPool(); // 調用方法
    },
    methods: {
        // 打開 Modal 並加載對應獎品列表
        async openPrizeModal(poolName) {
            this.selectedPoolName = poolName;
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