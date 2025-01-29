<template>
  <!-- ❶ 先放一個在最外層、位置固定的「返回」按鈕 -->
  <button @click="goBack" class="btn-back">返回</button>
  <div class="time-battle-wrapper">

    <div class="time-battle-container">
      <!-- 難度選擇階段 -->
      <div v-if="!gameStarted && !gameFinished" class="difficulty-stage">
        <h3>選擇難度</h3>
        <div class="difficulty-buttons">
          <button @click="setDifficulty('Easy')">Easy</button>
          <button @click="setDifficulty('Normal')">Normal</button>
          <button @click="setDifficulty('Hard')">Hard</button>
        </div>

        <div v-if="difficulty" class="difficulty-info">
          <p>賠率: {{ odds }}</p>
          <p>獲勝門檻: {{ threshold }} 分</p>
          <p>投入 Time Coin</p>
          <input type="number" v-model.number="betAmount" placeholder="至少 100 Time Coin" />
          <div class="checkbox-container">
            <input type="checkbox" v-model="useNoItem" id="useNoItem" />
            <label for="useNoItem">不使用道具</label>
          </div>
          <button @click="onStartGame" :disabled="!canStartGame">開始對戰</button>
          <p v-if="betAmountError" class="error">{{ betAmountError }}</p>
        </div>
      </div>

      <!-- 遊戲進行階段 -->
      <div v-if="gameStarted" class="game-stage">
        <p v-if="countdownTime >= 60">倒數時間：{{ Math.floor(countdownTime / 60) }} 分鐘</p>
        <p v-else>遊戲即將結束</p>
        <h3>回合 {{ currentRound }} / {{ gameRound }}</h3>
        <p>獲勝門檻: {{ threshold }} 分</p>

        <p v-if="!targetTime">目標秒數: -</p>
        <p v-else>目標秒數: {{ targetTime }}</p>

        <button v-if="!targetTime" @click="getTargetTime">取得目標時間</button>
        <button v-if="targetTime && !timing" @click="startTiming">攻擊</button>
        <button v-if="timing" @click="stopTiming">停止</button>

        <p v-if="timing">計時中...</p>
        <p v-if="elapsedTime">您的秒數: {{ elapsedTime }}</p>
        <p v-if="!timing && currentRoundScore !== null">本回合得分：{{ currentRoundScore }}</p>
        <p>總分：{{ totalScore }}</p>
      </div>

      <!-- 結算階段 -->
      <div v-if="gameFinished" class="game-finished-stage">
        <h3>遊戲結束</h3>
        <p>獲勝門檻: {{ threshold }} 分</p>
        <p>總分：{{ totalScore }} 分</p>
        <p>{{ showText }}</p>
        <button @click="getGameLog">遊戲紀錄</button>
        <button @click="resetGame">重新開始</button>
      </div>

      <!-- 道具選擇 Modal -->
      <div v-if="isSelectItemModalVisible" class="modal-overlay">
        <div class="modal">
          <div class="modal-header">
            <h3>選擇一個道具使用</h3>
            <button @click="isSelectItemModalVisible = false">X</button>
          </div>
          <div class="modal-body">
            <ul>
              <li v-for="item in inventory" :key="item.InventoryId">
                <button @click="selectItem(item)">{{ item.ItemName }}</button>
              </li>
            </ul>
            <button @click="noUseItem()" class="black-button">不使用道具</button>
          </div>
        </div>
      </div>

      <!-- Game Log Modal -->
      <div v-if="isGameLogModalVisible" class="modal-overlay">
        <div class="modal">
          <div class="modal-header">
            <h3>遊戲紀錄</h3>
            <button @click="isGameLogModalVisible = false">X</button>
          </div>
          <div class="modal-body">
            <div v-if="gameLog">
              <div v-for="(log, index) in gameLog" :key="index" class="log-entry">
                <p>回合數: {{ log.Round }}</p>
                <p>目標秒數: {{ log.TargetTime }}</p>
                <p>得分: {{ log.Scores }}</p>
                <hr v-if="index < gameLog.length - 1" />
              </div>
            </div>
            <div v-else>
              <p>載入中...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import axios from 'axios';
import { useGameStore } from '@/stores/game';
import { useRouter } from 'vue-router';

const router = useRouter();
function goBack() {
  router.go(-1);
}

const gameStore = useGameStore();

const gameId = ref(null);
const difficulty = ref(null);
const betAmount = ref(null);
const odds = ref(0);
const betAmountError = ref('');
const gameStarted = ref(false);
const gameFinished = ref(false);
const targetTime = ref(null);
const timing = ref(false);
const elapsedTime = ref(null);
const currentRound = ref(1);
const gameRound = ref(0);
const threshold = ref(0);
const totalScore = ref(0);
const currentRoundScore = ref(null);
const countdownTime = ref(180);
const countdownInterval = ref(null);
const inventory = ref(null);
const useNoItem = ref(false);
const selectedItem = ref(null);
const gameLog = ref([]);
const isGameLogModalVisible = ref(false);
const showText = ref(null);

const isSelectItemModalVisible = ref(false);

const canStartGame = computed(() => {
  return (
    Number.isInteger(betAmount.value) &&
    betAmount.value >= 100 &&
    betAmount.value <= gameStore.userInfo.timeCoin &&
    !!difficulty.value &&
    gameStore.userInfo.leftOfPlay > 0
  );
});

const startCountdown = () => {
  countdownTime.value = 180;
  countdownInterval.value = setInterval(() => {
    if (countdownTime.value > 0) {
      countdownTime.value--;
    } else {
      clearInterval(countdownInterval.value);
      gameFinished.value = true;
      gameStarted.value = false;
    }
  }, 1000);
};

const setDifficulty = (level) => {
  difficulty.value = level;
  switch (level) {
    case 'Easy':
      odds.value = 0.01;
      threshold.value = 40;
      break;
    case 'Normal':
      odds.value = 0.03;
      threshold.value = 100;
      break;
    case 'Hard':
      odds.value = 0.1;
      threshold.value = 130;
      break;
  }
};

const fetchUseableItem = async () => {
  try {
    const response = await axios.post(`${process.env.VUE_APP_API_URL}/get-battle-item`, {
      walletAddress: gameStore.walletAddress,
    });
    inventory.value = response.data.inventory;
  } catch (error) {
    console.error('錯誤:', error);
  }
};

const selectItem = (item) => {
  selectedItem.value = item; // 設定選中的道具
  isSelectItemModalVisible.value = false; // 關閉 Modal
  startGame(); // 開始遊戲
};

const noUseItem = () => {
  isSelectItemModalVisible.value = false; // 關閉 Modal
  startGame(); // 開始遊戲
};

const onStartGame = async () => {
  if (betAmount.value <= 0 || betAmount.value > gameStore.userInfo.timeCoin) {
    betAmountError.value = '下注金額必須大於0且不能超過餘額';
    return;
  }
  betAmountError.value = '';

  await fetchUseableItem();
  if (inventory.value && inventory.value.length === 0) {
    startGame();
    return;
  }

  if (!useNoItem.value && inventory.value.length > 0) {
    isSelectItemModalVisible.value = true;
    return;
  }

  startGame();
};

const startGame = async () => {
  gameStarted.value = true;
  try {
    const payload = {
      walletAddress: gameStore.walletAddress,
      level: difficulty.value,
      amountInput: betAmount.value,
      itemId: selectedItem.value ? selectedItem.value.ItemId : null,
    };
    const response = await axios.post(`${process.env.VUE_APP_API_URL}/update-balance-when-game-start`, payload);
    gameId.value = response.data.gameId;
    gameRound.value = response.data.gameRound;
    startCountdown();
  } catch (error) {
    console.error('錯誤:', error);
  }
};

const getTargetTime = async () => {
  try {
    const payload = {
      gameId: gameId.value,
      walletAddress: gameStore.walletAddress
    }
    await axios.post(`${process.env.VUE_APP_API_URL}/getTargetTime`, payload).then(rs => {
      targetTime.value = rs.data.targetTime;
    });
  } catch (error) {
    console.error('錯誤:', error);
  }
};

const startTiming = async () => {
  timing.value = true;
  // 打後端開始計時
  const payload = {
    gameId: gameId.value
  }
  await axios.post(`${process.env.VUE_APP_API_URL}/start-timer`, payload);
};

const stopTiming = async () => {
  timing.value = false;
  // 打後端停止計時
  const payload = {
    gameId: gameId.value
  }

  await axios.post(`${process.env.VUE_APP_API_URL}/end-timer`, payload).then(rs => {
    totalScore.value += rs.data.scores;
    elapsedTime.value = rs.data.elapsedTime;
  })

  // 回合結束
  targetTime.value = null;
  currentRound.value++;

  if (currentRound.value > gameRound.value) {
    gameFinished.value = true;
    gameStarted.value = false;
    showText.value = gameStore.showText;

    clearInterval(countdownInterval.value);
  }
};

const getGameLog = async () => {
  const payload = {
    gameId: gameId.value
  }
  try {
    const response = await axios.post(`${process.env.VUE_APP_API_URL}/game-log`, payload);
    gameLog.value = response.data.gameLog;
    isGameLogModalVisible.value = true;
  } catch (error) {
    console.error('錯誤:', error);
  }
}

const resetGame = () => {
  clearInterval(countdownInterval.value);
  difficulty.value = null;
  betAmount.value = null;
  betAmountError.value = '';
  gameStarted.value = false;
  targetTime.value = null;
  elapsedTime.value = null;
  timing.value = false;
  currentRound.value = 1;
  totalScore.value = 0;
  currentRoundScore.value = null;
  gameFinished.value = false;
  countdownTime.value = 180;
  selectedItem.value = null;
  showText.value = '';
};
</script>

<style scoped>
.time-battle-wrapper {
  display: flex;
  justify-content: center;
  /* 水平置中 */
  align-items: center;
  /* 垂直置中 */
}

.time-battle-container {
  font-family: 'Orbitron', sans-serif;
  border-radius: 8px;
  color: #e5e5e5;
  padding: 2rem;
  box-sizing: border-box;
}

/* 文字標題 */
h3 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #21f1ff;
  /* 科技感的螢光藍色 */
}

/* 按鈕的統一風格 */
button {
  font-family: inherit;
  background: transparent;
  color: #21f1ff;
  border: 1px solid #21f1ff;
  padding: 0.5rem 1rem;
  margin: 0.25rem;
  cursor: pointer;
  transition: all 0.25s ease;
  outline: none;
  text-transform: uppercase;
}

button:hover {
  background: #21f1ff;
  color: #0e0e0e;
  box-shadow: 0 0 8px #21f1ff;
}

/* 在disabled時改為灰色 */
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
  border-color: #555;
  color: #555;
}

/* 針對黑色特別按鈕 (如不使用道具) */
.black-button {
  background: #333;
  border: 1px solid #333;
  color: #fff;
}

.black-button:hover {
  background: #555;
  border-color: #555;
  color: #fff;
  box-shadow: 0 0 8px #555;
}

/* 輸入框 */
input[type="number"] {
  background: #1c1c1c;
  border: 1px solid #21f1ff;
  color: #21f1ff;
  padding: 0.25rem 0.5rem;
  margin-top: 0.5rem;
  outline: none;
  transition: border 0.2s;
}

input[type="number"]:focus {
  border-color: #5bf1ff;
}

/* 錯誤訊息 */
.error {
  color: #ff5757;
  margin-top: 0.5rem;
}

/* 階段容器分段 */
.difficulty-stage,
.game-stage,
.game-finished-stage {
  margin-bottom: 2rem;
  border: 1px solid #21f1ff;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 0 15px rgba(33, 241, 255, 0.2);
}

/* 小區塊排版 */
.difficulty-buttons {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.difficulty-info {
  margin-top: 1rem;
}

.checkbox-container {
  display: flex;
  align-items: center;
  margin: 0.5rem 0;
}

/* modal區 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(14, 14, 14, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.modal {
  background: #1c1c1c;
  border: 1px solid #21f1ff;
  box-shadow: 0 0 15px rgba(33, 241, 255, 0.2);
  width: 80%;
  max-width: 600px;
  border-radius: 8px;
  padding: 1rem;
  position: relative;
  /* ★ 新增以下兩行 ★ */
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.modal-header h3 {
  margin: 0;
  color: #21f1ff;
}

.modal-header button {
  border: none;
  background: none;
  color: #21f1ff;
  font-size: 1.2rem;
}

.modal-header button:hover {
  color: #0ff;
}

.modal-body ul {
  list-style: none;
  padding-left: 0;
  margin: 0;
}

.modal-body li {
  margin-bottom: 0.5rem;
}

/* 遊戲紀錄 */
.log-entry {
  margin-bottom: 1rem;
}

/* 捲動條樣式 (可選) */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-thumb {
  background: #21f1ff;
}

::-webkit-scrollbar-track {
  background: #0e0e0e;
}

.btn-back {
  position: fixed;
  /* 使其固定於視窗，不受父層限制 */
  top: 1rem;
  left: 1rem;
  z-index: 999;
  /* 確保在最上層，避免被其他元素蓋住 */

  /* 其他樣式可自由調整 */
  background-color: #333;
  color: #fff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

/* 小螢幕固定左上角 */
@media (max-width: 767px) {
  .btn-back {
    top: 1rem;
    left: 1rem;
  }
}

/* 大螢幕可再調整位置 */
@media (min-width: 768px) {
  .btn-back {
    top: 2rem;
    left: 2rem;
  }
}
</style>