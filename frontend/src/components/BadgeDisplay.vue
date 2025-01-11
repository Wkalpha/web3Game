<template>
  <div class="badge-section">
    <h2>擁有徽章</h2>
    <div v-if="userBadges.length > 0" class="badges">
      <div v-for="badge in userBadges" :key="badge.BadgeId" class="badge-item">
        <div class="button-group">
          <button>效果</button>
          <button>轉移</button>
        </div>
        <img :src="getBadgeImage(badge.BadgeId)" :alt="'Badge ' + badge.BadgeId" class="badge-image" />
      </div>
    </div>
    <p v-else>尚未獲得任何徽章</p>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  props: {
    walletAddress: {
      type: String,
      required: true
    },
  },
  async mounted() {
    await axios.post('http://localhost:3000/get-user-badge', { walletAddress: this.walletAddress })
      .then(rs => {
        this.userBadges = rs.data.badges; // 確保正確存取陣列
        console.log(this.userBadges);
      })
      .catch(err => {
        console.error("取得徽章時發生錯誤:", err);
      });
  },
  data() {
    return {
      userBadges: [],
    };
  },
  methods: {
    getBadgeImage(badgeId) {
      return `/images/badges/${badgeId}.png`; // 直接對應 public 目錄中的圖片
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