<template>
  <div class="leaderboard-overlay" v-if="isVisible">
    <div class="leaderboard-content">
      <h2>本周排行榜</h2>
      <h3>(結算時間: {{ countdown }})</h3>
      <button class="close-button" @click="closeLeaderboard">X</button>

      <!-- 如果正在加載，則顯示加載中 -->
      <div v-if="isLoading" class="loading-message">數據加載中，請稍候...</div>

      <!-- 顯示排行榜數據 -->
      <ul class="leaderboard-list" v-else>
        <li v-for="(player, index) in players" :key="index">
          <span class="rank">R{{ index + 1 }}</span>
          <span class="player-name" :class="{ 'self-player': isSelf(player.WalletAddress) }">
            {{ formatWalletAddress(player.WalletAddress) }}
            <span v-if="isSelf(player.WalletAddress)" class="self-tag">(自己)</span>
          </span>
          <button class="bet-button" @click="placeBet(player)">下注{{ player.BetAmount }}</button>
          <span class="player-score">{{ player.Scores }}分</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import Swal from 'sweetalert2';
import axios from 'axios';

export default {
  name: 'ShowLeaderboard',
  props: {
    isVisible: {
      type: Boolean,
      required: true
    },
    players: {
      type: Array,
      required: true
    },
    isLoading: {
      type: Boolean,
      required: true
    },
    userWalletAddress: {
      type: String,
      required: true
    },
    userTimeCoin: {
      type: Number,
      required: true
    }
  },
  data() {
    return {
      betAmount: 0,
      countdown: '' // 確保 countdown 被聲明
    };
  },
  mounted() {
    this.updateCountdown();
    this.intervalId = setInterval(() => {
      this.updateCountdown();
    }, 1000);
  },
  beforeUnmount() {
    clearInterval(this.intervalId);
  },
  methods: {
    isSelf(walletAddress) {
      return walletAddress === this.userWalletAddress;
    },
    closeLeaderboard() {
      this.$emit('closeLeaderboard');
    },
    formatWalletAddress(address) {
      if (!address) return '';
      const firstPart = address.slice(0, 3);
      const lastPart = address.slice(-3);
      return `${firstPart}...${lastPart}`;
    },
    async placeBet(player) {
      const { value: betAmount } = await Swal.fire({
        title: '請輸入下注金額',
        input: 'number',
        html: `
          <strong>注意</strong>
          <ul style="text-align: left; font-size: 18px;">
            <li>✅ 最少 <strong>500</strong> Time Coin</li>
            <li>✅ 必須是 <strong>正整數</strong></li>
            <li>✅ 不得超過您擁有的 <strong>${this.userTimeCoin}</strong> Time Coin</li>
            <li>每周一 UTC 00:00 重置並計算獎勵</li>
          </ul>
        `,
        inputPlaceholder: '輸入 Time Coin',
        inputAttributes: {
          min: 500,
          step: 1
        },
        showCancelButton: true
      });

      if (!betAmount) return; // 使用者按取消

      const parsedAmount = parseInt(betAmount, 10);

      if (isNaN(parsedAmount) || parsedAmount < 500 || parsedAmount > this.userTimeCoin || parsedAmount <= 0) {
        Swal.fire({
          icon: 'error',
          title: '無效的下注金額',
          text: '請確認金額必須是正整數，最少 500 並且不能超過您所持有的 Time Coin。'
        });
        return;
      }

      this.betAmount = parsedAmount;

      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const firstDayOfYear = new Date(year, 0, 1);
      const pastDaysOfYear = Math.floor((currentDate - firstDayOfYear) / (24 * 60 * 60 * 1000));
      const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7); // 取得當前週數
      const yearWeek = `${year}${weekNumber.toString().padStart(2, '0')}`; // 例如：202450

      await axios.post('http://localhost:3000/leaderboard-add-bet', {
        fromWalletAddress: this.userWalletAddress,
        toWalletAddress: player.WalletAddress,
        betAmount: this.betAmount,
        yearWeek
      }).then(rs => {
        // 通知父組件
        this.$emit('bet-complete', { newUserTimeCoin: rs.data.userTimeCoin, newLeaderboard: rs.data.leaderboard });
        Swal.fire({
          icon: 'success',
          title: '下注成功',
          text: `您已成功下注 ${this.betAmount} Time Coin 給玩家 ${this.formatWalletAddress(player.WalletAddress)}`
        });
      })

    },
    updateCountdown() {
      const now = new Date();
      const nextReset = new Date();
      const dayOfWeek = now.getUTCDay();
      const daysUntilMonday = (8 - dayOfWeek) % 7;
      nextReset.setUTCDate(now.getUTCDate() + daysUntilMonday);
      nextReset.setUTCHours(0, 0, 0, 0);

      const diff = nextReset - now;
      const totalHours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = String(Math.floor((diff / (1000 * 60)) % 60)).padStart(2, '0');
      const seconds = String(Math.floor((diff / 1000) % 60)).padStart(2, '0');

      this.countdown = `${totalHours}:${minutes}:${seconds}`;
    }
  }
};
</script>

<style scoped>
/* 覆蓋全螢幕的背景 */
.leaderboard-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

/* 排行榜列表 */
.leaderboard-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.leaderboard-list li {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  border-bottom: 1px solid #ccc;
}

.leaderboard-list li:last-child {
  border-bottom: none;
}

/* 排行榜內容區域 */
.leaderboard-content {
  max-height: 80vh;
  width: 70%;
  overflow-y: auto;
  background: white;
}

.leaderboard-content::-webkit-scrollbar {
  width: 8px;
}

.leaderboard-content::-webkit-scrollbar-thumb {
  background-color: #888;
  border-radius: 4px;
}

.leaderboard-content::-webkit-scrollbar-thumb:hover {
  background-color: #555;
}

/* 關閉按鈕 */
.close-button {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: #ff4d4f;
  border: none;
  color: #fff;
  font-size: 18px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
}

.close-button:hover {
  background-color: #ff7875;
}

.rank {
  font-weight: bold;
  color: #333;
}

.player-name {
  flex: 1;
  text-align: left;
  padding-left: 10px;
}

.player-score {
  color: #ff4d4f;
  font-weight: bold;
}

/* 加載中的消息 */
.loading-message {
  font-size: 18px;
  color: #555;
  text-align: center;
  margin-top: 20px;
}

.self-player {
  color: red;
}

.self-tag {
  font-weight: bold;
  color: red;
  margin-left: 5px;
}
</style>