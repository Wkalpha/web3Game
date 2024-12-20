const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const router = express.Router();
const { verifyMessage } = require('ethers');
const { updateUserBalanceWhenBuyPlaytimes, updateUserBalanceWhenBuyETH, leaderboardBet, findOrAddUser, withdrawContract } = require('../controllers/userController');

// 中間件:登入驗證簽名
const verifyWalletSignature = (req, res, next) => {
    const { walletAddress, message, signature } = req.body;

    try {
        const recoveredAddress = verifyMessage(message, signature);

        if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
            return res.status(403).json({ message: 'Invalid signature: Wallet address does not match' });
        }

        next(); // 驗證通過，繼續處理請求
    } catch (error) {
        console.error('Signature verification failed:', error);
        res.status(403).json({ message: 'Invalid signature' });
    }
};

// 定義 API 路由
router.post('/update-user-balance-when-buy-playtimes', updateUserBalanceWhenBuyPlaytimes);
router.post('/update-user-balance-when-buy-eth', updateUserBalanceWhenBuyETH);
router.post('/leaderboard-add-bet', leaderboardBet);
router.post('/find-or-add', verifyWalletSignature, findOrAddUser);
router.post('/update-prize-pool-after-withdraw', withdrawContract);

module.exports = router;
