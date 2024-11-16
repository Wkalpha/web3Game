<template>
  <div id="app">
    <h1>Time Battle DApp</h1>
    <button v-if="!wallet_connected" @click="connectWallet">連結錢包</button>
    <div v-if="walletAddress">
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
        獎金池: {{ prizePool * 10000 }} Time Coin
      </p>
      <div v-if="userInfo">
        Time Coin:{{ userInfo.timeCoin }}
        <button @click="openETHToTimeCoinInputBox">
          兌換
        </button>
      </div>
      <div v-if="ethToTimeCoinInputBox">
        ETH 數量:<input type="number" v-model="eth">
        <button @click="ethToTimeCoin">確認</button>
      </div>
    </div>
  </div>
</template>


<script>
import Web3 from 'web3';
import contractABI from '../contract/time.json'
import axios from 'axios';

export default {
  name: 'App',
  data() {
    return {
      web3: null,
      walletAddress: null,
      balance: null,
      contract: null, // 合約實例
      wallet_connected: false,
      showBalance: false, // 控制餘額是否顯示
      prizePool: null,
      userInfo: null,
      ethToTimeCoinInputBox: false,
      eth: null
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
        console.log(this.userInfo)
      } catch (error) {
        console.error("檢查用戶信息失敗:", error);
      }
    },
    toggleBalanceVisibility() {
      this.showBalance = !this.showBalance;
    },
    openETHToTimeCoinInputBox() {
      this.ethToTimeCoinInputBox = !this.ethToTimeCoinInputBox;
      this.eth = null
    },
    async ethToTimeCoin() {
      try {
        const amountToSend = this.web3.utils.toWei(this.eth.toString(), "ether"); // 發送 1 ETH
        console.log(amountToSend)

        const receipt = await this.contract.methods.buyTokens().send({
          from: this.walletAddress,
          value: amountToSend,
        });

        console.log("購買成功:", receipt);
      } catch (error) {
        console.error("購買代幣失敗:", error.message);
      }
    },
    async initContract() {
      // 假設智能合約地址與 ABI
      const contractAddress = '0x288a537992Cf17FBD468E03B88d9B17fcdf356E2';
      this.contract = new this.web3.eth.Contract(contractABI, contractAddress);

      // 呼叫 getContractBalance 方法來取得獎金池金額
      const prizePoolWei = await this.contract.methods.getContractBalance().call();
      this.prizePool = this.web3.utils.fromWei(prizePoolWei, 'ether');

      console.log("Prize Pool:", this.prizePool);

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
