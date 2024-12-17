const express = require('express');
const router = express.Router();
const { queryLeaderboard } = require('../controllers/leaderboardContoller');

// 定義 API 路由
router.post('/getLeaderboard', queryLeaderboard);

module.exports = router;
