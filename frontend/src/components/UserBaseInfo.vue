<template>
    <div class="user-base-info">
        <button @click="getUserBaseInfo">角色資訊</button>

        <!-- Modal 彈窗 -->
        <div v-if="isModalVisible" class="modal-overlay">
            <div class="modal">
                <div class="modal-header">
                    <h2>角色資訊</h2>
                    <button @click="closeModal">X</button>
                </div>
                <div class="modal-body">
                    <p><strong>攻擊力倍率:</strong> {{ characterInfo?.BaseAttackPower }} 倍</p>
                    <p><strong>結算獎勵倍率:</strong> {{ characterInfo?.RewardMultiplier }} 倍</p>
                    <p><strong>每日可遊玩次數:</strong> {{ characterInfo?.BaseLeftOfPlay }} 次</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import axios from 'axios';

export default {
    props: {
        walletAddress: {
            type: String,
            required: true,
        },
    },
    data() {
        return {
            isModalVisible: false,
            characterInfo: {}, // 保存角色資訊
        };
    },
    methods: {
        async getUserBaseInfo() {
            try {
                const payload = {
                    walletAddress: this.walletAddress
                }
                const response = await axios.post(`${process.env.VUE_APP_API_URL}/get-user-base-info`, payload);

                if (response.status !== 200) {
                    throw new Error("無法取得角色資訊");
                }

                this.characterInfo = response.data;
                this.isModalVisible = true;

            } catch (error) {
                console.error("Error fetching character info:", error);
                alert("取得角色資訊失敗");
            }
        },
        closeModal() {
            this.isModalVisible = false;
        },
    },
};
</script>

<style scoped>
.user-base-info button {
    padding: 8px 16px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.user-base-info button:hover {
    background-color: #0056b3;
}

/* Modal 樣式 */
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
    z-index: 1000;
}

.modal {
    background: rgb(255, 255, 255);
    padding: 20px;
    border-radius: 8px;
    width: 300px;
    max-width: 90%;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  position: relative; /* 讓子元素可以使用 absolute 定位 */
  justify-content: center; /* 初始水平置中 */
  align-items: center;
  margin-bottom: 16px;
}

.modal-header button {
  margin-left: auto; /* 推到最右 */
  position: absolute;
  right: 0; /* 固定到右側 */
  top: 0; /* 固定到頂部 */
}

.modal-header h3 {
    margin: 0;
}

.modal-body ul {
    list-style: none;
    padding: 0;
}

.modal-body li {
    margin-bottom: 8px;
}
</style>