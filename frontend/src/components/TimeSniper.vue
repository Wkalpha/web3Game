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
        <p>選擇的難度：{{ difficulty }}(賠率{{ odds }})</p>
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
      <p v-else>目標秒數: {{ targetTime }}</p>
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
import axios from 'axios';

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
    gameId: {
      type: String,
      required: true,
    },
    walletAddress: {
      type: String,
      required: true
    }
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

      this.startCountdown();

      // 通知父組件
      this.$emit('game-start', { amountInput: this.betAmount, level: this.difficulty, odds: this.odds });
    },
    async getTargetTime() {
      // 打後端取得時間
      const payload = {
        gameId: this.gameId,
        walletAddress: this.walletAddress,
        round: this.currentRound
      }
      await axios.post('http://localhost:3000/getTargetTime', payload).then(rs => {
        this.targetTime = rs.data.targetTime;
      });

    },
    async startTiming() {
      this.timing = true;
      // 打後端開始計時
      const payload = {
        gameId: this.gameId,
        walletAddress: this.walletAddress,
        round: this.currentRound
      }
      await axios.post('http://localhost:3000/start-timer', payload);
    },
    async stopTiming() {
      this.timing = false;
      // 打後端停止計時
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

      // 通知父組件
      this.$emit('game-result', { gameResult: "win", betAmount: this.betAmount, odds: this.odds, difficulty: this.difficulty });
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
