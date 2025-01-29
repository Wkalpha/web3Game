<template>
    <button @click="openETHToTimeCoinInputBox" class="eth-to-timecoin-button">兌換 Time Coin</button>
</template>

<script setup>
import Swal from 'sweetalert2';
import { ref } from 'vue';
import { useGameStore } from '@/stores/game';
import { useContractStore } from '@/stores/contract';

const gameStore = useGameStore();
const contractStore = useContractStore();

const eth = ref(null);
const canBuyTimeCoin = ref(true);

const ethToTimeCoin = async () => {
    try {
        const amountToSend = gameStore.web3.utils.toWei(eth.value.toString(), "ether");

        // 顯示處理中的視窗
        Swal.fire({
            title: '交易進行中',
            text: '請稍候，正在處理交易...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        await contractStore.contract.methods.buyTokens().send({
            from: gameStore.walletAddress,
            value: amountToSend,
        });

        // 關閉處理中的視窗
        Swal.close();
        await Swal.fire({
            icon: 'success',
            title: '兌換成功',
            text: `您已成功兌換 ${eth.value} ETH 為 Time Coin！`
        });


    } catch (error) {
        console.log(error)
        // 關閉處理中的視窗並顯示錯誤消息
        Swal.close();
        if (error.message && error.message.includes('denied transaction signature')) {
            await Swal.fire({
                icon: 'error',
                title: '交易取消',
                text: '您已取消交易。'
            });
        } else {
            await Swal.fire({
                icon: 'error',
                title: '交易失敗',
                text: `兌換過程中發生錯誤：${error.message}`
            });
        }
    }
};

const openETHToTimeCoinInputBox = async () => {
    eth.value = null;

    const { value: inputValue } = await Swal.fire({
        title: 'ETH 兌換 Time Coin',
        text: `請輸入要轉換的 ETH 數量 (至少 0.001 ETH, 可用餘額: ${gameStore.balance} ETH)`,
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
            if (!value) {
                Swal.showValidationMessage('請輸入一個數量');
            } else if (isNaN(value)) {
                Swal.showValidationMessage('請輸入一個有效的數字');
            } else if (value < 0.001) {
                Swal.showValidationMessage('輸入的 ETH 數量必須至少為 0.001');
            } else if (value > gameStore.balance) {
                Swal.showValidationMessage(`您輸入的 ETH 數量超過您的餘額（可用餘額：${gameStore.balance} ETH）`);
            } else {
                eth.value = parseFloat(value);
                return value; // 返回用戶的值
            }
        }
    });

    if (inputValue) {
        if (canBuyTimeCoin.value) {
            await ethToTimeCoin();
        } else {
            Swal.fire({
                icon: 'error',
                title: '無法進行轉換',
                text: '您輸入的 ETH 數量無效，請檢查後重試。'
            });
        }
    }
};
</script>

<style scoped>
.eth-to-timecoin-button {
    background: linear-gradient(135deg, hsl(158 70% 50%), hsl(198 70% 50%));
    border-radius: 8px;
    padding: 0.75rem 1.5rem;
    border: none;
    color: white;
    font-weight: 600;
}
</style>