const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const router = express.Router();
const { gameStart, getTargetTime, startTimer, endTimer, gameOver } = require('../controllers/gameController');
 

// 中間件:遊戲結束驗證簽名
const gameOverVerify = async (req, res, next) => {
    const { walletAddress, message, signature } = req.body;
    const parsedMessage = JSON.parse(message);
    const { timestamp, nonce } = parsedMessage;

    try {
        const recoveredAddress = verifyMessage(message, signature);

        if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
            return res.status(403).json({ message: 'Invalid signature: Wallet address does not match' });
        }

        const currentTime = Date.now();
        if (Math.abs(currentTime - timestamp) > 10 * 1000) { // 允許 10 秒的誤差
            return res.status(401).json({ success: false, message: '請求已過期' });
        }

        // 唯一的請求 ID
        const requestCache = new Map();
        const requestId = `${walletAddress}-${timestamp}-${nonce}`;
        if (requestCache.has(requestId)) {
            return res.status(401).json({ success: false, message: '重複的請求' });
        }
        requestCache.set(requestId, Date.now());
        setTimeout(() => requestCache.delete(requestId), 15 * 1000);

        next(); // 驗證通過，繼續處理請求
    } catch (error) {
        console.error('Signature verification failed:', error);
        res.status(403).json({ message: 'Invalid signature' });
    }
};

router.post('/update-balance-when-game-start', gameStart);
router.post('/update-balance-when-game-over', gameOverVerify, gameOver);
router.post('/getTargetTime', getTargetTime);
router.post('/start-timer', startTimer);
router.post('/end-timer', endTimer);

module.exports = router;