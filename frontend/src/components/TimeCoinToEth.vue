<template>
    <button @click="openTimeCoinToETHInputBox" class="timecoin-to-eth-button">兌換 ETH</button>
</template>

<script setup>
import Swal from 'sweetalert2';
import { ref } from 'vue';
import { useGameStore } from '@/stores/game';
import axios from 'axios';

const gameStore = useGameStore();

const timeCoin = ref(null);
const canBuyTimeCoin = ref(true);

const timeCoinToETH = async (inputValue) => {
    try {
        // 顯示處理中的視窗
        Swal.fire({
            title: '交易進行中',
            text: '請稍候，正在處理交易...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // 發送請求到後端
        await axios.post(`${process.env.VUE_APP_API_URL}/update-user-balance-when-buy-eth`, {
            walletAddress: gameStore.walletAddress,
            deductTimeCoin: inputValue
        });
        
        Swal.close();
        await Swal.fire({
            icon: 'success',
            title: '兌換成功',
            text: `您已成功兌換 ${inputValue} Time Coin 為 ETH！`
        });

    } catch (error) {
        // 關閉處理中的視窗並顯示錯誤消息
        Swal.close();
        await Swal.fire({
            icon: 'error',
            title: '交易失敗',
            text: `兌換過程中發生錯誤：${error.message}`
        });
    }
};

const openTimeCoinToETHInputBox = async () => {
    timeCoin.value = null;

    const { value: inputValue } = await Swal.fire({
        title: 'Time Coin 兌換 ETH',
        text: `請輸入要兌換的 Time Coin 數量 (至少 100, 目前擁有: ${gameStore.userInfo.timeCoin} Time Coin)`,
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
            } else if (value > gameStore.userInfo.timeCoin) {
                Swal.showValidationMessage(`您輸入的 Time Coin 數量超過您的餘額（可用餘額：${gameStore.userInfo.timeCoin} Time Coin）`);
            } else {
                timeCoin.value = parseInt(value, 10); // 更新 timeCoin，並確保為整數
                return value; // 返回輸入值，這表示驗證成功
            }
        }
    });

    if (inputValue) {
        if (canBuyTimeCoin.value) {
            await timeCoinToETH(inputValue);
        } else {
            Swal.fire({
                icon: 'error',
                title: '無法進行轉換',
                text: '您輸入的 Time Coin 數量無效，請檢查後重試。'
            });
        }
    }
};
</script>

<style scoped>
.timecoin-to-eth-button {
    background: linear-gradient(135deg, hsl(158 70% 50%), hsl(198 70% 50%));
    border-radius: 8px;
    padding: 0.75rem 1.5rem;
    border: none;
    color: white;
    font-weight: 600;
}
</style>