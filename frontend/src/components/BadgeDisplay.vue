<template>
  <div class="badge-section">
    <div v-if="!gameStore.userInfo || !gameStore.userInfo.badges">加載中...</div>
    <div class="badges" v-else-if="gameStore.userInfo.badges.length > 0">
      <div class="badge" v-for="badge in gameStore.userInfo.badges" :key="badge.BadgeId">
        <img :src="getBadgeImage(badge.BadgeId)" :alt="'Badge ' + badge.BadgeId" />
        <!-- 左下角按鈕 -->
        <button class="badge-button badge-button-left" @click="showEffectDialog(badge)">
          效果
        </button>
        <!-- 右下角按鈕 -->
        <button class="badge-button badge-button-right" @click="showTransferDialog(badge)">
          轉移
        </button>
      </div>
    </div>
    <p v-else>尚未獲得任何徽章</p>
  </div>

</template>

<script setup>
import { onMounted } from 'vue';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useGameStore } from '@/stores/game';

const gameStore = useGameStore();

const getBadgeImage = (badgeId) => `/images/badges/${badgeId}.png`;

const fetchBadges = async () => {
  try {
    const response = await axios.post(`${process.env.VUE_APP_API_URL}/get-user-badge`, {
      walletAddress: gameStore.walletAddress,
    });
    gameStore.userInfo.badges = response.data.badges;

  } catch (error) {
    console.error('取得徽章時發生錯誤:', error);
  }
};

const showEffectDialog = (badge) => {
  Swal.fire({
    title: `徽章效果`,
    html: `<p><strong>${badge.Name}</strong></p>
           <p><strong>您持有 ${badge.Quantity} 個</strong></p>`,
    icon: 'info',
    confirmButtonText: '確定',
  });
};

const showTransferDialog = async (badge) => {
  const { value: formValues } = await Swal.fire({
    title: '轉移徽章',
    html: `
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <input id="walletAddress" class="swal2-input" placeholder="輸入對方的錢包地址" />
        <input id="quantity" type="number" class="swal2-input" placeholder="輸入數量 (最多 ${badge.Quantity})" />
      </div>
    `,
    focusConfirm: false,
    preConfirm: () => {
      return {
        toWalletAddress: document.getElementById('walletAddress').value,
        quantity: parseInt(document.getElementById('quantity').value, 10),
      };
    },
  });

  if (!formValues) return;

  const { toWalletAddress, quantity } = formValues;

  if (!toWalletAddress || quantity <= 0 || quantity > badge.Quantity) {
    Swal.fire('錯誤', '請輸入有效的錢包地址與數量', 'error');
    return;
  }
  if (toWalletAddress === gameStore.walletAddress) {
    Swal.fire('錯誤', '不能轉移給自己', 'error');
    return;
  }
  if (gameStore.userInfo.timeCoin < 5) {
    Swal.fire('錯誤', '你的 TC 低於 5，無法進行轉移', 'error');
    return;
  }

  try {
    const payload = {
      fromWalletAddress: gameStore.walletAddress,
      toWalletAddress,
      badgeId: badge.BadgeId,
      quantity,
    };
    const response = await axios.post(`${process.env.VUE_APP_API_URL}/transfer-badge`, payload);
    if (response.data.success) {
      Swal.fire('成功', '徽章已成功轉移!', 'success');
      await fetchBadges();
    } else {
      Swal.fire('錯誤', response.data.message, 'error');
    }
  } catch (error) {
    console.error('轉移時發生錯誤:', error);
    Swal.fire('錯誤', '轉移失敗，請稍後再試', 'error');
  }
};

onMounted(fetchBadges);
</script>

<style scoped>
.badge-section {
  background: #333;
  padding: 1rem;
  border-radius: 8px;
}

.badges {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 15px;
  justify-content: center;
}

.badge {
  position: relative;
  aspect-ratio: 1; /* 保持正方形 */
  border-radius: 8px;
  overflow: hidden;
  background-color: #444;
}

.badge img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.badge-button {
  position: absolute;
  bottom: 5px;
  padding: 4px 8px;
  background-color: rgba(0, 0, 0, 0.4);
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.badge-button-left {
  left: 5px;
}

.badge-button-right {
  right: 5px;
}

.button {
  grid-column: span 1;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  font-weight: bold;
  cursor: pointer;
}
/* 小屏幕專用樣式 */
@media (max-width: 520px) {
  .badges {
    grid-template-columns: repeat(2, minmax(0, 1fr)); /* 強制兩列 */
  }
  
  .badge {
    min-width: 0; /* 允許內容壓縮 */
    width: 100%; /* 填滿 grid cell */
    aspect-ratio: 1; /* 保持正方形 */
  }
  
  .badge-button {
    padding: 2px 4px; /* 按鈕縮小 */
    font-size: 0.6rem; /* 字體縮小 */
  }
}
</style>