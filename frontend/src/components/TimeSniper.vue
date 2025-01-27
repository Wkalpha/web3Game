<template>
  <div class="game-container">
    <h2>遊戲</h2>
    <h2>剩餘可遊玩次數{{ gameStore.userInfo.leftOfPlay }}</h2>
    <div v-if="!gameStarted && !gameFinished">
      <h3>選擇難度</h3>
      <button @click="setDifficulty('Easy')">Easy</button>
      <button @click="setDifficulty('Normal')">Normal</button>
      <button @click="setDifficulty('Hard')">Hard</button>
      <div v-if="difficulty">
        <p>賠率: {{ odds }}</p>
        <p>獲勝門檻: {{ threshold }} 分</p>
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
      <p>獲勝門檻: {{ threshold }} 分</p>
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
      <p>獲勝門檻: {{ threshold }} 分</p>
      <p>總分：{{ totalScore }} 分</p>
      <p>{{ showGameResultText }}</p>
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
          <button @click="noUseItem()" style="background: black;">不使用道具</button>
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
              <hr v-if="index < gameLog.length - 1">
            </div>
          </div>
          <div v-else>
            <p>載入中...</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import { useGameStore } from '@/stores/game';

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
const showGameResultText = ref(null);

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

const fetchInventory = async () => {
  try {
    const response = await axios.post(`${process.env.VUE_APP_API_URL}/get-inventory`, {
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

  await fetchInventory();
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
};

onMounted(() => {
  // Initialization logic if needed
});
</script>
