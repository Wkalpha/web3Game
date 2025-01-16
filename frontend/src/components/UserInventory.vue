<template>
    <div>
        <button @click="openModal">包包</button>

        <!-- Modal -->
        <div v-if="isModalVisible" class="modal-overlay">
            <div class="modal">
                <div class="modal-header">
                    <h3>包包</h3>
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
                            <tr v-for="item in filteredInventory" :key="item.InventoryId">
                                <td>{{ item.ItemName }}</td>
                                <td>{{ item.Quantity }}<button
                                        v-if="item.ItemType == 'Currency' || item.ItemType == 'Ticket' || item.ItemType == 'PermanentBuff'"
                                        @click="useInventory(item.ItemId, item.ItemType)">使用</button>
                                </td>

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
import Swal from 'sweetalert2';

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
    computed: {
        filteredInventory() {
            return this.inventory.filter(item => item.Quantity > 0);
        }
    },
    methods: {
        async useInventory(itemId, itemType) {
            const payload = {
                walletAddress: this.walletAddress,
                itemId
            };
            await axios.post(`${process.env.VUE_APP_API_URL}/use-item`, payload).then(rs => {
                if (itemType == 'Ticket') {
                    Swal.fire({
                        title: '抽獎中',
                        html: `<h2>正在抽獎...</h2>`,
                        allowOutsideClick: false,
                        showConfirmButton: false,
                        didOpen: async () => {
                            Swal.showLoading();

                            const finalPrize = rs.data.prize;

                            // SweetAlert 顯示抽中的獎品
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
            this.getInventory();
        },
        async openModal() {
            this.isModalVisible = true; // 打開 Modal
            await this.getInventory();
        },
        async getInventory() {
            const payload = {
                walletAddress: this.walletAddress,
            };

            try {
                const response = await axios.post(`${process.env.VUE_APP_API_URL}/get-inventory`, payload);
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
