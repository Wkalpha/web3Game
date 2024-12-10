<template>
  <div id="app">
    <h1>Time Battle DApp</h1>
    <div>
      合約地址: {{ contractAddress }}
    </div>
    <button v-if="!wallet_connected" @click="connectWallet">連結錢包</button>
    <div v-if="walletAddress">
      <div v-if="owner">
        <button @click="withDraw">
          提取合約 ETH
        </button>
      </div>
      <p>錢包帳號地址：{{ formattedWalletAddress }}</p>
      <p>
        餘額：
        <span v-if="showBalance">{{ balance }} ETH</span>
        <span v-else>***</span>
        <button @click="toggleBalanceVisibility" class="icon-button">
          <span v-if="!showBalance">顯示</span>
          <span v-else>隱藏</span>
        </button>
      </p>
      <p>
        獎金池: {{ prizePool }} Time Coin
      </p>
      <div v-if="userInfo">
        Time Coin:{{ userInfo.timeCoin }}
        <button @click="openETHToTimeCoinInputBox">
          兌換 Time Coin
        </button>
        <button @click="openTimeCoinToETHInputBox">
          兌換 ETH
        </button>
      </div>
      <div v-if="ethToTimeCoinInputBox">
        ETH 數量(最少0.001):<input type="number" v-model="eth">
        <button @click="ethToTimeCoin">確認</button>
      </div>
      <div v-if="timeCoinToETHInputBox">
        Time Coin 數量(最少100):<input type="number" v-model="timeCoin">
        <button @click="timeCoinToETH" :disabled="!canBuyETH">確認</button>
      </div>
      <!-- 遊戲 -->
      <TimeSniper :left-of-play="userInfo.leftOfPlay" :user-balance="userInfo.timeCoin" @game-result="handleGameResult"
        @game-start="handleGameStart" />
    </div>
  </div>
</template>


<script>
import Web3 from 'web3';
import contractABI from '../contract/time.json'
import axios from 'axios';
import TimeSniper from '../src/components/TimeSniper.vue';

export default {
  name: 'App',
  components: {
    TimeSniper
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
      userInfo: {
        timeCoin: 0,
        leftOfPlay: 0, // 剩餘可遊玩次數
      },
      ethToTimeCoinInputBox: false,
      eth: null,
      timeCoinToETHInputBox: false,
      timeCoin: null,
      ownerAddress: process.env.VUE_APP_OWNER_WALLET_ADDRESS,
      contractAddress: process.env.VUE_APP_CONTRACT_ADDRESS
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
    canBuyETH() {
      return (
        Number.isInteger(this.timeCoin) &&
        this.timeCoin > 0 &&
        this.timeCoin <= this.userInfo.timeCoin
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
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          this.web3 = new Web3(window.ethereum);
          const accounts = await this.web3.eth.getAccounts();
          if (accounts.length > 0) {
            this.wallet_connected = true
            this.walletAddress = accounts[0];
            const balanceWei = await this.web3.eth.getBalance(this.walletAddress);
            this.balance = this.web3.utils.fromWei(balanceWei, 'ether');

            // 發送請求到後端，檢查用戶是否已存在
            await this.checkUserInfo();

            await this.initContract(); // 連結錢包後初始化合約
            await this.getPrizePool();

            this.connectWebSocket();
          }
        } catch (error) {
          console.error('連結錢包失敗：', error);
        }
      } else {
        alert('您尚未安裝 Metamask');
      }
    },
    async checkUserInfo() {
      try {
        const response = await axios.post('http://localhost:3000/check-user', {
          walletAddress: this.walletAddress
        });

        // 設定 userInfo 並顯示歡迎信息
        this.userInfo = response.data;
        if (response.data.isNewUser) {
          alert("歡迎新用戶！");
        } else {
          alert(`歡迎回來, ${response.data.walletAddress}!`);
        }
      } catch (error) {
        console.error("檢查用戶信息失敗:", error);
      }
    },
    async handleGameResult({ result, betAmount, odds }) {
      // 更新資料庫
      try {
        const response = await axios.post('http://localhost:3000/update-balance-when-game-over', {
          walletAddress: this.walletAddress, // 替換為實際錢包地址
          gameResult: result,
          betAmount,
          odds
        });

        this.userInfo.timeCoin = response.data.userTimeCoin
        await this.getPrizePool();

      } catch (error) {
        console.error('更新餘額失敗:', error);
      }
    },
    async handleGameStart({ amountChange }) {
      // 扣除玩家 Time Coin 與 遊玩次數
      try {
        const response = await axios.post('http://localhost:3000/update-balance-when-game-start', {
          walletAddress: this.walletAddress, // 替換為實際錢包地址
          amountChange,
        });

        this.userInfo.timeCoin = response.data.updatedUserBalance;
        this.userInfo.leftOfPlay = response.data.updatedLeftOfPlay;

      } catch (error) {
        console.error('更新餘額失敗:', error);
      }
    },
    toggleBalanceVisibility() {
      this.showBalance = !this.showBalance;
    },
    openETHToTimeCoinInputBox() {
      this.ethToTimeCoinInputBox = !this.ethToTimeCoinInputBox;
      this.eth = null
    },
    openTimeCoinToETHInputBox() {
      this.timeCoinToETHInputBox = !this.timeCoinToETHInputBox;
      this.timeCoin = null
    },
    async ethToTimeCoin() {
      try {
        // 檢查輸入值是否至少為 0.001
        if (!this.eth || this.eth < 0.001) {
          alert("輸入的 ETH 數量必須至少為 0.001");
          return; // 終止執行
        }

        const amountToSend = this.web3.utils.toWei(this.eth.toString(), "ether");

        await this.contract.methods.buyTokens().send({
          from: this.walletAddress,
          value: amountToSend,
        });


      } catch (error) {
        console.error("購買代幣失敗:", error.message);
      }
    },
    // websocket
    connectWebSocket() {
      const walletAddress = this.walletAddress.toLowerCase();
      this.webSocket = new WebSocket(`ws://localhost:3001?walletAddress=${walletAddress}`);

      this.webSocket.onopen = () => {
        console.log('WebSocket 連接成功，walletAddress:', walletAddress);
      };

      this.webSocket.onmessage = (message) => {
        const data = JSON.parse(message.data);
        if (data.event === 'TokensPurchased') {

          if (data.data.buyer.toLowerCase() === this.walletAddress.toLowerCase()) {
            this.userInfo.timeCoin = data.data.userTimeCoin;
          }
        }
        this.prizePool = data.data.prizePoolTimeCoin
      };

      this.webSocket.onclose = () => {
        console.log('WebSocket 連接已關閉，5 秒後嘗試重新連接');
        setTimeout(() => this.connectWebSocket(), 5000);
      };

      this.webSocket.onerror = (error) => {
        console.error('WebSocket 錯誤:', error);
      };
    },
    // Time Coin > ETH
    async timeCoinToETH() {
      try {
        // 檢查輸入值是否至少為 100
        if (!this.timeCoin || this.timeCoin < 100) {
          alert("輸入的 Time Coin 數量必須至少為 100");
          return; // 終止執行
        }

        // Call node.js
        const response = await axios.post('http://localhost:3000/update-user-balance-when-buy-eth', {
          walletAddress: this.walletAddress,
          balanceChange: this.timeCoin
        });

        console.log(response)
        // try {
        //   const response = await axios.post('http://localhost:3000/update-user-balance-when-buy-eth', {
        //     walletAddress: this.walletAddress, // 替換為實際錢包地址
        //     balanceChange: this.timeCoin,
        //   });

        //   this.userInfo.timeCoin = response.data.updatedUserBalance;

        // } catch (error) {
        //   console.error('資料庫更新失敗:', error);
        // }

      } catch (error) {
        console.error("兌換失敗:", error.message);
      }
    },
    async withDraw() {
      await axios.post('http://localhost:3000/update-prize-pool-after-withdraw');
    },
    async initContract() {
      // 智能合約地址與 ABI
      this.contract = new this.web3.eth.Contract(contractABI, this.contractAddress);
    },
    async getPrizePool() {
      const response = await axios.get('http://localhost:3000/getPrizePool');
      this.prizePool = response.data.amount
    }
  },
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
