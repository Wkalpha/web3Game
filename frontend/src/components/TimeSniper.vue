<template>
  <div class="game-container">
    <h2>遊戲</h2>
    <h2>剩餘可遊玩次數{{ leftOfPlay }}</h2>
    <div v-if="!gameStarted && !gameFinished">
      <h3>選擇難度</h3>
      <button @click="setDifficulty('Easy')">Easy</button>
      <button @click="setDifficulty('Normal')">Normal</button>
      <button @click="setDifficulty('Hard')">Hard</button>
      <div v-if="difficulty">
        <p>選擇的難度：{{ difficulty }}(賠率{{odds}})</p>
        <p>投入 Time Coin</p>
        <input type="number" v-model.number="betAmount" placeholder="至少 100 Time Coin" />
        <button @click="startGame" :disabled="!canStartGame">開始對戰</button>
        <p v-if="betAmountError" class="error">{{ betAmountError }}</p>
      </div>
    </div>

    <div v-if="gameStarted">
      <p v-if="countdownTime >= 60">倒數時間：{{ Math.floor(countdownTime / 60) }} 分鐘</p>
      <p v-else>遊戲即將結束</p>
      <h3>回合 {{ currentRound }} / 10</h3>
      <p v-if="!targetTime">目標秒數: -</p>
      <p v-else>目標秒數: {{ targetTime.toFixed(2) }}</p>
      <button v-if="!targetTime" @click="getTargetTime">取得目標時間</button>
      <button v-if="targetTime && !timing" @click="startTiming">攻擊</button>
      <button v-if="timing" @click="stopTiming">停止</button>
      <p v-if="timing">計時中...</p>
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
  </div>
</template>

<script>
export default {
  name: 'TimeSniper',
  props: {
    userBalance: {
      type: Number,
      required: true,
    },
    leftOfPlay: {
      type: Number,
      required: true,
    },
  },
  data() {
    return {
      difficulty: null,
      betAmount: null,
      odds: 0,
      betAmountError: '',
      gameStarted: false,
      targetTime: null,
      timing: false,
      startTime: null,
      endTime: null,
      currentRound: 1,
      totalScore: 0,
      currentRoundScore: null,
      countdownTime: 180, // 3分鐘倒數時間，單位為秒
      countdownInterval: null,
      gameFinished: false
    };
  },
  computed: {
    canStartGame() {
      return (
        Number.isInteger(this.betAmount) &&
        this.betAmount >= 100 &&
        this.betAmount <= this.userBalance &&
        !!this.difficulty &&
        this.leftOfPlay > 0
      );
    },
    resultMessage() {
      return this.totalScore >= 60 ? '恭喜你贏了！' : '很遺憾，你輸了。';
    },
    balanceChange() {
      if (this.totalScore >= 60) {
        return `獲得 ${this.betAmount * this.odds} Time Coin`
      }
      else {
        return `失去 ${this.betAmount} Time Coin`
      }
    },
  },
  methods: {
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
    startGame() {
      if (this.betAmount <= 0 || this.betAmount > this.userBalance) {
        this.betAmountError = '下注金額必須大於0且不能超過餘額';
        return;
      }
      this.betAmountError = '';
      this.gameStarted = true;
      this.startCountdown();

      // 通知父組件
      this.$emit('game-start', { amountChange: this.betAmount });
    },
    startCountdown() {
      this.countdownTime = 180;
      this.countdownInterval = setInterval(() => {
        if (this.countdownTime > 0) {
          this.countdownTime--;
        } else {
          clearInterval(this.countdownInterval);
          this.gameFinished = true;
          this.gameStarted = false;
          this.finishGame();
        }
      }, 1000);
    },
    getTargetTime() {
      this.targetTime = parseFloat((Math.random() * 9 + 1).toFixed(2));
    },
    startTiming() {
      this.timing = true;
      this.startTime = new Date().getTime();
    },
    stopTiming() {
      this.endTime = new Date().getTime();
      this.timing = false;

      const actualTime = (this.endTime - this.startTime) / 1000;
      const timeDifference = Math.abs(actualTime - this.targetTime);
      this.currentRoundScore = Math.max(1, Math.floor((1 - timeDifference / 10) * 10));
      this.totalScore += this.currentRoundScore;

      // 回合結束
      this.targetTime = null;
      this.currentRound++;

      // 如果到第10回合，結束遊戲
      if (this.currentRound > 10) {
        this.gameFinished = true;
        this.gameStarted = false;
        this.finishGame();
      }
    },
    finishGame() {
      clearInterval(this.countdownInterval);
      const result = this.totalScore >= 60 ? 'win' : 'lose';

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

      // 通知父組件
      this.$emit('game-result', { result, betAmount: this.betAmount, odds: this.odds });
    },
    resetGame() {
      clearInterval(this.countdownInterval);
      this.difficulty = null;
      this.betAmount = null;
      this.betAmountError = '';
      this.gameStarted = false;
      this.targetTime = null;
      this.timing = false;
      this.startTime = null;
      this.endTime = null;
      this.currentRound = 1;
      this.totalScore = 0;
      this.currentRoundScore = null;
      this.gameFinished = false;
      this.countdownTime = 180;
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

button {
  margin: 5px;
  padding: 5px 10px;
}

.error {
  color: red;
}
</style>
