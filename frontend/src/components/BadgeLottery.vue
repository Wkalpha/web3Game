<template>
  <div class="prize-item-pool">
    <h1>抽徽章</h1>
    <button @click="openPrizeModal()" class="draw-button">
      開始
    </button>
    <!-- Modal 彈窗 -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <button @click="drawPrize()" class="draw-button" :class="{ 'disabled-button': ticket <= 0 }"
          :disabled="ticket <= 0">
          開始抽獎
        </button>
        <ul>
          <li v-for="(item, index) in badges" :key="index">
            <strong>{{ item.Name }}</strong> - 機率: {{ item.DropRatePercent }}
          </li>
        </ul>
        <!-- 新增的說明按鈕 -->
        <button @click="showPrizeDescription" class="info-button">說明</button>
        <button @click="closeModal" class="close-button">關閉</button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import Swal from 'sweetalert2';

export default {
  name: 'BadgeLottery',
  props: {
    walletAddress: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      badges: [],
      showModal: false, // 控制 Modal 顯示
    };
  },
  methods: {
    async openPrizeModal() {
      this.showModal = true;
      await this.getBadge();
    },
    // 顯示說明
    showPrizeDescription() {
      Swal.fire({
        title: '說明',
        html: `
              <p>1. 需消耗徽章抽獎券 1 張。</p>
              `,
        icon: 'info',
        confirmButtonText: '了解了',
      });
    },
    // 關閉 Modal
    closeModal() {
      this.showModal = false;
    },
    async getBadge() {
      await axios.get('http://localhost:3000/get-badges').then(rs => {
        this.badges = rs.data.badges;
        console.log(rs)
      });
    },
    async drawPrize() {
      try {
        const payload = {
          walletAddress: this.walletAddress
        };

        // 1. 開始輪詢動畫
        const interval = setInterval(() => {
          const randomIndex = Math.floor(Math.random() * this.badges.length);
          Swal.update({
            html: `<h2>正在抽獎...</h2><p>獎品：${this.badges[randomIndex].Name}</p>`,
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

            // 3. 發送請求
            const response = await axios.post('http://localhost:3000/draw-badge', payload);
            const finalPrize = response.data.prize;

            // 4. 停止輪詢動畫
            clearInterval(interval);

            // 5. 更新 SweetAlert 顯示抽中的獎品
            Swal.fire({
              title: '恭喜！',
              html: `<h2>抽中：${finalPrize.Name}</h2>`,
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
  background-color: gray;
  /* 禁用時按鈕的背景色 */
  cursor: not-allowed;
  /* 禁用時改變游標 */
  opacity: 0.6;
  /* 禁用時的透明度 */
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