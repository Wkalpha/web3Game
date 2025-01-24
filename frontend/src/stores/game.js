import { defineStore } from 'pinia'
import axios from 'axios'
import { useAuthStore } from './auth' // 引入 auth store

export const useGameStore = defineStore('game', {
    state: () => ({
        balance: null,
        showBalance: false,
        prizePool: null,
        userInfo: {
            userId: null,
            timeCoin: 0,
            leftOfPlay: 0
        },
        playTimes: null,
        showLeaderboard: false,
        leaderboardPlayers: [],
        leaderboardPrizePoolTimeCoin: 0,
        isLoading: false,
        showText: '',
        drawBadgeKey: 0,
        userDailyQuestKey: 0,
        referredBy: null
    }),
    getters: {
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
        // Time Coin > Play Times
        async timeCoinToPlayTimes() {
            try {
                if (!this.playTimes || this.playTimes < 0) {
                    alert("數量必須至少為 1");
                    return; // 終止執行
                }

                var response = await axios.post(`${process.env.VUE_APP_API_URL}/update-user-balance-when-buy-playtimes`, {
                    walletAddress: useAuthStore().walletAddress,
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
                    walletAddress: useAuthStore().walletAddress,
                    balanceChange: this.timeCoin
                });

            } catch (error) {
                this.blockchainConfirm = true;
                console.error("兌換失敗:", error.message);
            }
        },
    }
})