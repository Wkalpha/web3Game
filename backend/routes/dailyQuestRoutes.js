const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const router = express.Router();
const dailyQuestController = require('../controllers/dailyQuestController');

// 取得玩家每日任務
router.post('/daily-quests', dailyQuestController.getUserDailyQuests);

// 領取獎勵
router.post('/daily-quests/claim', dailyQuestController.claimQuestReward);

module.exports = router;