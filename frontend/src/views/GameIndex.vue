<template>
    <div class="game-interface">

        <header class="top-bar">
            <!-- 主要資訊區 -->
            <div class="info-cluster">
                <div class="dynamic-group">
                    <span class="wallet-address">錢包地址：{{ gameStore.walletAddress }}</span>
                    <div class="value-group">
                        <span class="eth-value">ETH:{{ gameStore.balance }}</span>
                        <TimeCoinToEth />
                    </div>
                </div>
            </div>

            <!-- 資源操作區 -->
            <div class="action-cluster">
                <div class="resource-group">
                    <span class="coin-value">💰 {{ gameStore.userInfo.timeCoin }}</span>
                    <EthToTimeCoin />
                </div>
            </div>
        </header>

        <main class="game-screen">
            <div class="daily-missions">
                <DailyQuest />
            </div>


            <div class="stage">
                <BigPrizeMarquee />
                <!-- 徽章列 -->
                <div class="badge-section">
                    <BadgeLottery />
                    <BadgeDisplay />
                </div>

                <!-- 獎金池區域 -->
                <div class="bonus-pools">
                    <div class="bonus main-pool">
                        <PrizePool />
                        <div class="action-buttons">
                            <button class="action-btn primary" @click="navigateToPvE">爭奪獎金</button>
                            <button class="action-btn secondary" @click="navigateToPvE">挑戰玩家</button>
                        </div>
                    </div>

                    <div class="bonus leaderboard-pool">
                        <LeaderboardPrizePool />
                        <ShowLeaderboard />
                    </div>
                </div>

                <div class="play-area">
                    <div class="stats-grid">
                        <div class="stat-item">
                            <span class="stat-label">攻擊力倍率</span>
                            <span class="stat-value">{{ gameStore.userBaseInfo.BaseAttackPower }}倍</span>
                            <span class="stat-label">結算獎勵倍率</span>
                            <span class="stat-value">{{ gameStore.userBaseInfo.RewardMultiplier }}倍</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">每日可遊玩次數</span>
                            <span class="stat-value">{{ gameStore.userBaseInfo.BaseLeftOfPlay }} 次</span>
                            <span class="stat-label">剩餘</span>
                            <span class="stat-value">{{ gameStore.userInfo.leftOfPlay }} 次</span>
                            <BuyPlayTime />
                        </div>
                    </div>
                </div>

            </div>

            <div class="inventory">
                <UserInventory />
                <PrizeItemPool />
            </div>
        </main>


    </div>
</template>

<script setup>
import { defineOptions } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStore } from '@/stores/game';
import DailyQuest from '@/components/DailyQuest.vue';
import PrizePool from '@/components/PrizePool.vue';
import LeaderboardPrizePool from '@/components/LeaderboardPrizePool.vue';
import ShowLeaderboard from '@/components/ShowLeaderboard.vue';
import UserInventory from '@/components/UserInventory.vue';
import PrizeItemPool from '@/components/PrizeItemPool.vue';
import BadgeDisplay from '@/components/BadgeDisplay.vue';
import BadgeLottery from '@/components/BadgeLottery.vue';
import BigPrizeMarquee from '@/components/BigPrizeMarquee.vue';
import EthToTimeCoin from '@/components/EthToTimeCoin.vue';
import TimeCoinToEth from '@/components/TimeCoinToEth.vue';
import BuyPlayTime from '@/components/BuyPlayTime.vue';
import Swal from 'sweetalert2';

defineOptions({
    name: 'GameIndex'
});

const gameStore = useGameStore();

const router = useRouter();
const navigateToPvE = () => {

    if (gameStore.userInfo.leftOfPlay <= 0) {
        Swal.fire({
            title: '遊玩次數不足',
            icon: 'error',
            confirmButtonText: '確定'
        });
        return;
    }

    if (gameStore.userInfo.timeCoin < 100) {
        Swal.fire({
            title: 'Time Coin 不足',
            text: '至少需要 100 Time Coin 才能進入 PvE 模式！',
            icon: 'warning',
            confirmButtonText: '瞭解'
        });
        return;
    }

    // 若上面的檢核全部通過，就可以執行跳轉
    router.push('/pve');
};

</script>

<style scoped>
.game-interface {
    display: flex;
    flex-direction: column;
    height: 100vh;
}

.game-screen {
    flex: 1;
    display: grid;
    grid-template-columns: 250px 1fr 200px;
    gap: 1rem;
    padding: 1rem;
}

.top-bar {
    --gap: 0.75rem;
    --min-column: 150px;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, var(--min-column)), 1fr));
    gap: var(--gap);
    padding: 1rem;
    background: hsl(220 15% 18%);
    align-items: center;
}

.info-cluster {
    display: flex;
    gap: var(--gap);
    min-width: 0;
}

.dynamic-group {
    display: grid;
    gap: 0.25rem;
    grid-template-columns: repeat(auto-fit, minmax(min-content, 1fr));
}

.value-group {
    display: inline-flex;
    gap: 0.5rem;
    align-items: center;
}

.action-cluster {
    justify-self: end;
}

.resource-group {
    display: inline-flex;
    gap: 0.75rem;
    align-items: center;
}

.pill-button {
    background: hsl(220 15% 25%);
    border-radius: 999px;
    padding: 0.5rem 1rem;
    border: none;
    color: white;
}

.gradient-button {
    background: linear-gradient(135deg, hsl(158 70% 50%), hsl(198 70% 50%));
    border-radius: 8px;
    padding: 0.75rem 1.5rem;
    border: none;
    color: white;
    font-weight: 600;
}

.daily-missions {
    gap: 1.5rem;
    border-radius: 12px;
}

.stage {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.badge-section {
    background: #333;
    border-radius: 8px;
    display: grid;
    grid-template-columns: repeat(2, auto);
    gap: 15px;
    justify-content: center;
    align-items: center;
}

.badge-section button {
    grid-column: span 1;
    border: none;
    padding: 10px 20px;
    border-radius: 5px;
    font-weight: bold;
    cursor: pointer;
}

.badge-section .badges {
    grid-column: span 2;
    /* 讓徽章列占據整行 */
    display: flex;
    justify-content: center;
    gap: 10px;
    flex-wrap: wrap;
}

/* 獎金池區域 */
.bonus-pools {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
}

.bonus {
    background: #333;
    padding: 1rem;
    border-radius: 8px;
    text-align: center;
}

.bottom-nav {
    padding: 15px 0;
    display: flex;
    justify-content: space-evenly;
    /* 讓按鈕均勻分布，確保看起來居中 */
}

.bottom-nav button {
    width: 150px;
    /* 固定每個按鈕的寬度 */
    text-align: center;
    padding: 10px 15px;
}

.inventory {
    gap: 1.5rem;
    padding: 1rem;
    border-radius: 12px;
}



/* 智能響應式處理 */
@media (max-width: 1200px) {
    .game-screen {
        grid-template-columns: 200px 1fr 150px;
    }
}

@media (max-width: 992px) {
    .game-screen {
        grid-template-columns: 1fr;
    }

    .inventory {
        grid-column: 1 / -1;
    }

    .badges {
        flex-wrap: wrap;
        overflow-x: visible;
    }
}

@media (max-width: 768px) {
    .top-bar {
        grid-template-columns: 1fr;
        justify-items: stretch;
    }

    .action-cluster {
        justify-self: stretch;
    }

    .resource-group {
        justify-content: space-between;
    }

    .wallet-address {
        max-width: 30ch;
        overflow: hidden;
        text-overflow: ellipsis;
    }
}

@media (max-width: 576px) {
    .dynamic-group {
        grid-template-columns: 1fr;
    }

    .value-group {
        flex-wrap: wrap;
        gap: 0.25rem;
    }

    .gradient-button {
        padding: 0.75rem;
        width: 100%;
    }
}

/* 按鈕基本樣式 */
button {
    background: #4CAF50;
    border: none;
    color: white;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    transition: opacity 0.3s;
}

button:hover {
    opacity: 0.8;
}

/* 互動增強 */
button {
    transition: all 0.2s ease;
    cursor: pointer;
}

button:hover {
    filter: brightness(1.1);
    transform: translateY(-1px);
}

button:active {
    transform: translateY(1px);
}

/* 現代化文字處理 */
.wallet-address {
    font-family: monospace;
    color: hsl(158 70% 50%);
}

.eth-value {
    font-family: monospace;
    color: hsl(158 70% 50%);
}

.coin-value {
    font-size: 1.25rem;
    font-weight: 600;
}

.play-area {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    margin: 1rem 0;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    margin-bottom: 1.5rem;
}

.stat-item {
    background: rgba(0, 0, 0, 0.2);
    padding: 1rem;
    border-radius: 8px;
    text-align: center;
}

.stat-label {
    display: block;
    font-size: 0.9rem;
    color: #a0a0a0;
    margin-bottom: 0.5rem;
}

.stat-value {
    display: block;
    font-size: 1.2rem;
    font-weight: bold;
    color: #fff;
}

.action-buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
}

.action-btn {
    padding: 0.8rem 1.5rem;
    border: none;
    border-radius: 25px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;
    min-width: 160px;
    margin: 2rem;
}

.action-btn.primary {
    background: linear-gradient(135deg, #ff6b6b, #ff3838);
    color: white;
}

.action-btn.secondary {
    background: linear-gradient(135deg, #4b6cb7, #182848);
    color: white;
}

.action-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

@media (max-width: 768px) {
    .stats-grid {
        grid-template-columns: 1fr;
    }

    .action-buttons {
        flex-direction: column;
    }

    .action-btn {
        width: 100%;
        padding: 1rem;
    }
}

@media (max-width: 480px) {
    .action-btn {
        margin: 0rem;
    }

    .badge-section button {
        margin-left: 1rem;
    }

    .play-area {
        padding: 1rem;
    }

    .bonus-pools {
        display: grid;
        grid-template-columns: repeat(1, 1fr);
        gap: 1rem;
    }

    .stat-item {
        padding: 0.8rem;
    }

    .stat-label {
        font-size: 0.8rem;
    }

    .stat-value {
        font-size: 1rem;
    }
}
</style>