const express = require('express');
const router = express.Router();
const { updateUserBalanceWhenBuyPlaytimes, updateUserBalanceWhenBuyETH, leaderboardBet, findOrAddUser, gameStart, gameOver } = require('../controllers/userController');

// 定義 API 路由
router.post('/update-user-balance-when-buy-playtimes', updateUserBalanceWhenBuyPlaytimes);
router.post('/update-user-balance-when-buy-eth', updateUserBalanceWhenBuyETH);
router.post('/leaderboard-add-bet', leaderboardBet);
router.post('/find-or-add', findOrAddUser);
router.post('/update-balance-when-game-start', gameStart);
router.post('/update-balance-when-game-over', gameOver);

module.exports = router;
