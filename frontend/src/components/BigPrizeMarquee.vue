<template>
    <transition name="fade">
        <div v-if="show" class="announcement-container">
            <p class="announcement-message">{{ currentMessage }}</p>
        </div>
    </transition>
</template>

<script>
import axios from 'axios';

export default {
    name: "BigPrizeAnnouncement",
    data() {
        return {
            show: false, // 控制顯示/隱藏
            messages: [], // 儲存後端返回的消息
            currentMessageIndex: 0, // 當前顯示的消息索引
            intervalId: null, // 計時器 ID
            fetchIntervalId: null, // 後端輪詢計時器 ID
        };
    },
    computed: {
        currentMessage() {
            if (!this.messages.length) return "";
            return this.messages[this.currentMessageIndex];
        },
    },
    methods: {
        async fetchMessages() {
            try {
                const response = await axios.get(`${process.env.VUE_APP_API_URL}/get-big-prize-log`);
                if (Array.isArray(response.data)) {
                    this.messages = response.data;
                    this.show = this.messages.length > 0; // 如果有消息就顯示
                }
            } catch (error) {
                console.error('Error fetching messages:', error);
            }
        },
        startMessageCycle() {
            if (!this.intervalId) {
                this.intervalId = setInterval(() => {
                    if (this.messages.length > 0) {
                        this.currentMessageIndex =
                            (this.currentMessageIndex + 1) % this.messages.length;
                    }
                }, 1500); // 每 1.5 秒切換一則消息
            }
        },
        stopMessageCycle() {
            if (this.intervalId) {
                clearInterval(this.intervalId);
                this.intervalId = null;
            }
            this.currentMessageIndex = 0;
        },
        startFetchingMessages() {
            this.fetchMessages(); // 立即獲取一次消息
            this.fetchIntervalId = setInterval(() => {
                this.fetchMessages();
            }, 30000); // 每 30 秒向後端請求一次
        },
        stopFetchingMessages() {
            if (this.fetchIntervalId) {
                clearInterval(this.fetchIntervalId);
                this.fetchIntervalId = null;
            }
        },
    },
    mounted() {
        this.startFetchingMessages();
        this.startMessageCycle();
    },
    beforeUnmount() {
        this.stopFetchingMessages();
        this.stopMessageCycle();
    },
};
</script>

<style scoped>
.announcement-container {
    top: 0;
    width: 100%;
    z-index: 9999;
    background-color: #ffd90000;
    color: #000;
    text-align: center;
}

/* 文字樣式 */
.announcement-message {
    font-weight: bold;
    margin: 0;
}

/* 淡入淡出動畫 */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.5s;
}

.fade-enter,
.fade-leave-to {
    opacity: 0;
}
</style>
