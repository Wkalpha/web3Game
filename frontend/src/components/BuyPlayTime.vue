<template>
    <button @click="openTimeCoinToPlayTimesInputBox" class="timecoin-to-play-time-button">購買挑戰次數</button>
</template>

<script setup>
import Swal from 'sweetalert2';
import { ref } from 'vue';
import { useGameStore } from '@/stores/game';
import axios from 'axios';

const gameStore = useGameStore();

const timeCoin = ref(null);

const timeCoinToPlayTime = async (inputValue) => {
    try {
        var response = await axios.post(`${process.env.VUE_APP_API_URL}/update-user-balance-when-buy-playtimes`, {
            walletAddress: gameStore.walletAddress,
            playTimes: inputValue
        });

        console.log(response.data)
    } catch (error) {
        console.error("兌換失敗:", error.message);
    }
};

const openTimeCoinToPlayTimesInputBox = async () => {
    timeCoin.value = null;

    const { value: inputValue } = await Swal.fire({
        title: '購買遊玩次數',
        text: `請輸入要購買的遊玩次數 (1 次 = 100 Time Coin，目前擁有: ${gameStore.userInfo.timeCoin} Time Coin)`,
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
            } else if (value < 1) {
                Swal.showValidationMessage('輸入的遊玩次數必須大於 0');
            } else if (value * 100 > gameStore.userInfo.timeCoin) {
                Swal.showValidationMessage(`您輸入的 Time Coin 數量超過您的餘額（可用餘額：${gameStore.userInfo.timeCoin} Time Coin）`);
            } else {
                timeCoin.value = parseInt(value, 10); // 更新 timeCoin，並確保為整數
                return value; // 返回輸入值，這表示驗證成功
            }
        }
    });

    if (inputValue) {
        await timeCoinToPlayTime(inputValue);
    }
};
</script>

<style scoped>
.timecoin-to-play-time-button {
    background: linear-gradient(135deg, hsl(158 70% 50%), hsl(198 70% 50%));
    border-radius: 8px;
    padding: 0.75rem 1.5rem;
    border: none;
    color: white;
    font-weight: 600;
}
</style>