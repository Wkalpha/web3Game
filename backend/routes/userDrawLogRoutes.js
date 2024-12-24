const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const router = express.Router();
const userDrawLogController = require('../controllers/userDrawLogController');

// 定義 API 路由
router.get('/get-big-prize-log', userDrawLogController.getBigPrizeLog);;

module.exports = router;
