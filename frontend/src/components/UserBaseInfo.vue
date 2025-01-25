<template>
    <div class="user-base-info">
        <button @click="openModal" class="cool-button">角色資訊</button>

        <!-- Modal 彈窗 -->
        <div v-if="isModalVisible" class="modal-overlay">
            <div class="modal animated-modal">
                <div class="modal-header">
                    <h2 class="modal-title">角色資訊</h2>
                    <button @click="isModalVisible = false" class="close-button">&times;</button>
                </div>
                <div class="modal-body">
                    <p><strong>攻擊力倍率:</strong> {{ gameStore.userBaseInfo.BaseAttackPower }} 倍</p>
                    <p><strong>結算獎勵倍率:</strong> {{ gameStore.userBaseInfo.RewardMultiplier }} 倍</p>
                    <p><strong>每日可遊玩次數:</strong> {{ gameStore.userBaseInfo.BaseLeftOfPlay }} 次</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { useGameStore } from '@/stores/game';

const gameStore = useGameStore();

const isModalVisible = ref(false);

const openModal = async ()=>{
    await gameStore.getUserBaseInfo();
    isModalVisible.value = true;
}
</script>

<style scoped>
.user-base-info .cool-button {
    padding: 14px 28px;
    background: linear-gradient(135deg, #00f260, #0575e6);
    color: white;
    border: none;
    border-radius: 50px;
    cursor: pointer;
    font-size: 22px;
    font-weight: bold;
    transition: all 0.4s ease;
    box-shadow: 0 15px 30px rgba(5, 117, 230, 0.5);
    text-transform: uppercase;
    letter-spacing: 2px;
}

.user-base-info .cool-button:hover {
    background: linear-gradient(135deg, #0575e6, #00f260);
    transform: scale(1.1);
}

/* Modal 樣式 */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.85);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    backdrop-filter: blur(10px);
}

.modal {
    background: rgba(20, 20, 20, 0.95);
    color: #fff;
    padding: 50px;
    border-radius: 20px;
    width: 500px;
    max-width: 90%;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
    animation: popIn 0.5s ease-in-out;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 26px;
  font-weight: bold;
  text-transform: uppercase;
  color: #00f260;
  padding-bottom: 20px;
  border-bottom: 2px solid #0575e6;
}

.modal-title {
  margin: 0;
  flex-grow: 1;
  text-align: center;
}

.modal-header .close-button {
  background: none;
  border: none;
  font-size: 32px;
  cursor: pointer;
  color: #ff3e3e;
  transition: transform 0.3s ease, color 0.3s ease;
}

.modal-header .close-button:hover {
    color: #ff7575;
    transform: rotate(90deg);
}

.modal-body p {
    font-size: 22px;
    margin: 20px 0;
    line-height: 1.8;
    text-shadow: 0 3px 12px rgba(255, 255, 255, 0.3);
}

@keyframes popIn {
    0% {
        opacity: 0;
        transform: translateY(-50px) scale(0.8);
    }
    100% {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}
</style>
