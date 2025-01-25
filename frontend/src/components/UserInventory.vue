<template>
    <div>
        <button class="open-modal-btn" @click="openModal">包包</button>

        <!-- Modal -->
        <div v-if="isModalVisible" class="modal-overlay">
            <div class="modal">
                <div class="modal-header">
                    <h3>包包</h3>
                    <button class="close-btn" @click="isModalVisible = false">&times;</button>
                </div>
                <div class="modal-body">
                    <table v-if="gameStore.inventory && gameStore.inventory.length > 0" class="inventory-table">
                        <thead>
                            <tr>
                                <th>物品名稱</th>
                                <th>數量</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="item in filteredInventory" :key="item.InventoryId">
                                <td>{{ item.ItemName }}</td>
                                <td>
                                    {{ item.Quantity }}
                                    <button v-if="['Currency', 'Ticket', 'PermanentBuff'].includes(item.ItemType)"
                                        class="use-btn" @click="useInventory(item.ItemId, item.ItemType)">
                                        使用
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <p v-else class="no-items">尚無道具資料。</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useGameStore } from '@/stores/game';

const gameStore = useGameStore();

const isModalVisible = ref(false);

const filteredInventory = computed(() => gameStore.inventory.filter(item => item.Quantity > 0));

const useInventory = async (itemId, itemType) => {
    const payload = { walletAddress: gameStore.walletAddress, itemId };
    await axios.post(`${process.env.VUE_APP_API_URL}/use-item`, payload).then(rs => {
        if (itemType === 'Ticket') {
            Swal.fire({
                title: '抽獎中',
                html: `<h2>正在抽獎...</h2>`,
                allowOutsideClick: false,
                showConfirmButton: false,
                didOpen: async () => {
                    Swal.showLoading();
                    const finalPrize = rs.data.prize;
                    Swal.fire({
                        title: '恭喜！',
                        html: `<h2>抽中獎品：${finalPrize.ItemName}</h2><p>數量：${finalPrize.ItemValue}</p>`,
                        icon: 'success',
                        confirmButtonText: '確定',
                    });
                },
            });
        }
    });
    await gameStore.getInventory();
};

const openModal = async () => {
    isModalVisible.value = true;
    await gameStore.getInventory();
};

onMounted(async () => {
    await gameStore.getInventory();
});
</script>

<style scoped>
.open-modal-btn {
    background: linear-gradient(135deg, #ff416c, #ff4b2b);
    color: white;
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    font-size: 18px;
    font-weight: bold;
    cursor: pointer;
    transition: transform 0.3s;
}

.open-modal-btn:hover {
    transform: scale(1.05);
}

.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal {
    background: rgba(50, 50, 50, 0.95);
    padding: 25px;
    border-radius: 15px;
    width: 60%;
    max-height: 80%;
    overflow-y: auto;
    box-shadow: 0 0 20px rgba(255, 71, 87, 0.7);
    animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: scale(0.9);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: #fff;
}

.close-btn {
    background: none;
    border: none;
    font-size: 28px;
    cursor: pointer;
    color: #ff4b2b;
}

.inventory-table {
    width: 100%;
    border-collapse: collapse;
}

.inventory-table th, .inventory-table td {
    border: 1px solid #ff4b2b;
    padding: 12px;
    text-align: left;
    color: #fff;
}

.inventory-table th {
    background: #ff416c;
}

.use-btn {
    background: #ff4b2b;
    color: #fff;
    padding: 6px 12px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
}

.no-items {
    text-align: center;
    color: #ddd;
    font-size: 20px;
}
</style>
