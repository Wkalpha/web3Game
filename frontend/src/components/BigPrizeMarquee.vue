<template>
    <transition name="fade">
        <div v-if="show" class="announcement-container">
            <p class="announcement-message">{{ currentMessage }}</p>
        </div>
    </transition>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import axios from 'axios';

const show = ref(false); // 控制顯示/隱藏
const messages = ref([]); // 儲存後端返回的消息
const currentMessageIndex = ref(0); // 當前顯示的消息索引
let intervalId = null; // 計時器 ID
let fetchIntervalId = null; // 後端輪詢計時器 ID

const currentMessage = computed(() => {
    return messages.value.length ? messages.value[currentMessageIndex.value] : '';
});

const fetchMessages = async () => {
    try {
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/get-big-prize-log`);
        if (Array.isArray(response.data)) {
            messages.value = response.data;
            show.value = messages.value.length > 0; // 如果有消息就顯示
        }
    } catch (error) {
        console.error('Error fetching messages:', error);
    }
};

const startMessageCycle = () => {
    if (!intervalId) {
        intervalId = setInterval(() => {
            if (messages.value.length > 0) {
                currentMessageIndex.value = (currentMessageIndex.value + 1) % messages.value.length;
            }
        }, 2500); // 每 1.5 秒切換一則消息
    }
};

const stopMessageCycle = () => {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }
    currentMessageIndex.value = 0;
};

const startFetchingMessages = () => {
    fetchMessages(); // 立即獲取一次消息
    fetchIntervalId = setInterval(() => {
        fetchMessages();
    }, 30000); // 每 30 秒向後端請求一次
};

const stopFetchingMessages = () => {
    if (fetchIntervalId) {
        clearInterval(fetchIntervalId);
        fetchIntervalId = null;
    }
};

// 元件掛載時啟動
onMounted(() => {
    startFetchingMessages();
    startMessageCycle();
});

// 元件卸載時清理
onBeforeUnmount(() => {
    stopFetchingMessages();
    stopMessageCycle();
});
</script>

<style scoped>
.announcement-container {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, rgba(0, 255, 255, 0.2), rgba(0, 0, 0, 0.8));
    border: 2px solid rgba(0, 255, 255, 0.5);
    border-radius: 10px;
    box-shadow: 0 0 15px rgba(0, 255, 255, 0.7);
    z-index: 1000;
    text-align: center;
    animation: glow-pulse 2s infinite alternate ease-in-out;
    backdrop-filter: blur(10px);
    max-width: 80%;
    font-family: 'Orbitron', sans-serif;
}

/* 科技感文字樣式 */
.announcement-message {
    font-weight: bold;
    color: #00f7ff;
    text-shadow: 0 0 10px rgba(0, 255, 255, 0.8), 0 0 20px rgba(0, 255, 255, 0.6);
    animation: text-glow 1.5s infinite alternate ease-in-out;
}

/* 出現與消失過渡動畫 */
.fade-enter-active, .fade-leave-active {
    transition: opacity 0.8s ease, transform 0.8s ease;
}

.fade-enter-from, .fade-leave-to {
    opacity: 0;
    transform: translateY(-20px);
}

/* 脈衝動畫 */
@keyframes glow-pulse {
    0% {
        box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
    }
    100% {
        box-shadow: 0 0 25px rgba(0, 255, 255, 1);
    }
}

/* 霓虹字效果 */
@keyframes text-glow {
    0% {
        text-shadow: 0 0 5px rgba(0, 255, 255, 0.8);
    }
    100% {
        text-shadow: 0 0 20px rgba(0, 255, 255, 1);
    }
}

/* 響應式設計 */
@media (max-width: 768px) {
    .announcement-container {
        font-size: 1rem;
    }
    .announcement-message {
        font-size: 0.5rem;
    }
}

@media (max-width: 480px) {
    .announcement-container {
        max-width: 90%;
        top: 0;
    }
    .announcement-message {
        font-size: 0.6rem;
    }
}
</style>