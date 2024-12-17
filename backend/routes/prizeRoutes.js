const express = require('express');
const router = express.Router();
const { queryMainPrizePool } = require('../controllers/prizePoolController');

// 定義 API 路由
router.get('/getMainPrizePool', queryMainPrizePool);

module.exports = router;
