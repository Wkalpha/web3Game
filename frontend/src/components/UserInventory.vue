<template>
  <div class="button-container">
    <button class="tech-button" @click="openInventoryModal">包包</button>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import Swal from 'sweetalert2';
import axios from 'axios';
import { useGameStore } from '@/stores/game';
import { useToast } from 'vue-toastification';

const gameStore = useGameStore();
const toast = useToast();

// 只顯示數量大於 0 的道具
const filteredInventory = computed(() => gameStore.inventory.filter(item => item.Quantity > 0));

// 開啟道具清單的 Swal 視窗
const openInventoryModal = async () => {
  await gameStore.getInventory();
  renderInventoryModal();
};

// 渲染 Swal 彈窗
const renderInventoryModal = () => {
  Swal.fire({
    title: '道具',
    html: generateInventoryHtml(),
    showCloseButton: true,
    showConfirmButton: false,
    theme: 'dark',  // 啟用 Swal 內建深色主題
    didOpen: () => bindUseButtons(),
  });
};

// 產生道具表格 HTML
const generateInventoryHtml = () => {
  return `
    <div class="inventory-modal">
      ${gameStore.inventory.length > 0
      ? `
          <table style="width: 100%; text-align: left; border-collapse: collapse;">
            <thead>
              <tr style="background: #3085d6; color: white;">
                <th>物品名稱</th>
                <th>數量</th>
              </tr>
            </thead>
            <tbody>
              ${filteredInventory.value
        .map(
          item => `
                  <tr id='item-row-${item.ItemId}'>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.ItemName}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">
                        <span id='quantity-${item.ItemId}'>${item.Quantity}</span>
                        ${['Currency', 'Ticket', 'PermanentBuff'].includes(item.ItemType)
              ? `<button class='use-btn' data-id='${item.ItemId}' data-type='${item.ItemType}'>使用</button>`
              : ''
            }
                    </td>
                  </tr>`
        )
        .join('')}
            </tbody>
          </table>
        `
      : '<p class="no-items">尚無道具資料。</p>'
    }
    </div>
  `;
};

// 綁定使用道具的按鈕事件
const bindUseButtons = () => {
  document.querySelectorAll('.use-btn').forEach(button => {
    button.addEventListener('click', async (e) => {
      const itemId = parseInt(e.target.getAttribute('data-id'));
      const itemType = e.target.getAttribute('data-type');
      await useInventory(itemId, itemType);
    });
  });
};

// 使用道具邏輯
const useInventory = async (itemId, itemType) => {
  try {
    const payload = { walletAddress: gameStore.walletAddress, itemId };
    const response = await axios.post(`${process.env.VUE_APP_API_URL}/use-item`, payload);

    if (response.data.success) {
      const itemIndex = gameStore.inventory.findIndex(i => i.ItemId === itemId);
      if (itemIndex !== -1) {
        const item = gameStore.inventory[itemIndex];

        if (item.Quantity > 1) {
          item.Quantity -= 1;
          document.getElementById(`quantity-${itemId}`).innerText = item.Quantity;
        } else {
          gameStore.inventory.splice(itemIndex, 1);
          document.getElementById(`item-row-${itemId}`).remove();
          toast.success(`${item.ItemName} 已使用完畢！`);
        }

        // 顯示抽獎獎勵
        if (itemType === 'Ticket') {
          Swal.fire({
            title: '抽獎中',
            html: '<h2>正在抽獎...</h2>',
            allowOutsideClick: false,
            showConfirmButton: false,
            didOpen: async () => {
              Swal.showLoading();
              const finalPrize = response.data.prize;
              Swal.fire({
                title: '恭喜！',
                html: `<h2>抽中獎品：${finalPrize.ItemName}</h2><p>數量：${finalPrize.ItemValue}</p>`,
                icon: 'success',
                confirmButtonText: '確定',
              });
            },
          });
        } else {
          toast.success(`成功使用 ${item.ItemName}，剩餘數量 ${item.Quantity}！`);
        }
      }
    } else {
      throw new Error('操作失敗');
    }
  } catch (error) {
    console.error('使用道具失敗:', error);
    Swal.fire('錯誤', '使用道具失敗，請稍後重試', 'error');
    toast.error('使用道具失敗，請稍後重試');
  }
};

onMounted(async () => {
  await gameStore.getInventory();
});
</script>

<style>
.button-container {
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 簡約科技風遊戲按鈕 */
.use-btn {
  position: relative;
  font-size: 1rem;
  font-weight: bold;
  text-transform: uppercase;
  color: #3e3a7e;
  background: transparent;
  border: 2px solid #00f7ff;
  border-radius: 8px;
  cursor: pointer;
  outline: none;
  transition: all 0.3s ease-in-out;
  box-shadow: 0 0 10px rgba(0, 247, 255, 0.5);
}

/* 按鈕點擊效果 */
.use-btn:active {
  transform: scale(0.95);
  box-shadow: 0 0 5px rgba(0, 247, 255, 0.8);
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