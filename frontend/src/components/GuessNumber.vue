<template>
    <div class="guess-number">
        <h2>猜數字遊戲</h2>
        <p v-if="!gameOver">請猜一個數字 (1 到 100)</p>
        <p v-if="gameOver">{{ gameMessage }}</p>
        <input v-if="!gameOver" type="number" v-model="guess" @keyup.enter="checkGuess" placeholder="輸入數字" />
        <button v-if="!gameOver" @click="checkGuess">確認</button>
        <button v-if="gameOver" @click="restartGame">重新開始</button>
        <p v-if="!gameOver && feedback">{{ feedback }}</p>
    </div>
</template>

<script>
export default {
    name: 'GuessNumber',
    data() {
        return {
            randomNumber: this.generateRandomNumber(),
            guess: null,
            feedback: '',
            gameOver: false,
            gameMessage: ''
        };
    },
    methods: {
        generateRandomNumber() {
            return Math.floor(Math.random() * 100) + 1;
        },
        checkGuess() {
            if (!this.guess || this.guess < 1 || this.guess > 100) {
                this.feedback = '請輸入 1 到 100 的數字！';
                return;
            }
            const userGuess = parseInt(this.guess, 10);
            if (userGuess > this.randomNumber) {
                this.feedback = '太大了！';
            } else if (userGuess < this.randomNumber) {
                this.feedback = '太小了！';
            } else {
                this.gameOver = true;
                this.gameMessage = `恭喜！您猜中了，答案是 ${this.randomNumber}`;
            }
            this.guess = null; // 清空輸入
        },
        restartGame() {
            this.randomNumber = this.generateRandomNumber();
            this.guess = null;
            this.feedback = '';
            this.gameOver = false;
            this.gameMessage = '';
        }
    }
};
</script>

<style>
.guess-number {
    margin: 20px auto;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 10px;
    width: 300px;
    text-align: center;
}

input {
    width: 80%;
    padding: 5px;
    margin: 10px 0;
}

button {
    margin: 5px;
}
</style>