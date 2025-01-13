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
                    <span v-if="quest.RewardClaimed" class="completed">✅ 已領取</span>
                </div>
            </li>
        </ul>
    </div>
</template>

<script>
import axios from 'axios';

export default {
    props: {
        walletAddress: {
            type: String,
            required: true
        },
        refreshKey: Number
    },
    watch: {
        async refreshKey() {
            await this.fetchUserDailyQuest();
        }
    },
    data() {
        return {
            quests: []
        };
    },
    async mounted() {
        await this.fetchUserDailyQuest();
    },
    methods: {
        async fetchUserDailyQuest() {
            try {
                const response = await axios.post('http://localhost:3000/daily-quests', { walletAddress: this.walletAddress });
                this.quests = response.data;
            } catch (error) {
                console.error("取得每日任務時發生錯誤:", error);
            }
        },
        async claimReward(questId) {
            const payload = {
                walletAddress: this.walletAddress,
                questId
            }

            try {
                await axios.post('http://localhost:3000/daily-quests/claim', payload)
                await this.fetchUserDailyQuest(); // ✅ 強制重新取得資料
            } catch (error) {
                console.error("領取獎勵時發生錯誤:", error);
            }
        }
    }
};
</script>

<style scoped>
.daily-quest {
    padding: 16px;
    background: #f8f9fa;
    border-radius: 8px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

ul {
    list-style: none;
    padding: 0;
}

li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px;
    border-bottom: 1px solid #ddd;
}

.quest-info {
    display: flex;
    justify-content: space-between;
    width: 100%;
}

button {
    background: #28a745;
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 4px;
    cursor: pointer;
}

button:disabled {
    background: #ccc;
    cursor: not-allowed;
}

.completed {
    color: #28a745;
}
</style>