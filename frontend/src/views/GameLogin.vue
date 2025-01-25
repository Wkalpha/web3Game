<template>
    <h1>TickTock Battle</h1>
    <button v-if="!gameStore.login" @click="gameStore.connectWallet()">Connect Wallet</button>
    <div v-if="!gameStore.login">
        <p>Join us！</p>
        <a href="https://discord.gg/gxBTtEWb" target="_blank"
            style="display: inline-flex; align-items: center; text-decoration: none;">
            <img src="/images/discord.png" alt="Discord" style="width:30px; height:30px; margin-right:8px;">
            Discord
        </a>
    </div>
</template>

<script setup>
import { useGameStore } from '@/stores/game';
import { watch } from 'vue';
import { useRouter } from 'vue-router';

const gameStore = useGameStore();
const router = useRouter();

// 監聽 login 狀態，若變為 true，跳轉到 index 頁面
watch(() => gameStore.login, (newValue) => {
    if (newValue) {
        router.push('/index');
    }
});
</script>

<style scoped>
h1 {
    font-size: 3rem;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-bottom: 30px;
    text-shadow: 0 0 20px rgba(255, 255, 255, 0.8);
    animation: glow 1.5s infinite alternate;
}

button {
    background: linear-gradient(90deg, #ff416c, #ff4b2b);
    color: #fff;
    border: none;
    padding: 15px 40px;
    font-size: 1.2rem;
    font-weight: bold;
    border-radius: 50px;
    cursor: pointer;
    box-shadow: 0px 0px 20px rgba(255, 75, 43, 0.8);
    transition: all 0.3s ease-in-out;
}

button:hover {
    transform: scale(1.1);
    box-shadow: 0px 0px 30px rgba(255, 75, 43, 1);
}

/* Discord 區塊 */
a {
    text-decoration: none;
    color: #00aaff;
    font-size: 1.2rem;
    font-weight: bold;
    display: flex;
    align-items: center;
    transition: all 0.3s ease-in-out;
}

a:hover {
    color: #ffffff;
    transform: scale(1.05);
}

a img {
    width: 40px;
    height: 40px;
    margin-right: 10px;
    filter: drop-shadow(0 0 10px rgba(0, 170, 255, 0.8));
}

/* 炫酷的文字閃爍動畫 */
@keyframes glow {
    from {
        text-shadow: 0 0 10px #fff, 0 0 20px #fff, 0 0 30px #ff416c, 0 0 40px #ff4b2b, 0 0 50px #ff4b2b;
    }

    to {
        text-shadow: 0 0 20px #fff, 0 0 30px #ff416c, 0 0 40px #ff4b2b, 0 0 50px #ff4b2b, 0 0 60px #ff4b2b;
    }
}
</style>