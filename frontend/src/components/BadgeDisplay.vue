<template>
  <div class="badge-section">
    <h2>擁有徽章</h2>
    <div v-if="userBadges.length > 0" class="badges">
      <div v-for="badge in userBadges" :key="badge.BadgeId" class="badge-item">
        <div class="button-group">
          <button @click="showEffectDialog(badge)">效果</button>
          <button @click="showTransferDialog(badge)">轉移</button>
        </div>
        <img :src="getBadgeImage(badge.BadgeId)" :alt="'Badge ' + badge.BadgeId" class="badge-image" />
      </div>
    </div>
    <p v-else>尚未獲得任何徽章</p>
  </div>
</template>

<script>
import axios from 'axios';
import Swal from "sweetalert2";

export default {
  props: {
    walletAddress: {
      type: String,
      required: true
    },
    refreshKey: Number,
    userTimeCoin: Number
  },
  watch: {
    async refreshKey() {
      await this.fetchBadges();
    }
  },
  async mounted() {
    await this.fetchBadges();
  },
  data() {
    return {
      userBadges: [],
    };
  },
  methods: {
    getBadgeImage(badgeId) {
      return `/images/badges/${badgeId}.png`; // 直接對應 public 目錄中的圖片
    },
    async fetchBadges() {
      try {
        const response = await axios.post(`${process.env.VUE_APP_API_URL}/get-user-badge`, { walletAddress: this.walletAddress });
        this.userBadges = response.data.badges;
      } catch (error) {
        console.error("取得徽章時發生錯誤:", error);
      }
    },
    async showEffectDialog(badge) {
      Swal.fire({
        title: `徽章效果`,
        html: `<p><strong>${badge.Name}</strong></p>
               <p><strong>您持有 ${badge.Quantity} 個</strong></p>
              `,
        icon: 'info',
        confirmButtonText: '確定'
      });
    },
    async showTransferDialog(badge) {
      const { value: formValues } = await Swal.fire({
        title: "轉移徽章",
        html:
          '<input id="walletAddress" class="swal2-input" placeholder="輸入對方的錢包地址">' +
          `<input id="quantity" type="number" class="swal2-input" placeholder="輸入數量 (最多 ${badge.Quantity})">`,
        focusConfirm: false,
        preConfirm: () => {
          return {
            toWalletAddress: document.getElementById("walletAddress").value,
            quantity: parseInt(document.getElementById("quantity").value, 10)
          };
        }
      });

      if (!formValues) return;

      const { toWalletAddress, quantity } = formValues;

      // **前端檢查**
      if (!toWalletAddress || quantity <= 0) {
        Swal.fire("錯誤", "請輸入有效的錢包地址與數量", "error");
        return;
      }

      if (toWalletAddress === this.walletAddress) {
        Swal.fire("錯誤", "不能轉移給自己", "error");
        return;
      }
      if (quantity > badge.Quantity) {
        Swal.fire("錯誤", "數量超過你擁有的徽章數量", "error");
        return;
      }
      if (this.userTimeCoin < 5) {
        Swal.fire("錯誤", "你的 TC 低於 5，無法進行轉移", "error");
        return;
      }

      // 發送 API 請求
      try {
        const payload = {
          fromWalletAddress: this.walletAddress,
          toWalletAddress,
          badgeId: badge.BadgeId,
          quantity
        }

        const response = await axios.post(`${process.env.VUE_APP_API_URL}/transfer-badge`, payload);

        if (response.data.success) {
          Swal.fire("成功", "徽章已成功轉移!", "success");
          await this.fetchBadges();
        } else {
          Swal.fire("錯誤", response.data.message, "error");
        }
      } catch (error) {
        console.error("轉移時發生錯誤:", error);
        Swal.fire("錯誤", "轉移失敗，請稍後再試", "error");
      }
    }
  }
};
</script>

<style scoped>
.badge-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  /* 讓內容水平置中 */
  justify-content: center;
  /* 讓內容垂直置中（如果有需要） */
  padding: 20px;
  border-radius: 10px;
}

.badges {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  justify-content: center;
  /* 讓徽章水平置中 */
}

.badge-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  border-radius: 10px;
  background-color: transparent;
  /* 取消白色背景 */
  text-align: center;
  width: 100px;
}

.badge-image {
  width: 80px;
  height: 80px;
  object-fit: cover;
  display: block;
  margin: 0 auto;
}

.button-group {
  display: flex;
  gap: 10px;
  /* 按鈕之間的間距 */
}

button {
  border: none;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease-in-out;
  background: linear-gradient(to right, #ff7eb3, #ff758c);
  /* 漸變色 */
  color: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15);
}

button:hover {
  background: linear-gradient(to right, #ff6584, #ff4b6b);
  /* 滑鼠移入時的漸變 */
  transform: translateY(-2px);
}

button:active {
  transform: scale(0.95);
}
</style>