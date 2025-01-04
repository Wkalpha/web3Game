<template>
  <div class="game-container">
    <div class="user-info-row">
      <UserInventory :wallet-address="walletAddress" @get-inventory="handleInventory" />
      <UserBaseInfo :wallet-address="walletAddress"/>
    </div>
    <h2>遊戲</h2>
    <h2>剩餘可遊玩次數{{ leftOfPlay }}</h2>
    <div v-if="!gameStarted && !gameFinished">
      <h3>選擇難度</h3>
      <button @click="setDifficulty('Easy')">Easy</button>
      <button @click="setDifficulty('Normal')">Normal</button>
      <button @click="setDifficulty('Hard')">Hard</button>
      <div v-if="difficulty">
        <p>選擇的難度：{{ difficulty }}(賠率{{ odds }})</p>
        <p>投入 Time Coin</p>
        <input type="number" v-model.number="betAmount" placeholder="至少 100 Time Coin" />
        <div>
          <input type="checkbox" v-model="useNoItem" id="useNoItem" />
          <label for="useNoItem">不使用道具</label>
        </div>
        <button @click="onStartGame" :disabled="!canStartGame">開始對戰</button>
        <p v-if="betAmountError" class="error">{{ betAmountError }}</p>
      </div>
    </div>

    <div v-if="gameStarted">
      <p v-if="countdownTime >= 60">倒數時間：{{ Math.floor(countdownTime / 60) }} 分鐘</p>
      <p v-else>遊戲即將結束</p>
      <h3>回合 {{ currentRound }} / {{ gameRound }}</h3>
      <p v-if="!targetTime">目標秒數: -</p>
      <p v-else>目標秒數: {{ targetTime }}</p>
      <button v-if="!targetTime" @click="getTargetTime">取得目標時間</button>
      <button v-if="targetTime && !timing" @click="startTiming">攻擊</button>
      <button v-if="timing" @click="stopTiming">停止</button>
      <p v-if="timing">計時中...</p>
      <p v-if="elapsedTime">您的秒數:{{ elapsedTime }}</p>
      <p v-if="!timing && currentRoundScore !== null">本回合得分：{{ currentRoundScore }}</p>
      <p>總分：{{ totalScore }}</p>
    </div>

    <div v-if="gameFinished">
      <h3>遊戲結束</h3>
      <p>總分：{{ totalScore }}</p>
      <p>{{ resultMessage }}</p>
      <p>{{ balanceChange }}</p>
      <button @click="resetGame">重新開始</button>
    </div>

    <!-- 道具選擇 Modal -->
    <div v-if="isModalVisible" class="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h3>選擇一個道具使用</h3>
          <button @click="closeModal">X</button>
        </div>
        <div class="modal-body">
          <ul>
            <li v-for="item in inventory" :key="item.InventoryId">
              <button @click="selectItem(item)">{{ item.ItemName }}</button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import UserInventory from './UserInventory.vue';
import UserBaseInfo from './UserBaseInfo.vue';

export default {
  name: 'TimeSniper',
  props: {
    userTimeCoin: {
      type: Number,
      required: true,
    },
    leftOfPlay: {
      type: Number,
      required: true,
    },
    walletAddress: {
      type: String,
      required: true
    }
  },
  components: {
    UserInventory,
    UserBaseInfo
  },
  data() {
    return {
      gameId: null,
      difficulty: null,
      betAmount: null,
      odds: 0,
      betAmountError: '',
      gameStarted: false,
      targetTime: null,
      timing: false,
      elapsedTime: null, // 計時的經過時間
      currentRound: 1,
      gameRound: 0,
      threshold: 0,
      totalScore: 0,
      currentRoundScore: null,
      countdownTime: 180, // 3分鐘倒數時間，單位為秒
      countdownInterval: null,
      gameFinished: false,
      inventory: null,
      isModalVisible: false, // 控制道具選擇 Modal 顯示
      useNoItem: false
    };
  },
  computed: {
    canStartGame() {
      return (
        Number.isInteger(this.betAmount) &&
        this.betAmount >= 100 &&
        this.betAmount <= this.userTimeCoin &&
        !!this.difficulty &&
        this.leftOfPlay > 0
      );
    },
    resultMessage() {
      return this.totalScore >= this.threshold ? '恭喜你贏了！' : '很遺憾，你輸了。';
    },
    balanceChange() {
      if (this.totalScore >= this.threshold) {
        return `獲得 ${this.betAmount * this.odds} Time Coin`
      }
      else {
        return `失去 ${this.betAmount} Time Coin`
      }
    },
  },
  methods: {
    startCountdown() {
      this.countdownTime = 180;
      this.countdownInterval = setInterval(() => {
        if (this.countdownTime > 0) {
          this.countdownTime--;
        } else {
          clearInterval(this.countdownInterval);
          this.gameFinished = true;
          this.gameStarted = false;
        }
      }, 1000);
    },
    setDifficulty(level) {
      this.difficulty = level;
      switch (this.difficulty) {
        case 'Easy':
          this.odds = 0.01;
          break;
        case 'Normal':
          this.odds = 0.03;
          break;
        case 'Hard':
          this.odds = 0.1;
          break;
        default:
          break;
      }
    },
    handleInventory(inventory) {
      this.inventory = inventory.filter(item => item.ItemType === 'DamageBuff' || item.ItemType === 'FinalBuff' || item.ItemType === 'FunctionalBuff');
    },
    async onStartGame() {
      if (this.betAmount <= 0 || this.betAmount > this.userTimeCoin) {
        this.betAmountError = '下注金額必須大於0且不能超過餘額';
        return;
      }
      this.betAmountError = '';

      // 如果未勾選 "不使用道具"，則彈出選擇道具的 Modal
      if (!this.useNoItem) {
        this.isModalVisible = true;
        return;
      }

      // 如果勾選了 "不使用道具"，直接開始遊戲
      this.startGame();
    },
    selectItem(item) {
      this.selectedItem = item; // 設定選中的道具
      this.isModalVisible = false; // 關閉 Modal
      this.startGame(); // 開始遊戲
    },
    closeModal() {
      this.isModalVisible = false; // 關閉 Modal
    },
    async startGame() {
      this.gameStarted = true;

      switch (this.difficulty) {
        case 'Easy':
          this.odds = 0.01;
          break;
        case 'Normal':
          this.odds = 0.03;
          break;
        case 'Hard':
          this.odds = 0.1;
          break;
        default:
          break;
      }

      const payload = {
        walletAddress: this.walletAddress,
        level: this.difficulty,
        odds: this.odds,
        amountInput: this.betAmount,
        itemId: this.selectedItem ? this.selectedItem.ItemId : null, // 傳遞選中的道具
      }

      // console.log(payload)

      await axios.post('http://localhost:3000/update-balance-when-game-start', payload).then(rs => {
        this.startCountdown();
        this.gameId = rs.data.gameId;
        this.gameRound = rs.data.gameRound;
        this.threshold = rs.data.threshold;
        // 通知父組件
        this.$emit('game-start', { leftOfPlay: rs.data.leftOfPlay, timeCoin: rs.data.timeCoin });
      })

    },
    async getTargetTime() {
      // 打後端取得時間
      const payload = {
        gameId: this.gameId,
        walletAddress: this.walletAddress
      }
      await axios.post('http://localhost:3000/getTargetTime', payload).then(rs => {
        this.targetTime = rs.data.targetTime;
      });

    },
    async startTiming() {
      this.timing = true;
      // 打後端開始計時
      const payload = {
        gameId: this.gameId
      }
      await axios.post('http://localhost:3000/start-timer', payload);
    },
    async stopTiming() {
      this.timing = false;
      // 打後端停止計時
      const payload = {
        gameId: this.gameId
      }

      await axios.post('http://localhost:3000/end-timer', payload).then(rs => {
        this.totalScore += rs.data.scores;
        this.elapsedTime = rs.data.elapsedTime;
      })

      // 回合結束
      this.targetTime = null;
      this.currentRound++;
      
      if (this.currentRound > this.gameRound) {
        this.gameFinished = true;
        this.gameStarted = false;
        clearInterval(this.countdownInterval);
      }
    },
    resetGame() {
      clearInterval(this.countdownInterval);
      this.difficulty = null;
      this.betAmount = null;
      this.betAmountError = '';
      this.gameStarted = false;
      this.targetTime = null;
      this.elapsedTime = null;
      this.timing = false;
      this.currentRound = 1;
      this.totalScore = 0;
      this.currentRoundScore = null;
      this.gameFinished = false;
      this.countdownTime = 180;
      this.selectedItem = null;
    },
  },
};
</script>

<style>
.game-container {
  margin: 20px auto;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 10px;
  width: 300px;
  text-align: center;
}

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

ul {
  list-style: none;
  padding: 0;
}

li {
  margin: 10px 0;
}

button {
  margin: 5px;
  padding: 5px 10px;
}

.error {
  color: red;
}
.user-info-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.user-info-row > * {
  flex: 1;
}

.user-info-row > :first-child {
  margin-right: 16px; /* 可調整兩側之間的間距 */
}
</style>
