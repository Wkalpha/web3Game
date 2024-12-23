const express = require('express');
const router = express.Router();
const leaderboardContoller = require('../controllers/leaderboardContoller');

// 定義 API 路由
router.post('/getLeaderboard', leaderboardContoller.queryLeaderboard);

module.exports = router;
