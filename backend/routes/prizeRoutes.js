const express = require('express');
const router = express.Router();
const prizePoolController = require('../controllers/prizePoolController');

// 定義 API 路由
router.get('/getMainPrizePool', prizePoolController.queryMainPrizePool);
router.get('/getLeaderboardPrizePool', prizePoolController.queryLeaderboardPrizePool);

module.exports = router;
