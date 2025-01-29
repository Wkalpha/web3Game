const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const router = express.Router();
const userInventoryController = require('../controllers/userInventoryController');

// 定義 API 路由
router.post('/get-inventory', userInventoryController.getUserInventory);
router.post('/use-item', userInventoryController.useItem);
router.post('/get-battle-item', userInventoryController.getBattleItem);

module.exports = router;
