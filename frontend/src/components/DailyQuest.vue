<template>
    <div class="daily-quest">
        <h2>📅 每日任務</h2>
        <ul>
            <li v-for="quest in quests" :key="quest.DailyQuestId">
                <div class="quest-info">
                    <span>{{ quest.Name }}</span>
                    <span v-if="quest.Progress < quest.Target">{{ quest.Progress }}/{{ quest.Target }}</span>
                    <button v-if="quest.Progress >= quest.Target && !quest.RewardClaimed"
                        @click="claimReward(quest.DailyQuestId)">
                        領取 {{ quest.Reward }} TC
                    </button>
                    <span v-if="quest.RewardClaimed" class="completed">已領取</span>
                </div>
            </li>
        </ul>
    </div>
</template>

<script setup>
import axios from 'axios';
import { ref, watch, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const quests = ref([]);
const refreshKey = ref(0);

// 監聽 refreshKey 來重新獲取每日任務
watch(refreshKey, async () => {
    await fetchUserDailyQuest();
});

// 初始化獲取每日任務
onMounted(async () => {
    await fetchUserDailyQuest();
});

const fetchUserDailyQuest = async () => {
    try {
        const response = await axios.post(`${process.env.VUE_APP_API_URL}/daily-quests`, {
            walletAddress: authStore.walletAddress
        });
        quests.value = response.data;
    } catch (error) {
        console.error("取得每日任務時發生錯誤:", error);
    }
};

const claimReward = async (questId) => {
    try {
        await axios.post(`${process.env.VUE_APP_API_URL}/daily-quests/claim`, {
            walletAddress: authStore.walletAddress,
            questId
        });
        await fetchUserDailyQuest();  // 重新獲取任務以更新狀態
    } catch (error) {
        console.error("領取獎勵時發生錯誤:", error);
    }
};
</script>

<style scoped>
/* 整體樣式 */
.daily-quest {
    padding: 20px;
    background: linear-gradient(135deg, #1e3c72, #2a5298);
    border-radius: 15px;
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
    color: #fff;
    font-family: 'Poppins', sans-serif;
    max-width: 600px;
    margin: 20px auto;
    border: 2px solid rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
    animation: fadeIn 1.2s ease-in-out;
}

/* 標題 */
h2 {
    text-align: center;
    font-size: 2rem;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 2px;
    text-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
    animation: glow 1.5s infinite alternate;
}

/* 任務列表 */
ul {
    list-style: none;
    padding: 0;
    margin: 0;
}

li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    margin-bottom: 15px;
    transition: transform 0.3s ease-in-out;
    position: relative;
    overflow: hidden;
}

/* 發光效果 */
li::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.2);
    transform: skewX(-45deg);
    transition: left 0.5s ease-in-out;
}

li:hover::before {
    left: 100%;
}

/* 將任務名稱與進度左右對齊 */
.quest-info {
    display: flex;
    justify-content: space-between;
    width: 100%;
    align-items: center;
    font-size: 1.2rem;
    font-weight: bold;
}

/* 任務名稱 */
.quest-info span:first-child {
    text-align: left;
    flex: 1;
}

/* 進度 */
.quest-info span:last-child {
    text-align: right;
    color: #ffd700;
}

/* 按鈕樣式 */
button {
    background: linear-gradient(90deg, #ff416c, #ff4b2b);
    color: #fff;
    border: none;
    border-radius: 30px;
    font-weight: bold;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.3s ease-in-out;
    box-shadow: 0 5px 15px rgba(255, 75, 43, 0.5);
}

button:hover {
    transform: scale(1.1);
    box-shadow: 0 5px 25px rgba(255, 75, 43, 0.8);
}

/* 領取完成樣式 */
.completed {
    color: #28a745;
    font-weight: bold;
    text-shadow: 0 0 10px rgba(40, 167, 69, 0.8);
}

/* 進度條 */
span {
    font-size: 1.2rem;
    font-weight: bold;
    letter-spacing: 1px;
}

/* 鍵入動畫效果 */
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

</style>

