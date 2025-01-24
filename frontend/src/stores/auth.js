import { defineStore } from 'pinia'
import Web3 from 'web3'
import { useToast } from 'vue-toastification';
import axios from 'axios';
import { useContractStore } from './contract'

export const useAuthStore = defineStore('auth', {
    state: () => ({
        web3: null,
        walletAddress: null,
        balance: '0',
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
        async connectWallet() {
            if (window.ethereum) {
                try {
                    this.wallet_connected = true
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
                        // await this.getMainPrizePool()
                        // await this.getLeaderboardPrizePool()

                        // this.connectWebSocket()
                    }
                } catch (error) {
                    console.error('钱包连接失败:', error)
                    this.wallet_connected = false
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
                this.wallet_connected = true
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
        }
    }
})