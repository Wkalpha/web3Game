<template>
    <div>
        <button @click="openModal">道具</button>

        <!-- Modal -->
        <div v-if="isModalVisible" class="modal-overlay">
            <div class="modal">
                <div class="modal-header">
                    <h3>使用者物品清單</h3>
                    <button @click="closeModal">X</button>
                </div>
                <div class="modal-body">
                    <table v-if="inventory && inventory.length > 0">
                        <thead>
                            <tr>
                                <th>物品名稱</th>
                                <th>數量</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="item in inventory" :key="item.InventoryId">
                                <td>{{ item.ItemName }}</td>
                                <td>{{ item.Quantity }}</td>
                            </tr>
                        </tbody>
                    </table>
                    <p v-else>尚無道具資料。</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import axios from 'axios';

export default {
    name: 'UserInventory',
    props: {
        walletAddress: {
            type: String,
            required: true
        },
    },
    data() {
        return {
            inventory: null, // 保存物品數據
            isModalVisible: false, // 控制 Modal 顯示
        };
    },
    mounted() {
        this.getInventory();
    },
    methods: {
        async openModal(){
            this.isModalVisible = true; // 打開 Modal
            await this.getInventory();
        },
        async getInventory() {
            const payload = {
                walletAddress: this.walletAddress,
            };

            try {
                const response = await axios.post('http://localhost:3000/get-inventory', payload);
                this.inventory = response.data.inventory || [];
                this.$emit('get-inventory', this.inventory);
            } catch (error) {
                console.error('獲取物品清單失敗:', error);
                alert('獲取物品清單失敗，請稍後再試');
            }
        },
        closeModal() {
            this.isModalVisible = false; // 關閉 Modal
        },
        formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleString(); // 本地化日期格式
        },
    },
};
</script>

<style scoped>
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
}

.modal {
    background: white;
    padding: 20px;
    border-radius: 8px;
    width: 80%;
    max-height: 80%;
    overflow-y: auto;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.modal-body {
    overflow-y: auto;
}

table {
    width: 100%;
    border-collapse: collapse;
}

th,
td {
    border: 1px solid #ccc;
    padding: 8px;
    text-align: left;
}

th {
    background-color: #f4f4f4;
}
</style>
