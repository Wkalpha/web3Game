<template>
  <button class="swal-trigger tech-button" @click="openPrizeSwal">
    抽徽章
  </button>
</template>

<script setup>
import { ref } from 'vue'
import Swal from 'sweetalert2'
import axios from 'axios'
import { useGameStore } from '@/stores/game'

const gameStore = useGameStore()
const tickets = ref(0)

const getInventory = async () => {
  try {
    const res = await axios.post(`${process.env.VUE_APP_API_URL}/get-inventory`, {
      walletAddress: gameStore.walletAddress
    })
    tickets.value = res.data.inventory.find(i => i.ItemId === 25)?.Quantity || 0
  } catch (err) {
    console.error('獲取庫存失敗:', err)
  }
}

const openPrizeSwal = async () => {
  await getInventory()

  // 主彈窗
  const { value: action } = await Swal.fire({
    title: '徽章抽獎系統',
    html: `
      <div class="swal2-prize-content">
        <h3>可用抽獎券：${tickets.value} 張</h3>
        <button 
          id="swal-draw-btn" 
          class="swal2-confirm swal2-styled"
          style="${tickets.value <= 0 ? 'opacity: 0.5; cursor: not-allowed' : ''}"
          ${tickets.value <= 0 ? 'disabled' : ''}
        >
          ${tickets.value > 0 ? '🎰 開始抽獎!' : '券不足'}
        </button>
        <hr>
        <div class="prize-list">
          <h4>可抽取徽章：</h4>
          <ul>
            ${(await getBadges()).map(b => `
              <li><strong>${b.Name}</strong> (${b.DropRatePercent}%)</li>
            `).join('')}
          </ul>
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: '說明',
    cancelButtonText: '關閉',
    showLoaderOnConfirm: true,
    preConfirm: async () => {
      await showDescription();
      return false;  // 防止彈窗關閉
    },
    didOpen: () => {
      document.getElementById('swal-draw-btn')?.addEventListener('click', startDraw)
    }
  })

  if (action) {
    // 處理說明按鈕
  }
}

// 新增獨立說明彈窗函數
const showDescription = async () => {
  await Swal.fire({
    title: '抽獎規則說明',
    html: `
      <div class="swal2-rules">
        <p>1. 每次消耗 1 張抽獎券</p>
        <p>2. 每週可抽獎次數無上限</p>
        <p>3. 重複獲得徽章會自動疊加</p>
      </div>
    `,
    icon: 'info',
    confirmButtonText: '返回抽獎',
    showCancelButton: false,
    allowOutsideClick: false
  })

  // 手動保持主彈窗開啟
  openPrizeSwal()
}

const getBadges = async () => {
  try {
    const res = await axios.get(`${process.env.VUE_APP_API_URL}/get-badges`)
    return res.data.badges
  } catch (err) {
    console.error('獲取徽章失敗:', err)
    return []
  }
}

const startDraw = async () => {
  if (tickets.value <= 0) return

  let interval
  try {
    // 抽獎動畫
    const animation = Swal.fire({
      title: '抽獎中...',
      html: `
        <div class="swal2-draw-animation">
          <div class="prize-roller"></div>
          <p>即將揭曉結果！</p>
        </div>
      `,
      showConfirmButton: false,
      allowOutsideClick: false,
      didOpen: () => {
        interval = setInterval(() => {
          Swal.getHtmlContainer().querySelector('.prize-roller').innerHTML =
            `<img src="${getRandomBadgeImage()}" class="rolling-badge">`
        }, 100)
      }
    })

    // 執行抽獎 API
    const res = await axios.post(`${process.env.VUE_APP_API_URL}/draw-badge`, {
      walletAddress: gameStore.walletAddress
    })

    clearInterval(interval)
    await animation.close()

    // 顯示結果
    Swal.fire({
      title: '🎉 抽獎結果 🎉',
      html: `
        <div class="swal2-result">
          <img src="${getBadgeImage(res.data.prize.Id)}" class="won-badge">
          <h3>${res.data.prize.Name}</h3>
          <hr>
          <p>剩餘抽獎券：${res.data.tickets} 張</p>
        </div>
      `,
      confirmButtonText: '繼續抽獎',
      showCancelButton: true,
      cancelButtonText: '結束抽獎'
    }).then((result) => {
      if (result.isConfirmed) {
        openPrizeSwal()
      }
    })

  } catch (err) {
    clearInterval(interval)
    Swal.fire('抽獎失敗', err.response?.data?.message || '請稍後再試', 'error')
  }
}

// 圖片 helper 函數
const getRandomBadgeImage = () => `/images/badges/random.gif`
const getBadgeImage = (id) => `/images/badges/${id}.png`
</script>

<style scoped>
/* 自訂 Swal 樣式 */
.swal2-prize-content {
  text-align: left;
}

.swal2-prize-content .prize-list {
  max-height: 40vh;
  overflow-y: auto;
  padding: 10px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 8px;
}

.swal2-prize-content ul {
  list-style: none;
  padding: 0;
}

.swal2-prize-content li {
  padding: 8px;
  margin: 4px 0;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.swal2-draw-animation .prize-roller {
  height: 120px;
  overflow: hidden;
}

.rolling-badge {
  width: 80px;
  height: 80px;
  animation: spin 0.5s linear infinite;
}

.won-badge {
  width: 100px;
  height: 100px;
  margin: 10px auto;
  display: block;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.swal2-result {
  text-align: center;
}

.swal2-result h3 {
  color: #f1c40f;
}

.tech-button {
    position: relative;
    padding: 15px 30px;
    font-size: 18px;
    font-weight: bold;
    color: #00f7ff;
    background: linear-gradient(135deg, #0a0a2e, #1a1a4a);
    border: 2px solid #00f7ff;
    border-radius: 8px;
    text-transform: uppercase;
    letter-spacing: 2px;
    cursor: pointer;
    overflow: hidden;
    transition: all 0.3s ease-in-out;
    box-shadow: 0 0 10px rgba(0, 247, 255, 0.5);
}

.tech-button::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 300%;
    height: 300%;
    background: radial-gradient(circle, rgba(0, 247, 255, 0.3), rgba(0, 0, 0, 0.1));
    transition: all 0.6s ease;
    transform: translate(-50%, -50%) scale(0);
}

.tech-button:hover::before {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0;
}

.tech-button:hover {
    color: #fff;
    background: linear-gradient(135deg, #00f7ff, #008080);
    border-color: #00ffcc;
    box-shadow: 0 0 20px rgba(0, 255, 204, 0.8);
    transform: translateY(-2px);
}

.tech-button:active {
    transform: translateY(1px);
    box-shadow: 0 0 5px rgba(0, 255, 204, 0.8);
}

/* 添加發光邊緣動畫 */
.tech-button::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 8px;
    border: 2px solid transparent;
    -webkit-mask-composite: destination-out;
    mask-composite: exclude;
}
</style>