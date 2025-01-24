import { defineStore } from 'pinia'
import contractABI from '../../contract/time.json'
import axios from 'axios';

export const useContractStore = defineStore('contract', {
    state: () => ({
        contract: null
    }),
    actions: {
        async initContract(web3) {
            this.contract = new web3.eth.Contract(contractABI, process.env.VUE_APP_CONTRACT_ADDRESS)
        },
        async withDraw() {
            await axios.post(`${process.env.VUE_APP_API_URL}/update-prize-pool-after-withdraw`);
        },
    }
})