import { defineStore } from 'pinia'
import axios from 'axios'
import Web3 from 'web3'
import { useToast } from 'vue-toastification';
import { useContractStore } from './contract'

export const useGameStore = defineStore('game', {
    state: () => ({
        balance: null,
        showBalance: false,
        prizePool: null,
        inventory: [],
        userBaseInfo: {
            BaseAttackPower: 0,
            RewardMultiplier: 0,
            BaseLeftOfPlay: 0
        },
        userInfo: {
            userId: null,
            timeCoin: 0,
            leftOfPlay: 0,
            badges: []
        },
        playTimes: null,
        showLeaderboard: false,
        leaderboardPlayers: [],
        leaderboardPrizePoolTimeCoin: 0,
        isLoading: false,
        showText: '',
        drawBadgeKey: 0,
        userDailyQuestKey: 0,
        referredBy: null,
        web3: null,
        walletAddress: null,
        walletConnected: false,
        login: false
    }),
    getters: {
        formattedWalletAddress: (state) => {
            if (state.walletAddress) {
                return `${state.walletAddress.slice(0, 4)}...${state.walletAddress.slice(-4)}`
            }
            return ''
        },
        owner: (state) => state.contractAddress === state.walletAddress
    },
    actions: {
        async getMainPrizePool() {
            const response = await axios.get(`${process.env.VUE_APP_API_URL}/getMainPrizePool`);
            this.prizePool = response.data.amount
        },
        async getLeaderboardPrizePool() {
            const response = await axios.get(`${process.env.VUE_APP_API_URL}/getLeaderboardPrizePool`);
            this.leaderboardPrizePoolTimeCoin = response.data.amount
        },
        async getLeaderboardPlayer(currentWeek) {
            // 獲取當前日期並計算目標日期
            const currentDate = new Date();
            let targetDate = new Date(currentDate);

            if (!currentWeek) {
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

            const payload = {
                yearWeek: yearWeek
            };

            await axios.post(`${process.env.VUE_APP_API_URL}/getLeaderboard`, payload).then(rs => {
                this.leaderboardPlayers = rs.data.leaderboard;
            });
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
        async connectWallet() {
            if (window.ethereum) {
                try {
                    this.walletConnected = true
                    await window.ethereum.request({ method: 'eth_requestAccounts' })
                    this.web3 = new Web3(window.ethereum)
                    const accounts = await this.web3.eth.getAccounts()
                    if (accounts.length > 0) {
                        this.walletAddress = accounts[0]
                        const balanceWei = await this.web3.eth.getBalance(this.walletAddress)
                        this.balance = this.web3.utils.fromWei(balanceWei, 'ether')

                        const message = `Sign${this.walletAddress}${Date.now()}`
                        const signature = await this.web3.eth.personal.sign(message, this.walletAddress, '')

                        await this.checkUserInfo(message, signature)
                        await useContractStore().initContract(this.web3)


                        // this.connectWebSocket()
                    }
                } catch (error) {
                    console.error('钱包连接失败:', error)
                    this.walletConnected = false
                }
            } else {
                alert('您尚未安装 Metamask')
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
                this.walletConnected = true
                await this.getUserBaseInfo();
            } catch (error) {
                console.error("檢查玩家失敗:", error);
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
        copyWalletAddress(address) {
            const toast = useToast();
            if (!address) {
                toast.error("無法複製，錢包地址為空！", { timeout: 2000 });
                return;
            }
            navigator.clipboard.writeText(address)
                .then(() => {
                    toast.success(`已複製 ${address}`, { timeout: 2000 });
                })
                .catch(() => {
                    toast.error("複製失敗，請稍後再試！", { timeout: 2000 });
                });
        },
        async getInventory() {
            const payload = { walletAddress: this.walletAddress };
            try {
                const response = await axios.post(`${process.env.VUE_APP_API_URL}/get-inventory`, payload);
                this.inventory = response.data.inventory || [];
            } catch (error) {
                console.error('獲取物品清單失敗:', error);
                alert('獲取物品清單失敗，請稍後再試');
            }
        },
        async getUserBaseInfo() {
            try {
                const payload = {
                    walletAddress: this.walletAddress,
                };
                const response = await axios.post(`${process.env.VUE_APP_API_URL}/get-user-base-info`, payload);

                if (response.status !== 200) {
                    throw new Error("無法取得角色資訊");
                }

                this.userBaseInfo = response.data;

            } catch (error) {
                console.error("Error fetching character info:", error);
                alert("取得角色資訊失敗");
            }
        }
    }
})