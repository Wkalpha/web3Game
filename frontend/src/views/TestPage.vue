<template>
  <div class="game-interface">
    <header class="top-bar">
      <!-- 主要資訊區 -->
      <div class="info-cluster">
        <div class="dynamic-group">
          <span class="wallet-address">0x1234567899849874asdfasdfasdf5678</span>
          <div class="value-group">
            <span class="eth-value">ETH: 206,956</span>
            <button class="pill-button">換回ETH</button>
          </div>
        </div>
      </div>

      <!-- 資源操作區 -->
      <div class="action-cluster">
        <div class="resource-group">
          <span class="coin-value">💰 1,814K</span>
          <button class="gradient-button">購買TC</button>
        </div>
      </div>
    </header>



    <main class="game-screen">
      <div class="daily-missions">
        <h3>每日任務</h3>
        <ul>
          <li v-for="(mission, index) in missions" :key="index">
            <span>{{ mission.title }}</span>
            <button @click="completeMission(mission)">領取</button>
          </li>
        </ul>
      </div>

      <div class="stage">
        <!-- 徽章列 -->
        <div class="badge-section">
          <button>抽徽章</button>
          <button>轉移徽章</button>
          <div class="badges">
            <div class="badge" v-for="(badge, index) in badges" :key="index">
              <img :src="badge.icon" alt="徽章" />
            </div>
          </div>
        </div>

        <!-- 獎金池區域 -->
        <div class="bonus-pools">
          <div class="bonus main-pool">
            <h3>獎金池</h3>
            <p>{{ mainPool.amount }} TC</p>
          </div>

          <div class="bonus leaderboard-pool">
            <h3>排行榜獎金池</h3>
            <p>{{ leaderboardPool.amount }} TC</p>
            <button @click="joinLeaderboardPool">查看排名</button>
          </div>
        </div>

        <div class="action-area">
          <button>測試</button>
          <button>測試</button>
        </div>
      </div>

      <div class="inventory">
        <div class="inventory-card">
          <h3 class="inventory-title">📦 背包</h3>
          <div class="inventory-grid">
            <div class="item" v-for="i in 20" :key="i">
              <span style="white-space: normal;word-break: break-all;max-width: 80%;">asdfasdfafasdfasdfasdfasdfasdfasdfasdfasd12341234123421342314123412341324</span>
              <div class="item-meta">x{{ i * 999 }}</div>
            </div>
          </div>
        </div>

        <div class="inventory-actions">
          <button class="inventory-btn accent">
            <img src="/icons/gacha.png" class="btn-icon">
            <span>抽獎</span>
          </button>
          <button class="inventory-btn accent">
            <img src="/icons/gacha.png" class="btn-icon">
            <span>抽獎</span>
          </button>
          <button class="inventory-btn accent">
            <img src="/icons/gacha.png" class="btn-icon">
            <span>抽獎</span>
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue';
const missions = ref([
  { title: '完成3場遊戲', completed: false },
  { title: '贏得1場PVP對戰', completed: false },
  { title: '登入遊戲', completed: true },
]);

const completeMission = (mission) => {
  alert(`已完成任務: ${mission.title}`);
};
const badges = ref([
  { icon: '/icons/trophy.png' },
  { icon: '/icons/trophy.png' },
  { icon: '/icons/trophy.png' },
]);
const mainPool = ref({
  amount: 50000
});

const leaderboardPool = ref({
  amount: 100000
});

const joinLeaderboardPool = () => {
  console.log("查看排行榜");
};

</script>

<style scoped>
.inventory {
  display: grid;
  gap: 1.5rem;
  padding: 1rem;
  background: #333;
  border-radius: 12px;
  overflow: hidden; /* 隱藏溢出的滾動條 */
}

/* 庫存卡片設計 */
.inventory-card {
  min-width: 0; /* 允許內容壓縮 */
  grid-template-rows: auto minmax(0, 1fr); /* 新增網格行限制 */
  gap: 1rem;
}

.inventory-title {
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: hsl(158 70% 50%);
}

/* 網格布局系統 */
.inventory-grid {
  --min-item-size: 80px;
  display: grid;
  min-width: 0; /* 新增這行 */
  grid-template-columns: repeat(auto-fill, minmax(var(--min-item-size), 1fr));
  gap: 0.75rem;
  padding: 0.5rem;
  background: hsl(220 15% 15%);
  border-radius: 8px;
  max-height: 400px; /* 預設高度 */
  overflow-y: auto; /* 垂直滾動 */
  overscroll-behavior: contain; /* 防止滾動穿透 */
}

/* 自定義滾動條樣式 */
.inventory-grid::-webkit-scrollbar {
  width: 8px;
  background: hsl(220 15% 20%);
}

.inventory-grid::-webkit-scrollbar-thumb {
  background: hsl(220 15% 30%);
  border-radius: 4px;
}

.inventory-grid::-webkit-scrollbar-thumb:hover {
  background: hsl(220 15% 40%);
}

.item {
  position: relative;
  aspect-ratio: 1;
  background: hsl(220 15% 20%);
  border-radius: 6px;
  overflow: hidden;
  transition: transform 0.2s ease;
}

.item:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

.item-icon {
  max-width: 100%;
  height: auto;
}

.item-meta {
  position: absolute;
  bottom: 0;
  right: 0;
  background: hsl(220 15% 10% / 0.9);
  padding: 0.25rem 0.5rem;
  font-size: 0.8em;
  border-radius: 4px 0 0 0;
}

/* 操作按鈕組 */
.inventory-actions {
  display: grid;
  gap: 0.75rem;
}

.inventory-btn {
  --btn-bg: hsl(220 15% 25%);
  --btn-color: white;
  
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 8px;
  border: none;
  background: var(--btn-bg);
  color: var(--btn-color);
  transition: all 0.2s ease;
}

.inventory-btn.primary {
  --btn-bg: linear-gradient(135deg, hsl(198 70% 50%), hsl(158 70% 50%));
}

.inventory-btn.accent {
  --btn-bg: linear-gradient(135deg, hsl(320 70% 50%), hsl(280 70% 50%));
}

.inventory-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.game-interface {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #1a1a1a;
  color: white;
}

/* 現代化響應式核心樣式 */
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

/* 主要遊戲畫面 */
.game-screen {
  flex: 1;
  display: grid;
  grid-template-columns: 250px 1fr 200px;
  gap: 1rem;
  padding: 1rem;
}

/* 每日任務 */
.daily-missions {
  background: #333;
  padding: 1rem;
  border-radius: 8px;
  height: fit-content;
}

.daily-missions ul {
  list-style: none;
}

.daily-missions li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #444;
}

/* 遊戲主舞台 */
.stage {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.badge-section {
  background: #333;
  padding: 1rem;
  border-radius: 8px;
}

.badges {
  display: flex;
  gap: 1rem;
  padding: 1rem 0;
  overflow-x: auto;
}

.badge {
  min-width: 60px;
  height: 60px;
  background: #444;
  border-radius: 8px;
  flex-shrink: 0;
}

.badge img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

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

.action-area {
  display: flex;
  gap: 1rem;
  justify-content: center;
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

  .daily-missions,
  .inventory {
    order: -1;
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
    width: 100%;
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
  font-variant-numeric: tabular-nums;
}

.coin-value {
  font-size: 1.25rem;
  font-weight: 600;
}
</style>