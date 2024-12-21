const express = require('express');
const router = express.Router();
const { queryMainPrizePool, queryLeaderboardPrizePool } = require('../controllers/prizePoolController');

// 定義 API 路由
router.get('/getMainPrizePool', queryMainPrizePool);
router.get('/getLeaderboardPrizePool', queryLeaderboardPrizePool);

module.exports = router;
