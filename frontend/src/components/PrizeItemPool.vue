<template>
    <div class="prize-item-pool">
        <h1>抽獎機制</h1>
        <div class="prize-list">
            <div v-for="(prize, index) in prizes" :key="index" class="prize-item">
                {{ prize.name }}
            </div>
        </div>
        <button @click="drawPrize" class="draw-button">抽獎</button>
        <div v-if="drawnPrize" class="drawn-prize">
            <h2>恭喜您獲得獎品：{{ drawnPrize.name }}</h2>
        </div>
    </div>
</template>

<script>
export default {
    name: 'PrizeItemPool',
    data() {
        return {
            prizes: [
                { name: '充值卡 $10', weight: 1 },
                { name: '充值卡 $50', weight: 1 },
                { name: '充值卡 $100', weight: 1 },
                { name: '零食包', weight: 95 },
                { name: '消費券 $5', weight: 1 },
                { name: '消費券 $20', weight: 1 }
            ],
            drawnPrize: null
        };
    },
    methods: {
        drawPrize() {
            if (this.prizes.length === 0) {
                alert('獎品已被抽完了！');
                return;
            }

            const totalWeight = this.prizes.reduce((total, prize) => total + prize.weight, 0);
            let randomWeight = Math.random() * totalWeight;

            let selectedPrize = null;
            for (let i = 0; i < this.prizes.length; i++) {
                if (randomWeight < this.prizes[i].weight) {
                    selectedPrize = this.prizes[i];
                    this.drawnPrize = selectedPrize;
                    // this.prizes.splice(i, 1);
                    break;
                } else {
                    randomWeight -= this.prizes[i].weight;
                }
            }
        }
    }
};
</script>

<style scoped>
.prize-item-pool {
    text-align: center;
}

.prize-list {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    margin-bottom: 20px;
}

.prize-item {
    background-color: #f4f4f9;
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 10px 20px;
    margin: 10px;
    font-size: 16px;
}

.draw-button {
    background-color: #4caf50;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 10px 20px;
    font-size: 18px;
    cursor: pointer;
    transition: background-color 0.3s;
}

.draw-button:hover {
    background-color: #45a049;
}

.drawn-prize {
    margin-top: 20px;
    font-size: 20px;
    font-weight: bold;
}
</style>