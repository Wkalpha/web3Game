<template>
  <div class="button-container">
    <button class="tech-button" @click="openLeaderboard(false)">上週排行榜</button>
    <button class="tech-button" @click="openLeaderboard(true)">本週排行榜</button>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useGameStore } from '@/stores/game';
import Swal from 'sweetalert2';
import axios from 'axios';

const gameStore = useGameStore();
const currentWeek = ref(false);

const isSelf = (walletAddress) => walletAddress === gameStore.walletAddress;

const formatWalletAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 3)}...${address.slice(-3)}`;
};

const openLeaderboard = async (currentOrLast) => {
  currentWeek.value = currentOrLast;
  try {
    await gameStore.getLeaderboardPlayer(currentOrLast);

    Swal.fire({
      title: currentOrLast ? '本週排行榜' : '上週排行榜',
      html: `
      <div class="swal-leaderboard-container">
          ${currentOrLast ? `<h3 id="countdown">(結算時間: ${getCountdown()})</h3>` : ''}
          <div class="loading-message" id="loading">數據加載中，請稍候...</div>
          <ul class="leaderboard-list" id="leaderboard-content" style="display: none;">
            ${gameStore.leaderboardPlayers.map((player, index) => `
              <li>
                <span class="rank">R${index + 1}</span>
                <span class="player-name ${isSelf(player.WalletAddress) ? 'self-player' : ''}">
                  ${formatWalletAddress(player.WalletAddress)}
                  ${isSelf(player.WalletAddress) ? '<span class="self-tag">(自己)</span>' : ''}
                </span>
                ${currentOrLast ? `<button class="bet-button" onclick="window.placeBet('${player.WalletAddress}')">下注${player.BetAmount}</button>` : ''}
                <span class="player-score">${player.Scores}分</span>
              </li>
            `).join('')}
          </ul>
      </div>
      `,
      showCloseButton: true,
      showConfirmButton: false,
      didOpen: () => {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('leaderboard-content').style.display = 'block';
        if (currentOrLast) {
          updateCountdownInterval();
        }
      },
      willClose: () => {
        clearInterval(countdownInterval);
      }
    });
  } catch (error) {
    Swal.fire('錯誤', '加載排行榜失敗，請稍後重試', 'error');
  }
};

let countdownInterval;
const updateCountdownInterval = () => {
  countdownInterval = setInterval(() => {
    const countdownElement = document.getElementById('countdown');
    if (countdownElement) {
      countdownElement.innerText = `(結算時間: ${getCountdown()})`;
    } else {
      clearInterval(countdownInterval);
    }
  }, 1000);
};


const getCountdown = () => {
  const now = new Date();
  const nextReset = new Date();
  nextReset.setUTCDate(now.getUTCDate() + ((1 - now.getUTCDay() + 7) % 7 || 7));
  nextReset.setUTCHours(0, 0, 0, 0);
  const diff = Math.max(nextReset - now, 0);
  return `${Math.floor(diff / (1000 * 60 * 60))}:${String(Math.floor((diff / (1000 * 60)) % 60)).padStart(2, '0')}:${String(Math.floor((diff / 1000) % 60)).padStart(2, '0')}`;
};

window.placeBet = async (walletAddress) => {
  const { value: betAmount } = await Swal.fire({
    title: '請輸入下注金額',
    input: 'number',
    html: `
      <ul style="text-align: left; font-size: 18px;">
        <li>✅ 最少 <strong>500</strong> Time Coin</li>
        <li>✅ 必須是 <strong>正整數</strong></li>
        <li>✅ 不得超過您擁有的 <strong>${gameStore.userInfo.timeCoin}</strong> Time Coin</li>
      </ul>
    `,
    inputPlaceholder: '輸入 Time Coin',
    inputAttributes: { min: 500, step: 1 },
    showCancelButton: true
  });

  if (!betAmount) return;
  const parsedAmount = parseInt(betAmount, 10);
  if (isNaN(parsedAmount) || parsedAmount < 500 || parsedAmount > gameStore.userInfo.timeCoin) {
    Swal.fire('無效的下注金額', '請確認金額必須是正整數，最少 500 並且不能超過您所持有的 Time Coin。', 'error');
    return;
  }

  try {
    await axios.post(`${process.env.VUE_APP_API_URL}/leaderboard-add-bet`, {
      fromWalletAddress: gameStore.walletAddress,
      toWalletAddress: walletAddress,
      betAmount: parsedAmount
    });

    Swal.fire('下注成功', `已成功下注 ${parsedAmount} Time Coin`, 'success');
  } catch (error) {
    Swal.fire('下注失敗', '請稍後再試，或聯繫客服。', 'error');
  }
};
</script>

<style scoped>
.button-container {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  margin: 2rem 0;
  flex-wrap: wrap;
}

.tech-button {
  position: relative;
  padding: 1rem 2.2rem;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, 
    rgba(0, 100, 255, 0.9) 0%,
    rgba(40, 20, 120, 0.9) 100%);
  color: #e6f7ff;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
  overflow: hidden;
  display: inline-flex;
  white-space: nowrap;
  font-size: clamp(0.9rem, 1.5vw, 1.25rem);
  font-weight: 600;
  letter-spacing: 0.03em;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.tech-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0, 228, 255, 0.5),
              inset 0 4px 8px rgba(255, 255, 255, 0.3);
  background-size: 150% 150%;
}

.tech-button:active {
  transform: translateY(1px);
  filter: brightness(0.9);
}

.tech-button::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    45deg,
    transparent 25%,
    rgba(255, 255, 255, 0.1) 50%,
    transparent 75%
  );
  animation: flow 6s infinite linear;
  pointer-events: none;
}

@keyframes flow {
  0% { transform: translateX(-50%) rotate(45deg); }
  100% { transform: translateX(50%) rotate(45deg); }
}

@media (max-width: 768px) {
  .button-container {
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 0 1rem;
  }

  .tech-button {
    max-width: 320px;
    min-width: auto;
    padding: 1rem 1.5rem;
    font-size: 1rem;
    border-radius: 10px;
  }

  .tech-button::after {
    animation-duration: 8s;
  }
}

@media (max-width: 480px) {
  .tech-button {
    font-size: 0.9rem;
    padding: 0.8rem 1.2rem;
  }
}

.tech-button.loading {
  pointer-events: none;
  opacity: 0.8;
}

.tech-button.loading::after {
  animation: none;
  background: repeating-linear-gradient(
    45deg,
    transparent,
    rgba(255,255,255,0.1) 1rem,
    transparent 2rem
  );
}
</style>
