<template>
    <div class="room-card" :class="{ full: room.currentPlayers >= room.maxPlayers }">
        <div class="header">
            <span class="id">#{{ room.id }}</span>
            <span class="players">{{ room.currentPlayers }}/{{ room.maxPlayers }}人</span>
        </div>

        <div class="body">
            <div class="min-bet">
                <span class="label">最低下注</span>
                <span class="value">{{ room.minBet }} TC</span>
            </div>

            <button class="join-btn" :disabled="room.currentPlayers >= room.maxPlayers" @click="$emit('join', room.id)">
                {{ room.currentPlayers >= room.maxPlayers ? '已满员' : '立即加入' }}
            </button>
        </div>

        <div v-if="room.hasPassword" class="lock-icon">🔒</div>
    </div>
</template>

<script setup>
import { defineProps } from 'vue'
defineProps({
    room: {
        type: Object,
        required: true
    }
});
</script>

<style scoped>
.room-card {
    position: relative;
    border: 1px solid #eee;
    border-radius: 12px;
    padding: 15px;
    transition: transform 0.2s;
}

.room-card:hover {
    transform: translateY(-3px);
}

.header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 12px;
    font-size: 0.9em;
    color: #666;
}

.body {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.min-bet {
    display: flex;
    flex-direction: column;
}

.label {
    font-size: 0.8em;
    color: #999;
}

.value {
    font-weight: bold;
    color: #007bff;
    font-size: 1.2em;
}

.join-btn {
    padding: 8px 20px;
    border: none;
    border-radius: 6px;
    background: #28a745;
    color: white;
    cursor: pointer;
}

.join-btn:disabled {
    background: #ddd;
    cursor: not-allowed;
}

.lock-icon {
    position: absolute;
    top: 10px;
    right: 10px;
    opacity: 0.6;
}

.full {
    opacity: 0.7;
    background: #f8f9fa;
}
</style>