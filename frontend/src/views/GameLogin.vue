<template>
    <div class="cyber-login-container">
      <h1 class="cyber-title glitch" data-text="TickTock Battle">TickTock Battle</h1>
      
      <div class="cyber-content" v-if="!gameStore.login">
        <button class="neon-button" @click="gameStore.connectWallet()">
          <span class="neon-border"></span>
          CONNECT WALLET
        </button>
  
        <div class="cyber-social">
          <p class="neon-subtitle">JOIN US</p>
          <a href="https://discord.gg/gxBTtEWb" target="_blank" class="cyber-link">
            <span class="link-icon">
              <svg class="hologram-icon" viewBox="0 0 24 24">
                <path fill="currentColor" d="M19.27,5.33C17.94,4.71 16.5,4.26 15,4a.09.09,0,0,0-.07.03c-.18.33-.39.76-.53,1.09A16.09,16.09,0,0,0,12,5.7c-1.3,0-2.6-.18-3.8-.5A11.98,11.98,0,0,1,5.1,3.03.09.09,0,0,0,5,3C3.5,3.26,2.06,3.71,0.73,4.33a.14.14,0,0,0-.05.04c-.5.54-.62,1.24-.32,2C1.21,7.44,3.08,15,12,15c8.92,0,10.79-7.56,11.64-10.63.3-.76.18-1.46-.32-2a.14.14,0,0,0-.05-.04ZM8.5,12.5A1.5,1.5,0,1,1,10,11,1.5,1.5,0,0,1,8.5,12.5Zm7,0A1.5,1.5,0,1,1,17,11,1.5,1.5,0,0,1,15.5,12.5Z"/>
              </svg>
            </span>
            <span class="link-text">DISCORD CHANNEL</span>
          </a>
        </div>
      </div>
    </div>
  </template>
<script setup>
import { useGameStore } from '@/stores/game';
import { watch } from 'vue';
import { useRouter } from 'vue-router';

const gameStore = useGameStore();
const router = useRouter();

// 監聽 login 狀態，若變為 true，跳轉到 index 頁面
watch(() => gameStore.login, (newValue) => {
    if (newValue) {
        router.push('/index');
    }
});
</script>

<style scoped>
.cyber-login-container {
  background: linear-gradient(135deg, #0a0a2e 0%, #1a1a4a 100%);
  border-radius: 12px;
  padding: 3rem 2rem;
  max-width: 600px;
  margin: 2rem auto;
  position: relative;
  overflow: hidden;
  box-shadow: 0 0 40px rgba(0, 247, 255, 0.2);
}

.cyber-title {
  font-family: 'Orbitron', sans-serif;
  color: #00f7ff;
  text-align: center;
  font-size: 3rem;
  text-shadow: 0 0 20px rgba(0, 247, 255, 0.8);
  letter-spacing: 4px;
  margin-bottom: 3rem;
  position: relative;
}

.neon-button {
  position: relative;
  background: linear-gradient(45deg, #00f7ff 0%, #00ff9d 100%);
  border: none;
  padding: 1.5rem 3rem;
  color: #000;
  font-family: 'Aldrich', sans-serif;
  font-size: 1.2rem;
  text-transform: uppercase;
  letter-spacing: 2px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin: 2rem 0;
  border-radius: 4px;
  overflow: hidden;
}

.neon-button:hover {
  box-shadow: 0 0 30px rgba(0, 255, 157, 0.6);
  transform: translateY(-2px);
}

.neon-border {
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(45deg, 
    #00f7ff 0%, 
    transparent 50%,
    #00ff9d 100%);
  z-index: -1;
  animation: borderFlow 3s linear infinite;
}

.cyber-social {
  margin-top: 3rem;
  text-align: center;
}

.cyber-content {
  display: flex;
  flex-direction: column;
  align-items: center; /* 新增這行 */
  justify-content: center; /* 可選，垂直居中 */
  gap: 1rem; /* 控制子元素間距 */
}

.neon-subtitle {
  color: #ff007a;
  font-family: 'Courier New', monospace;
  text-transform: uppercase;
  letter-spacing: 3px;
  margin-bottom: 1.5rem;
}

.cyber-link {
  display: inline-flex;
  align-items: center;
  padding: 1rem;
  text-decoration: none;
  color: #00ff9d;
  position: relative;
  transition: all 0.3s ease;
}

.hologram-icon {
  width: 40px;
  height: 40px;
  margin-right: 1rem;
  filter: drop-shadow(0 0 5px #00f7ff);
  transition: transform 0.3s ease;
}

.link-text {
  font-family: 'Orbitron', sans-serif;
  letter-spacing: 2px;
}

.cyber-link:hover {
  color: #ff007a;
}

.cyber-link:hover .hologram-icon {
  transform: rotate(15deg) scale(1.2);
  filter: drop-shadow(0 0 8px #ff007a);
}

/* 动画效果 */
@keyframes borderFlow {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@keyframes glitch {
  0% { text-shadow: -2px 0 #ff00c1, 2px 0 #00fff9; }
  25% { transform: translateX(2px); }
  50% { transform: translateX(-2px); }
  75% { text-shadow: 2px 0 #ff00c1, -2px 0 #00fff9; }
  100% { text-shadow: -2px 0 #ff00c1, 2px 0 #00fff9; }
}

.glitch {
  animation: glitch 2s infinite;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .cyber-login-container {
    margin: 1rem;
    padding: 2rem 1rem;
  }
  
  .cyber-title {
    font-size: 2rem;
  }
  
  .neon-button {
    padding: 1rem 2rem;
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .cyber-title {
    font-size: 1.5rem;
    letter-spacing: 2px;
  }
  
  .neon-button {
    padding: 0.8rem 1.5rem;
    font-size: 0.9rem;
  }
  
  .hologram-icon {
    width: 30px;
    height: 30px;
  }
  
  .link-text {
    font-size: 0.9rem;
  }
}
</style>