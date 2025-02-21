<template>
    <div class="official-intro-container">
        <section class="hero-section">
            <div class="hero-content">
                <h1 class="game-title animate-float">Time Battle</h1>
                <p class="game-subtitle">
                    時間就是金錢
                </p>
                <p class="game-subtitle">
                    測驗你的極限時間感
                </p>
                <p class="game-subtitle">
                    挑戰獲得豐富獎勵
                </p>
                <button class="cta-button" @click="scrollToFeatures">
                    了解更多
                </button>
            </div>
        </section>

        <!-- 介紹區塊 -->
        <section class="info-section" ref="featureRef">
            <div class="info-content">
                <h2 class="section-title">遊戲介紹</h2>
                <p class="section-desc">
                    在這個時間被無數事物瓜分的時代，我們打造了一款
                    <span class="highlight">結合 Web3 技術</span>的極簡卻刺激的遊戲，
                    短短幾秒就能看出你對時間的掌握度，並透過 PvE 與 PvP 模式賺取真實收益！
                </p>
            </div>

            <!-- 遊戲特色 -->
            <div class="features">
                <div class="feature-card">
                    <h3>極速 PvE 模式</h3>
                    <p>
                        隨機取得目標秒數後，心中默數並停止計時，誤差越小分數越高，累積至指定門檻即可獲得獎金池獎勵！
                    </p>
                </div>
                <div class="feature-card">
                    <h3>緊張 PvP 對戰</h3>
                    <p>
                        與其他玩家對決，爭奪對方資產。展現你對時間的天賦，精準掌握秒數才能拿下勝利！
                    </p>
                </div>
                <div class="feature-card">
                    <h3>遊玩三步驟</h3>
                    <ol class="how-to-play">
                        <li>取得隨機目標秒數</li>
                        <li>按下攻擊按鈕並心中默數</li>
                        <li>接近目標秒數時按下停止，差值越小分數越高</li>
                    </ol>
                </div>
            </div>
        </section>

        <!-- 遊玩影片 -->
        <section class="video-section">
            <h2 class="video-section-title">遊戲實際遊玩影片</h2>
            <p class="video-section-desc">
                親眼感受 Time Battle DApp 的魅力，快來一睹為快！
            </p>
            <div>
                <LiteYouTubeEmbed id="Dxqi16hoMFA" title="Demo" />
            </div>
        </section>

        <!-- 預約 區塊 -->
        <section class="cta-section">
            <div class="cta-content">
                <h2 class="section-title">感興趣了嗎？</h2>
                <p class="section-desc">
                    立即預約，展現你的精準與魄力！
                </p>
                <button class="cta-button" @click="showSignup">
                    預約
                </button>
            </div>
        </section>

        <!-- 使用 Vue Transition 讓 modal 有進退場動畫，name="slide-down" 會對應到下面的 CSS -->
        <transition name="slide-down">
            <!-- Modal 外層 -->
            <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
                <!-- Modal 內容容器 -->
                <div class="modal-container">
                    <!-- 關閉按鈕 -->
                    <button class="close-button" @click="showModal = false">✕</button>

                    <!-- 標題 -->
                    <h2 class="modal-title">搶先體驗</h2>
                    <p class="modal-text">
                        輸入錢包地址獲取
                        <span class="highlight">創始玩家資格</span><br />
                        前 100 名預約可獲得：
                    </p>

                    <!-- 獎勵展示 -->
                    <div class="rewards">
                        <div class="reward">
                            <div class="reward-amount">🪙 500</div>
                            <div class="reward-desc">Time Coin</div>
                        </div>
                        <div class="reward">
                            <div class="reward-amount">🎮 5x</div>
                            <div class="reward-desc">免費挑戰</div>
                        </div>
                    </div>

                    <!-- 輸入框 -->
                    <div class="input-block">
                        <input v-model="userInfo" type="email" placeholder="輸入 錢包地址" class="modal-input"
                            @focus="startInputGlow" @blur="stopInputGlow" />
                    </div>

                    <!-- 提交按鈕 -->
                    <button @click="handleSubmit" :disabled="!isValidInput || isSubmitting" class="submit-button">
                        <template v-if="!isSubmitting">
                            <span>立即預約</span>
                        </template>
                        <div v-else class="loading-indicator">
                            <span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>
                        </div>
                    </button>

                    <!-- 剩餘席位進度條 -->
                    <div class="slots-info">
                        預約人數: {{ registeredCount }}
                    </div>
                </div>
            </div>
        </transition>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios';
import Swal from 'sweetalert2';
import LiteYouTubeEmbed from 'vue-lite-youtube-embed'
import 'vue-lite-youtube-embed/style.css'

onMounted(async () => {
    await fetchReserveCount();
});

// 先定義參考用的 Regex
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const walletPattern = /^0x[a-fA-F0-9]{40}$/

// 建立 userInfo 變數
const userInfo = ref('')

// 用 computed 來動態判斷
const isValidInput = computed(() => {
    return emailPattern.test(userInfo.value) || walletPattern.test(userInfo.value)
});

const featureRef = ref(null);
const showModal = ref(false);
const isSubmitting = ref(false);
const registeredCount = ref(0);

const fetchReserveCount = async () => {
    try {
        const res = await axios.get(`${process.env.VUE_APP_API_URL}/reserveCount`);
        registeredCount.value = res.data.total;
    } catch (err) {
        console.error('取得 reserveCount 失敗:', err);
    }
}

const showSignup = async () => {
    showModal.value = true

    const payload = {
        action: 'reserve button'
    }
    await axios.post(`${process.env.VUE_APP_API_URL}/click`, payload);
}

const handleSubmit = async () => {
    if (!isValidInput.value) return

    isSubmitting.value = true
    try {
        const payload = {
            action: 'register button',
            userInfo: userInfo.value
        }
        await axios.post(`${process.env.VUE_APP_API_URL}/reserve`, payload).then(async rs => {
            userInfo.value = '';
            showModal.value = false;
            registeredCount.value = rs.data.total;

            await axios.post(`${process.env.VUE_APP_API_URL}/click`, payload);

            const result = await Swal.fire({
                title: '<span style="font-size:1rem;">預約成功</span>',
                html: '<span style="font-size:1rem;">加入 Discord 隨時取得最新資訊</span>',
                icon: 'success',
                showCancelButton: true,
                confirmButtonText: '加入',
                cancelButtonText: '取消',
            })

            if (result.isConfirmed) {
                // 開啟 Discord 連結，_blank 代表新分頁
                window.open('https://discord.gg/9xdHrPrUk9', '_blank')
            }
        }).catch(err => {
            showModal.value = false;
            isSubmitting.value = false;
            userInfo.value = '';
            Swal.fire({
                title: `<span style="font-size:1rem;">${err.response.data.message}</span>`,
                icon: 'error',
                cancelButtonText: '確認',
            })
        })
    } finally {
        isSubmitting.value = false
    }
}

function scrollToFeatures() {
    featureRef.value?.scrollIntoView({ behavior: 'smooth' })
}

</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap');

/* 整體容器設定 */
.official-intro-container {
    font-family: 'Poppins', 'Microsoft JhengHei', sans-serif;
    color: #ffffff;
    background-color: #0f0f0f;
    min-height: 100vh;
}

/* 首屏 Hero 區域 */
.hero-section {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    background: linear-gradient(140deg, #1f1f1f 20%, #292929 80%);
    position: relative;
    overflow: hidden;
}

.hero-content {
    text-align: center;
    max-width: 600px;
    padding: 0 20px;
}

.game-logo {
    width: 150px;
    margin-bottom: 20px;
}

.game-title {
    font-size: 3rem;
    margin-bottom: 10px;
    letter-spacing: 2px;
}

.game-subtitle {
    font-size: 1.2rem;
    margin-bottom: 30px;
    color: #cccccc;
}

.cta-button {
    background-color: #00b4d8;
    border: none;
    padding: 12px 30px;
    font-size: 1rem;
    color: #ffffff;
    cursor: pointer;
    border-radius: 4px;
    transition: background-color 0.3s;
}

.cta-button:hover {
    background-color: #0090af;
}

/* 介紹區塊 */
.info-section {
    padding: 60px 20px;
    background-color: #121212;
    text-align: center;
}

.info-content {
    max-width: 800px;
    margin: 0 auto;
    margin-bottom: 40px;
}

.section-title {
    font-size: 2.2rem;
    margin-bottom: 20px;
}

.section-desc {
    font-size: 1.1rem;
    line-height: 1.6;
    color: #cccccc;
    margin: 0 auto;
    max-width: 600px;
}

.highlight {
    color: #00b4d8;
    font-weight: bold;
}

/* 遊戲特色卡片 */
.features {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 30px;
    margin-top: 40px;
}

.feature-card {
    background-color: #1c1c1c;
    border-radius: 8px;
    padding: 20px;
    max-width: 300px;
    text-align: left;
    box-shadow: 0 0 10px rgba(0, 180, 216, 0.2);
}

.feature-card h3 {
    font-size: 1.5rem;
    margin-bottom: 10px;
    color: #00b4d8;
}

.feature-card p {
    font-size: 1rem;
    line-height: 1.6;
    color: #dddddd;
}

.how-to-play {
    list-style: decimal;
    margin: 0;
    padding-left: 20px;
    color: #ddd;
}

.how-to-play li {
    margin-bottom: 5px;
}

/* CTA 區塊 */
.cta-section {
    padding: 60px 20px;
    background: linear-gradient(140deg, #1b1b1b 20%, #2f2f2f 80%);
    text-align: center;
}

.cta-content {
    max-width: 600px;
    margin: 0 auto;
}

.cta-section .section-title {
    font-size: 2rem;
    margin-bottom: 20px;
}

.cta-section .section-desc {
    font-size: 1.1rem;
    line-height: 1.6;
    color: #cccccc;
    margin-bottom: 30px;
}

/* 進退場動畫 */
.slide-down-enter-active,
.slide-down-leave-active {
    transition: all 0.3s ease;
}

.slide-down-enter {
    opacity: 0;
    transform: translateY(-40px);
}

.slide-down-leave-to {
    opacity: 0;
    transform: translateY(-40px);
}

/* Modal 背景遮罩 */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    /* height: 100vh; */
    background-color: rgba(0, 0, 0, 0.7);
    z-index: 9999;
    overflow: auto;
    /* 防止內容太多時可捲動 */
    display: flex;
    justify-content: center;
    /* 水平置中 */
    align-items: flex-start;
    /* 從上方開始排列 */
    padding-top: 15rem;
    /* 讓 Modal 距離視窗頂部一些距離 */
}

/* Modal 內容容器 */
.modal-container {
    position: relative;
    width: 90%;
    max-width: 600px;
    background: #0a0a1a;
    /* 賽博風深色背景 */
    border: 2px solid #00f3ff;
    /* 螢光藍邊框 */
    border-radius: 1rem;
    padding: 2rem;
    box-shadow: 0 0 30px rgba(0, 243, 255, 0.2);
    color: #fff;
}

/* 關閉按鈕 (右上角 X) */
.close-button {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: transparent;
    border: none;
    color: #8b8b9b;
    font-size: 1.5rem;
    cursor: pointer;
}

.close-button:hover {
    color: #ff00ff;
}

/* 標題、文字 */
.modal-title {
    font-size: 2rem;
    margin-bottom: 1rem;
    font-weight: bold;
}

.modal-text {
    margin-bottom: 1.5rem;
    line-height: 1.5;
    color: #8b8b9b;
}

/* 輸入區塊 */
.input-block {
    margin-bottom: 1.5rem;
}

.modal-input {
    /* 原先可能是 width: 100%; 改為想要的寬度，例如 80% */
    width: 80%;
    padding: 0.75rem;
    margin: 0 auto;
    /* 水平置中 */
    display: block;
    /* 需要是區塊元素才能 margin: 0 auto 生效 */
    border-radius: 0.5rem;
    border: 1px solid #00f3ff;
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
    outline: none;
}

/* 提交按鈕 */
.submit-button {
    /* 移除 width: 100%; */
    padding: 0.75rem 1.5rem;
    /* 可自行調整左右內距以控制按鈕長度 */
    margin: 0 auto;
    /* 水平置中 */
    display: block;
    /* 配合 margin: 0 auto */
    border: none;
    border-radius: 2rem;
    background: linear-gradient(45deg, #00f3ff 0%, #ff00ff 100%);
    color: #fff;
    font-weight: bold;
    cursor: pointer;
    text-align: center;
    /* 置中文字居中 */
    /* 其他屬性可維持原狀 */
}

.submit-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* 載入中狀態 */
.loading-indicator .dot {
    animation: dotPulse 1.4s infinite;
}

/* 手機 / 平板 (max-width: 768px) */
@media (max-width: 768px) {

    /* 讓標題不要太大 */
    .text-6xl {
        font-size: 2.5rem;
    }

    .md-text-8xl {
        font-size: 3rem;
    }

    /* Grid 排版改為單欄 */
    .grid-cols-3,
    .md-grid-cols-3 {
        grid-template-columns: 1fr;
    }

    /* Modal 遮罩與容器：垂直置中、減少上方間距 */
    .modal-overlay {
        padding-top: 5rem;
        align-items: center;
    }

    .modal-container {
        max-width: 90%;
        padding: 1rem;
    }

    /* 獎勵區塊改為垂直排 */
    .rewards {
        flex-direction: column;
        gap: 0.75rem;
    }
}

/* 獎勵區塊 */
.rewards {
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;
}

.reward {
    flex: 1;
    text-align: center;
    background: rgba(0, 243, 255, 0.05);
    padding: 1rem;
    border-radius: 0.5rem;
}

.reward-amount {
    font-size: 1.25rem;
    margin-bottom: 0.25rem;
}

.reward-desc {
    font-size: 0.875rem;
    color: #8b8b9b;
}

.video-section {
    padding: 2rem 1rem;
    background-color: #121212;
    /* 深色背景，營造科技感 */
    text-align: center;
}

.video-section-title {
    color: #00b4d8;
    font-size: 2rem;
    margin-bottom: 1rem;
}

.video-section-desc {
    color: #cccccc;
    margin-bottom: 2rem;
    max-width: 600px;
    margin: 0 auto 2rem auto;
}

/* 讓影片在不同裝置時保持 16:9 比例自適應 */
.video-container {
    position: relative;
    width: 100%;
    max-width: 800px;
    /* 根據需要可調整容器最大寬度 */
    margin: 0 auto;
    /* 置中 */
    padding-bottom: 56.25%;
    /* 16:9 的比例計算 (100 / (16/9) = 56.25) */
    height: 0;
    overflow: hidden;
    border: 2px solid #00b4d8;
    border-radius: 8px;
    box-shadow: 0 0 20px rgba(0, 180, 216, 0.3);
}

/* 讓 <iframe> 或 <video> 填滿父容器 */
.video-container iframe,
.video-container video {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}

/* --- 浮動動畫 --- */
.animate-float {
    animation: floatUpDown 3s ease-in-out infinite;
}

@keyframes floatUpDown {

    0%,
    100% {
        transform: translateY(0);
    }

    50% {
        transform: translateY(-10px);
    }
}
</style>