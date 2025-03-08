<template>
  <div class="container">
    <!-- 頂部區域 -->
    <header class="header">
      <h1>房間列表</h1>

      <!-- 搜尋與排序操作 -->
      <div class="search-sort-bar">
        <input type="number" v-model="searchMinBet" placeholder="最小下注金額 (輸入數字)" />
        <select v-model="sortBy">
          <option value="">預設(依 建立時間)</option>
          <option value="players">依 玩家人數</option>
          <option value="minBet">依 最小下注金額</option>
        </select>
        <button @click="refreshRooms">查詢</button>
      </div>

      <!-- 功能按鈕 -->
      <div class="btn-group">
        <button class="btn" @click="createRoom">創建房間</button>
        <button class="btn" @click="refreshRooms">重新整理</button>
      </div>
    </header>

    <!-- 滾動容器(無限滾動) -->
    <div class="scroll-box" ref="scrollContainer" @scroll="handleScroll">
      <div class="room-cards">
        <div v-for="room in gameStore.rooms" :key="room.id" class="room-card">
          <h3>房間ID: {{ room.id }}</h3>
          <p>最低下注金額: {{ room.minBet }} Time Coin</p>
          <p>目前下注金額: {{ room.totalBet }} Time Coin</p>
          <p>玩家: {{ room.playerCount }} / {{ room.maxPlayers }}</p>
          <button @click="joinRoom(room)" class="join-button" :disabled="room.playerCount >= room.maxPlayers"
            :title="room.playerCount >= room.maxPlayers ? '房間人數已滿，無法加入' : ''">
            <span v-if="room.hasPassword" class="lock-icon">🔒</span>
            進入房間
          </button>
        </div>
      </div>

      <div v-if="gameStore.loading" class="loading">載入中...</div>
      <div v-else-if="gameStore.allLoaded" class="no-more">沒有更多房間了</div>
    </div>
  </div>
</template>

<script setup>
import axios from 'axios';
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Swal from 'sweetalert2';
import { useGameStore } from '@/stores/game';

const gameStore = useGameStore();

/** 搜尋、排序 */
const searchMinBet = ref('');
const sortBy = ref('');

/** 取得捲動容器 DOM */
const scrollContainer = ref(null);

/** 初始化：載入第一頁房間 */
onMounted(() => {
  gameStore.loadRooms(true);
});

/**
 * 重新整理（重設 page, rooms, allLoaded）
 */
function refreshRooms() {
  gameStore.loadRooms(true);  // 傳入 true，重置房間列表
}

/**
 * 滾動到底時，自動加載下一頁
 */
function handleScroll() {
  const container = scrollContainer.value;
  if (!container) return;

  const threshold = 200;
  const currentScroll = container.scrollTop + container.clientHeight;
  const maxScroll = container.scrollHeight;

  if (maxScroll - currentScroll < threshold) {
    gameStore.loadRooms();
  }
}

const router = useRouter();

async function createRoom() {
  try {
    // 選擇人數
    const { value: players } = await Swal.fire({
      title: '選擇人數',
      input: 'select',
      inputOptions: {
        2: '2 人',
        3: '3 人',
        4: '4 人',
        5: '5 人'
      },
      inputPlaceholder: '選擇房間人數',
      showCancelButton: true
    });

    if (!players) return;

    // 最低下注金額
    const { value: minBet } = await Swal.fire({
      title: '最低下注金額',
      input: 'number',
      inputPlaceholder: '請輸入最低下注金額',
      inputAttributes: {
        min: 1,
        step: 1
      },
      showCancelButton: true,
      inputValidator: (value) => {
        const numericValue = Number(value);
        if (!numericValue || numericValue <= 0 || !Number.isInteger(numericValue)) {
          return '請輸入有效的正整數作為最低下注金額';
        }
      }
    });

    if (!minBet) return;
    const minBetNumber = Number(minBet); // **確保 minBet 是數字**

    // 下注金額（必須 ≥ minBet，且為正整數）
    const { value: betAmount } = await Swal.fire({
      title: '下注金額',
      input: 'number',
      inputPlaceholder: `請輸入下注金額 (至少 ${minBetNumber} TC)`,
      inputAttributes: {
        min: minBetNumber, // 限制最小輸入值
        step: 1
      },
      showCancelButton: true,
      inputValidator: (value) => {
        const numericValue = Number(value);
        if (!numericValue || numericValue < minBetNumber || !Number.isInteger(numericValue)) {
          return `下注金額必須是正整數，且不小於 ${minBetNumber} TC`;
        }
      }
    });

    if (!betAmount) return;
    const betAmountNumber = Number(betAmount); // **確保 betAmount 是數字**

    // 房間密碼（可選）
    const { value: password } = await Swal.fire({
      title: '房間密碼（選填）',
      input: 'text',
      inputPlaceholder: '4 位英數密碼（可留空）',
      inputAttributes: {
        maxlength: 4
      },
      showCancelButton: true,
      inputValidator: (value) => {
        if (value && !/^[a-zA-Z0-9]{4}$/.test(value)) {
          return '密碼必須是 4 位的英文字母或數字';
        }
      }
    });

    // **構建請求 Payload**
    const payload = {
      walletAddress: gameStore.walletAddress,
      players: parseInt(players),
      minBet: minBetNumber,
      betAmount: betAmountNumber,
      password: password || null
    };

    console.log("Final Values:", payload);

    // **發送 API 請求**
    const { data } = await axios.post(`${process.env.VUE_APP_API_URL}/create-room`, payload);

    if (data.success) {
      console.log('成功建立房間，ID: ', data.roomId);
      router.push(`/pvp/${data.roomId}`);
    } else {
      Swal.fire('錯誤', data.message, 'error');
    }
  } catch (error) {
    console.error(error);
    Swal.fire('錯誤', '創建房間失敗', 'error');
  }
}



const joinRoom = async (room) => {
  const htmlContent = room.hasPassword
    ? '<label for="password-input" style="display: block; margin-bottom: 5px;">房間密碼</label>' +
    '<input id="password-input" type="password" class="swal2-input" placeholder="輸入房間密碼">' +
    '<label for="bet-input" style="display: block; margin-top: 10px; margin-bottom: 5px;">下注金額</label>' +
    `<input id="bet-input" type="number" class="swal2-input" placeholder="最低下注金額: ${room.minBet}" min="${room.minBet}" step="1">`
    : '<label for="bet-input" style="display: block; margin-bottom: 5px;">下注金額</label>' +
    `<input id="bet-input" type="number" class="swal2-input" placeholder="最低下注金額: ${room.minBet}" min="${room.minBet}" step="1">`;

  const { value: formValues } = await Swal.fire({
    title: '加入房間',
    html: htmlContent,
    focusConfirm: false,
    showCancelButton: true,
    preConfirm: () => {
      const enteredPassword = room.hasPassword ? document.getElementById('password-input').value : null;
      const enteredBetAmount = document.getElementById('bet-input').value;

      if (room.hasPassword && !enteredPassword) {
        Swal.showValidationMessage('請輸入房間密碼');
        return false;
      }

      if (!enteredBetAmount || Number(enteredBetAmount) < room.minBet) {
        Swal.showValidationMessage(`下注金額不能小於 ${room.minBet} TC`);
        return false;
      }

      return { password: enteredPassword, betAmount: Number(enteredBetAmount) };
    }
  });

  // 如果使用者取消輸入，則終止操作
  if (!formValues) {
    return;
  }

  const payload = {
    walletAddress: gameStore.walletAddress,
    betAmount: formValues.betAmount,
    password: formValues.password || null  // 如果沒有密碼就設為 null
  };

  // 帶著密碼（若有）與下注金額去打後端
  await axios.post(`${process.env.VUE_APP_API_URL}/join-room/${room.id}`, payload).then(rs => {
    gameStore.pvpRoomInfo.token = rs.data.token;
    router.push(`/pvp/${room.id}`);
  }).catch(error => {
    Swal.fire('錯誤', `${error.response.data.message}`, 'error');
  });
}

</script>

<style scoped>
/* ====== 整體容器 ====== */
.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;

  /* 深色背景 + 白字，增添科技感 */
  background: #0d0d0d;
  color: #ffffff;
  font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* ====== 頂部區域 ====== */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-wrap: wrap;
  /* RWD: 若空間不足，自動換行 */
}

/* ====== 搜尋、排序區域 ====== */
.search-sort-bar {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 10px;
}

/* 讓輸入框、下拉選單在小螢幕時可更寬鬆 */
.search-sort-bar input,
.search-sort-bar select {
  padding: 6px;
  border-radius: 4px;
  border: 1px solid #555;
  background: #222;
  color: #fff;
}

/* ====== 按鈕群組 ====== */
.btn-group {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

/* ====== 基礎按鈕樣式 ====== */
.btn {
  background: #222;
  color: #fff;
  border: 1px solid #333;
  border-radius: 5px;
  padding: 8px 16px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn:hover {
  background: #3a3a3a;
}

/* ====== 滾動容器 ====== */
.scroll-box {
  height: 70vh;
  overflow-y: auto;
  border: 1px solid #333;
  padding: 10px;
}

/* ====== 卡片列表區 ====== */
.room-cards {
  /* 這裡用 CSS Grid，自動換行 */
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 15px;
}

/* ====== 單張卡片 ====== */
.room-card {
  background: #1b1b1b;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 0 5px rgba(255, 255, 255, 0.1);
}

/* ====== 載入/無更多提示 ====== */
.loading,
.no-more {
  text-align: center;
  margin-top: 10px;
  color: #888;
}

/* ======================================
   ======== RWD 媒體查詢 ===========
   ====================================== */
/* 以下示範在 max-width:768px(平板或手機) 調整排版 */
@media (max-width: 768px) {
  .header {
    flex-direction: column;
    align-items: flex-start;
  }

  .search-sort-bar {
    width: 100%;
    flex-direction: column;
    /* 垂直排列 */
    align-items: stretch;
  }

  .search-sort-bar input,
  .search-sort-bar select {
    width: 100%;
  }

  .btn-group {
    width: 100%;
    justify-content: space-between;
  }

  /* 卡片佈局可以改為單欄 (或看需求) */
  .room-cards {
    grid-template-columns: 1fr;
  }
}

.join-button {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: #195675;
  border: none;
  border-radius: 4px;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.join-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.full-room-message {
  color: red;
  font-weight: bold;
}

.join-button:hover {
  background: #0088cc;
}

/* 鎖頭 ICON 的樣式 (假設使用 Font Awesome) */
.lock-icon {
  font-size: 1.2rem;
}
</style>
