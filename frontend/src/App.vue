<template>

  <div id="app">
    <h1>TickTock Battle DApp</h1>

    <div v-if="owner && wallet_connected && login">
      您好，創始者
      <button @click="withDraw">提取合約</button>
    </div>

    <p v-if="wallet_connected && login">合約地址: {{ contractAddress }}</p>
    <button v-if="!login" @click="connectWallet" :disabled="wallet_connected">連結錢包</button>

    <div v-if="!login">
      <p>👇點擊下方加入 Discord 獲取更多資訊👇</p>
      <a href="https://discord.gg/gxBTtEWb" target="_blank"
        style="display: inline-flex; align-items: center; text-decoration: none;">
        <img src="/images/discord.png" alt="Discord" style="width:30px; height:30px; margin-right:8px;">加入我們的 Discord
      </a>
    </div>

    <div v-if="!blockchainConfirm" class="overlay">
      <div class="loading-message">
        <p>請稍後，交易確認中...</p>
      </div>
    </div>

    <div v-if="login">
      <!-- 主要內容區域 -->
      <div class="main-container">
        <!-- 左側：資訊展示區 -->
        <div class="info-section">
          <DailyQuest :refreshKey="userDailyQuestKey" :wallet-address="walletAddress" />
          <p>錢包地址: {{ formattedWalletAddress }}
            <button @click="copyWalletAddress(walletAddress)">複製</button>
            <button v-if="!referredBy" @click="referrerBy">填寫推薦人</button>
          </p>
          <p>
            餘額:
            <span v-if="showBalance">{{ balance }} ETH</span>
            <span v-else>******</span>
            <button @click="toggleBalanceVisibility">顯示/隱藏</button>
          </p>
          <div class="pool-section">
            <div class="prize-pool">
              <p>獎金池: {{ prizePool }} Time Coin</p>
            </div>
            <div class="leaderboard-pool">
              <p>排行榜獎金池: {{ leaderboardPrizePoolTimeCoin }} Time Coin</p>
              <!-- 顯示排行榜按鈕 -->
              <button @click="openLeaderboard(-1)">上週排行榜結算</button>
              <button @click="openLeaderboard(1)">查看排行榜</button>
            </div>
          </div>

          <!-- 徽章展示區 -->
          <BadgeDisplay :wallet-address="walletAddress" :refreshKey="drawBadgeKey"
            :user-time-coin="userInfo.timeCoin" />
        </div>

        <!-- 右側：功能操作區 -->
        <div class="action-section">
          <p>您持有 {{ userInfo.timeCoin }} Time Coin</p>
          <button @click="openETHToTimeCoinInputBox">兌換 Time Coin</button>
          <button @click="openTimeCoinToETHInputBox">兌換 ETH</button>
          <button @click="openTimeCoinToPlayTimesInputBox">購買遊玩次數</button>
          <PrizeItemPool :wallet-address="walletAddress" :user-time-coin="userInfo.timeCoin" />

          <!-- 抽徽章 -->
          <BadgeLottery :wallet-address="walletAddress" @draw-badge="handleDrawBadge" />

        </div>
      </div>

      <!-- 下方：遊戲區域 -->
      <div class="game-section">
        <TimeSniper :left-of-play="userInfo.leftOfPlay" :user-time-coin="userInfo.timeCoin"
          @game-start="handleGameStart" :wallet-address="walletAddress" :show-game-result-text="showText" />
      </div>

      <!-- 顯示排行榜 -->
      <LeaderBoard :is-visible="showLeaderboard" :players="leaderboardPlayers"
        @closeLeaderboard="showLeaderboard = false" :isLoading="isLoading" :userWalletAddress="walletAddress"
        :current-week="currentWeek" :userTimeCoin="userInfo.timeCoin" @bet-complete="handleBetComplete" />
    </div>

  </div>
</template>


<script>
import Web3 from 'web3';
import contractABI from '../contract/time.json'
import axios from 'axios';
import TimeSniper from '../src/components/TimeSniper.vue';
import LeaderBoard from './components/ShowLeaderboard.vue';
import PrizeItemPool from './components/PrizeItemPool.vue';
import BadgeDisplay from "./components/BadgeDisplay.vue";
import BadgeLottery from "./components/BadgeLottery.vue";
import DailyQuest from "@/components/DailyQuest.vue";
import Swal from 'sweetalert2';
import { useToast } from "vue-toastification";

export default {
  name: 'App',
  setup() {
    const toast = useToast();

    // 複製錢包地址並顯示 Toast
    const copyWalletAddress = (address) => {
      if (!address) {
        toast.error("無法複製，錢包地址為空！", {
          timeout: 2000,
        });
        return;
      }

      // 將錢包地址複製到剪貼簿
      navigator.clipboard.writeText(address)
        .then(() => {
          toast.success(`已複製 ${address}`, {
            timeout: 2000,
          });
        })
        .catch(() => {
          toast.error("複製失敗，請稍後再試！", {
            timeout: 2000,
          });
        });
    };

    return { copyWalletAddress };
  },
  components: {
    TimeSniper,
    LeaderBoard,
    PrizeItemPool,
    BadgeDisplay,
    BadgeLottery,
    DailyQuest
  },
  data() {
    return {
      webSocket: null, // 用於存放 WebSocket 實例
      web3: null,
      walletAddress: null,
      balance: null,
      contract: null, // 合約實例
      wallet_connected: false,
      showBalance: false, // 控制餘額是否顯示
      prizePool: null,
      login: false,
      userInfo: {
        userId: null,
        timeCoin: 0,
        leftOfPlay: 0, // 剩餘可遊玩次數
      },
      currentWeek: true,
      ethToTimeCoinInputBox: false,
      eth: null,
      timeCoinToETHInputBox: false,
      timeCoin: null,
      blockchainConfirm: true,
      timeCoinToPlayTimesInputBox: false,
      playTimes: null,
      ownerAddress: process.env.VUE_APP_OWNER_WALLET_ADDRESS,
      contractAddress: process.env.VUE_APP_CONTRACT_ADDRESS,
      showLeaderboard: false, // 控制排行榜顯示的開關
      leaderboardPlayers: [], // 從 API 獲取的排行榜數據
      leaderboardPrizePoolTimeCoin: 0,
      isLoading: false, // 是否正在加載排行榜數據
      showText: '遊戲進行中',
      drawBadgeKey: 0,
      userDailyQuestKey: 0,
      referredBy: null
    };
  },
  computed: {
    formattedWalletAddress() {
      if (this.walletAddress) {
        // 取前 4 碼和後 4 碼，中間以 ... 隔開
        return `${this.walletAddress.slice(0, 4)}...${this.walletAddress.slice(-4)}`;
      }
      return '';
    },
    canBuyTimeCoin() {
      return (
        typeof this.eth === 'number' &&
        this.eth > 0 &&
        !Number.isNaN(this.eth) &&
        this.eth >= 0.001 &&
        this.eth <= this.balance
      );
    },
    canBuyETH() {
      return (
        Number.isInteger(this.timeCoin) &&
        this.timeCoin >= 100 &&
        this.timeCoin <= this.userInfo.timeCoin
      );
    },
    canBuyPlayTimes() {
      return (
        Number.isInteger(this.playTimes) &&
        this.playTimes > 0 &&
        this.playTimes * 100 < this.userInfo.timeCoin
      );
    },
    owner() {
      return this.ownerAddress == this.walletAddress
    }
  },
  methods: {
    async connectWallet() {
      if (window.ethereum) {
        try {
          this.wallet_connected = true;
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          this.web3 = new Web3(window.ethereum);
          const accounts = await this.web3.eth.getAccounts();
          if (accounts.length > 0) {
            this.walletAddress = accounts[0];
            const balanceWei = await this.web3.eth.getBalance(this.walletAddress);
            this.balance = this.web3.utils.fromWei(balanceWei, 'ether');

            const message = `Sign${this.walletAddress}${Date.now()}`;

            // 用戶對消息進行簽名
            const signature = await this.web3.eth.personal.sign(message, this.walletAddress, '');

            // 發送請求到後端，檢查用戶是否已存在
            await this.checkUserInfo(message, signature);

            await this.initContract(); // 連結錢包後初始化合約
            await this.getMainPrizePool();
            await this.getLeaderboardPrizePool();

            this.connectWebSocket();

          }
        } catch (error) {
          if (error.code === 100) {
            console.warn('User rejected the signature request.');
          } else {
            console.error('An error occurred during signature request:', error);
          }
          this.wallet_connected = false;
        }
      } else {
        alert('您尚未安裝 Metamask');
      }
    },
    async updateBalance() {
      if (this.walletAddress) {
        try {
          const balanceWei = await this.web3.eth.getBalance(this.walletAddress);
          this.balance = this.web3.utils.fromWei(balanceWei, 'ether');
        } catch (error) {
          console.error('無法獲取最新餘額:', error);
        }
      }
    },
    async checkUserInfo(message, signature) {
      const payload = {
        walletAddress: this.walletAddress,
        message,
        signature
      };
      try {
        const response = await axios.post(`${process.env.VUE_APP_API_URL}/find-or-add`, payload);
        this.userInfo = response.data;
        this.referredBy = response.data.referredBy;
        this.login = true;
        this.wallet_connected = true
      } catch (error) {
        console.error("檢查用戶信息失敗:", error);
      }
    },
    async openLeaderboard(when) {
      try {
        this.currentWeek = true;
        // 開啟 loading 狀態
        this.isLoading = true;

        // 獲取當前日期並計算目標日期
        const currentDate = new Date();
        let targetDate = new Date(currentDate);

        if (when === -1) {
          this.currentWeek = false;
          // 計算上一週的日期
          targetDate.setDate(targetDate.getDate() - 7);
        }

        const year = targetDate.getFullYear();
        const firstDayOfYear = new Date(year, 0, 1);
        const pastDaysOfYear = Math.floor((targetDate - firstDayOfYear) / (24 * 60 * 60 * 1000));

        // 計算目標週數
        let weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);

        // 處理跨年的情況
        let yearWeek;
        if (weekNumber === 0) {
          const previousYear = year - 1;
          const lastDayOfPreviousYear = new Date(previousYear, 11, 31);
          const lastWeekOfPreviousYear = Math.ceil(
            (Math.floor((lastDayOfPreviousYear - new Date(previousYear, 0, 1)) / (24 * 60 * 60 * 1000)) +
              lastDayOfPreviousYear.getDay() +
              1) /
            7
          );
          yearWeek = `${previousYear}${lastWeekOfPreviousYear.toString().padStart(2, '0')}`;
        } else {
          yearWeek = `${year}${weekNumber.toString().padStart(2, '0')}`;
        }

        await axios.post(`${process.env.VUE_APP_API_URL}/getLeaderboard`, {
          yearWeek
        }).then(rs => {
          // 將排行榜數據保存到 leaderboardPlayers 中
          this.leaderboardPlayers = rs.data.leaderboard;

          // 顯示排行榜
          this.showLeaderboard = true;
        });

      } catch (error) {
        console.error('獲取排行榜失敗:', error);
        alert('無法獲取排行榜數據，請稍後再試');
      } finally {
        // 關閉 loading 狀態
        this.isLoading = false;
      }
    },
    handleBetComplete({ newUserTimeCoin, newLeaderboard }) {
      this.userInfo.timeCoin = newUserTimeCoin;
      this.leaderboardPlayers = newLeaderboard;
    },
    handleDrawBadge() {
      this.drawBadgeKey += 1
    },
    async handleGameStart({ leftOfPlay, timeCoin }) {
      this.userInfo.timeCoin = timeCoin;
      this.userInfo.leftOfPlay = leftOfPlay;
    },
    toggleBalanceVisibility() {
      this.showBalance = !this.showBalance;
    },
    async referrerBy() {
      try {
        // 顯示 SweetAlert 提示框，要求用戶輸入推薦人錢包地址
        const { value: referrerWalletAddress } = await Swal.fire({
          title: '請填寫推薦人錢包地址',
          input: 'text',
          inputLabel: '推薦人錢包地址',
          inputPlaceholder: '請輸入推薦人的錢包地址',
          showCancelButton: true,
          confirmButtonText: '確認',
          cancelButtonText: '取消',
          inputValidator: (value) => {
            if (!value) {
              return '請輸入推薦人錢包地址！';
            }
            return null;
          },
        });

        // 如果用戶取消輸入，直接返回
        if (!referrerWalletAddress) {
          return;
        }

        const payload = {
          keyInWalletAddress: this.walletAddress, // 當前用戶的錢包地址
          provierWalletAddress: referrerWalletAddress
        }

        const response = await axios.post(`${process.env.VUE_APP_API_URL}/referral`, payload);

        // 根據後端返回結果顯示成功消息
        if (response.data) {
          Swal.fire({
            icon: 'success',
            title: '推薦成功！',
            text: `您與推薦人均已獲得獎勵！`,
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
          });
          this.referredBy = referrerWalletAddress;
        }
      } catch (error) {
        // 顯示錯誤提示
        Swal.fire({
          icon: 'error',
          title: '推薦失敗',
          text: error.response?.data?.error || '發生未知錯誤，請稍後重試。',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
        });
      }
    },
    async openETHToTimeCoinInputBox() {
      this.ethToTimeCoinInputBox = !this.ethToTimeCoinInputBox;
      this.eth = null;

      const { value: inputValue } = await Swal.fire({
        title: 'ETH 兌換 Time Coin',
        text: `請輸入要轉換的 ETH 數量 (至少 0.001 ETH, 可用餘額: ${this.balance} ETH)`,
        input: 'number', // 輸入框類型
        inputValue: '0.001', // 預設的數值
        inputAttributes: {
          min: '0.001',
          step: '0.001',
          placeholder: '輸入 ETH 數量'
        },
        showCancelButton: true,
        confirmButtonText: '兌換',
        cancelButtonText: '取消',
        preConfirm: (value) => {
          // 驗證條件，僅當條件滿足時返回值
          if (!value) {
            Swal.showValidationMessage('請輸入一個數量');
          } else if (isNaN(value)) {
            Swal.showValidationMessage('請輸入一個有效的數字');
          } else if (value < 0.001) {
            Swal.showValidationMessage('輸入的 ETH 數量必須至少為 0.001');
          } else if (value > this.balance) {
            Swal.showValidationMessage(`您輸入的 ETH 數量超過您的餘額（可用餘額：${this.balance} ETH）`);
          } else {
            // 將用戶的值存到 this.eth，這裡的 this 需要用箭頭函數綁定
            this.eth = parseFloat(value);
            return value; // 返回用戶的值
          }
        }
      });

      // 如果用戶按下確認，並且 inputValue 存在，則繼續處理
      if (inputValue) {
        if (this.canBuyTimeCoin) {
          await this.ethToTimeCoin(); // 調用實際的 ethToTimeCoin 方法
        } else {
          Swal.fire({
            icon: 'error',
            title: '無法進行轉換',
            text: '您輸入的 ETH 數量無效，請檢查後重試。'
          });
        }
      }
    },
    async openTimeCoinToETHInputBox() {
      this.timeCoinToETHInputBox = !this.timeCoinToETHInputBox;
      this.timeCoin = null;

      const { value: inputValue } = await Swal.fire({
        title: 'Time Coin 兌換 ETH',
        text: `請輸入要兌換的 Time Coin 數量 (至少 100, 目前擁有: ${this.userInfo.timeCoin} Time Coin)`,
        input: 'number', // 輸入框類型
        inputValue: '100', // 預設的數值
        inputAttributes: {
          min: '100',
          step: '1', // 限制只能輸入整數
          placeholder: '輸入 Time Coin 數量'
        },
        showCancelButton: true,
        confirmButtonText: '是的，繼續',
        cancelButtonText: '取消',
        preConfirm: (value) => {
          if (!value) {
            Swal.showValidationMessage('請輸入一個數量');
          } else if (!Number.isInteger(+value)) {
            Swal.showValidationMessage('請輸入一個有效的整數');
          } else if (value < 100) {
            Swal.showValidationMessage('輸入的 Time Coin 數量必須至少為 100');
          } else if (value > this.userInfo.timeCoin) {
            Swal.showValidationMessage(`您輸入的 Time Coin 數量超過您的餘額（可用餘額：${this.userInfo.timeCoin} Time Coin）`);
          } else {
            this.timeCoin = parseInt(value, 10); // 更新 timeCoin，並確保為整數
            return value; // 返回輸入值，這表示驗證成功
          }
        }
      });

      // 如果用戶按下確認，並且 inputValue 存在，則繼續處理
      if (inputValue) {
        if (this.canBuyETH) {
          await this.timeCoinToETH(); // 調用實際的 timeCoinToETH 方法
        } else {
          Swal.fire({
            icon: 'error',
            title: '無法進行轉換',
            text: '您輸入的 Time Coin 數量無效，請檢查後重試。'
          });
        }
      }
    },
    async openTimeCoinToPlayTimesInputBox() {
      this.timeCoinToPlayTimesInputBox = !this.timeCoinToPlayTimesInputBox;
      this.playTimes = null;

      const { value: inputValue } = await Swal.fire({
        title: '購買遊玩次數',
        text: `請輸入要購買的遊玩次數 (1 次 = 100 Time Coin，您擁有: ${this.userInfo.timeCoin} Time Coin)`,
        input: 'number', // 輸入框類型
        inputValue: '1', // 預設的數值
        inputAttributes: {
          min: '1',
          step: '1', // 限制只能輸入整數
          placeholder: '輸入遊玩次數'
        },
        showCancelButton: true,
        confirmButtonText: '是的，繼續',
        cancelButtonText: '取消',
        preConfirm: (value) => {
          if (!value) {
            Swal.showValidationMessage('請輸入一個數量');
          } else if (!Number.isInteger(+value)) {
            Swal.showValidationMessage('請輸入一個有效的整數');
          } else if (value <= 0) {
            Swal.showValidationMessage('輸入的遊玩次數必須大於 0');
          } else if (value * 100 > this.userInfo.timeCoin) {
            Swal.showValidationMessage(`所需 Time Coin 為 ${value * 100}，但您只擁有 ${this.userInfo.timeCoin} Time Coin`);
          } else {
            this.playTimes = parseInt(value, 10); // 更新 playTimes，並確保為整數
            return value; // 返回用戶的值，表示驗證成功
          }
        }
      });

      // 如果用戶按下確認，並且 inputValue 存在，則繼續處理
      if (inputValue) {
        if (this.canBuyPlayTimes) {
          await this.timeCoinToPlayTimes(); // 調用實際的 timeCoinToPlayTimes 方法
        } else {
          Swal.fire({
            icon: 'error',
            title: '無法進行購買',
            text: '您輸入的遊玩次數無效，請檢查後重試。'
          });
        }
      }
    },

    // ETH > Time Coin
    async ethToTimeCoin() {
      try {
        this.blockchainConfirm = false;
        const amountToSend = this.web3.utils.toWei(this.eth.toString(), "ether");

        await this.contract.methods.buyTokens().send({
          from: this.walletAddress,
          value: amountToSend,
        });
      } catch (error) {
        this.blockchainConfirm = true;
        console.error("購買代幣失敗:", error.message);
      }
    },

    // Time Coin > ETH
    async timeCoinToETH() {
      try {
        this.blockchainConfirm = false;

        await axios.post(`${process.env.VUE_APP_API_URL}/update-user-balance-when-buy-eth`, {
          walletAddress: this.walletAddress,
          balanceChange: this.timeCoin
        });

      } catch (error) {
        this.blockchainConfirm = true;
        console.error("兌換失敗:", error.message);
      }
    },

    // Time Coin > Play Times
    async timeCoinToPlayTimes() {
      try {
        if (!this.playTimes || this.playTimes < 0) {
          alert("數量必須至少為 1");
          return; // 終止執行
        }

        var response = await axios.post(`${process.env.VUE_APP_API_URL}/update-user-balance-when-buy-playtimes`, {
          walletAddress: this.walletAddress,
          balanceChange: 100 * this.playTimes,
          playTimes: this.playTimes
        });

        this.userInfo.leftOfPlay = response.data.leftOfPlay;
        this.userInfo.timeCoin = response.data.timeCoin;

      } catch (error) {
        console.error("購買失敗:", error.message);
      }
    },

    async withDraw() {
      await axios.post(`${process.env.VUE_APP_API_URL}/update-prize-pool-after-withdraw`);
    },

    async initContract() {
      // 智能合約地址與 ABI
      this.contract = new this.web3.eth.Contract(contractABI, this.contractAddress);
    },

    async getMainPrizePool() {
      const response = await axios.get(`${process.env.VUE_APP_API_URL}/getMainPrizePool`);
      this.prizePool = response.data.amount
    },

    async getLeaderboardPrizePool() {
      const response = await axios.get(`${process.env.VUE_APP_API_URL}/getLeaderboardPrizePool`);
      this.leaderboardPrizePoolTimeCoin = response.data.amount
    },

    // websocket
    connectWebSocket() {
      const walletAddress = this.walletAddress.toLowerCase();
      this.webSocket = new WebSocket(`${process.env.VUE_APP_WS_URL}?walletAddress=${walletAddress}`);

      this.webSocket.onopen = () => {
        const connectTime = new Date().toISOString();
        console.log(`${connectTime} WebSocket 連接成功，walletAddress:`, walletAddress);
      };

      this.webSocket.onmessage = (message) => {
        const ws = JSON.parse(message.data);
        if (ws.event === 'TokensPurchased') {
          if (ws.data.buyer.toLowerCase() === this.walletAddress.toLowerCase()) {
            this.blockchainConfirm = true;
            this.userInfo.timeCoin = ws.data.userTimeCoin;
            this.updateBalance(); // 更新畫面錢包餘額
          }
        }

        if (ws.event === 'TimeCoinToETH') {
          if (ws.data.buyer.toLowerCase() === this.walletAddress.toLowerCase()) {
            this.userInfo.timeCoin = ws.data.userTimeCoin;
            this.blockchainConfirm = true;
            this.updateBalance(); // 更新畫面錢包餘額
          }
        }

        if (ws.event === 'PrizePoolUpdated') {
          this.prizePool = ws.data.prizePoolTimeCoin
        }

        if (ws.event === 'LeaderboardPrizePoolUpdated') {
          this.leaderboardPrizePoolTimeCoin = ws.data.leaderboardPrizePoolTimeCoin
        }

        if (ws.event === 'TimeCoinChange') {
          this.userInfo.timeCoin = ws.data.userTimeCoin;
        }

        if (ws.event === 'PlayOfTimesChange') {
          this.userInfo.leftOfPlay = ws.data.leftOfPlay;
        }

        if (ws.event === 'GameResult') {
          this.showText = ws.data.showText;
        }

        if (ws.event === 'BadgeChange') {
          this.drawBadgeKey += 1;
        }

        if (ws.event === 'DailyQuestChange') {
          this.userDailyQuestKey += 1
        }

      };

      this.webSocket.onclose = () => {
        const disconnectTime = new Date().toISOString();
        console.log(`${disconnectTime} WebSocket 連接已關閉，30秒後重新連線`);
        setTimeout(() => this.connectWebSocket(), 30000);
      };

      this.webSocket.onerror = (error) => {
        console.error('WebSocket 錯誤:', error);
      };
    }
  },
};
</script>

<style scoped>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  text-align: center;
  margin-top: 20px;
}

h1 {
  margin-bottom: 20px;
}

.main-container {
  display: flex;
  justify-content: space-between;
  /* 左右分佈 */
  gap: 20px;
  /* 左右區域的間距 */
  padding: 20px;
}

.pool-section {
  display: flex;
  flex: 1;
  flex-direction: row;
  gap: 10px;
}

.prize-pool,
.leaderboard-pool {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #afafaf;
}

.info-section,
.action-section {
  flex: 1;
  /* 左右區域等寬 */
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #afafaf;
}

.game-section {
  margin-top: 20px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #afafaf;
  text-align: center;
}

/* 遮罩的樣式 */
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  /* 半透明黑色背景 */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  /* 確保位於最上層 */
}

/* 提示文字樣式 */
.loading-message {
  background-color: #fff;
  padding: 20px 40px;
  border-radius: 10px;
  text-align: center;
  font-size: 18px;
  color: #333;
}

:global(body) {
  background-color: rgb(116, 102, 102);
}

.tutorial {
  margin-top: 20px;
}

.tutorial a {
  display: block;
  margin-top: 10px;
  color: #fbff00;
  text-decoration: none;
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
  color: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15);
}

button:hover {
  background: linear-gradient(to right, #ff6584, #ff4b6b);
  transform: translateY(-2px);
}

button:active {
  transform: scale(0.95);
}
</style>
