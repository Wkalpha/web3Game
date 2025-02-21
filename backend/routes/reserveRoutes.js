const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const router = express.Router();
const reserveController = require('../controllers/reserveController');

// 預約
router.post('/reserve', reserveController.reserve);

// 查詢預約人數
router.get('/reserveCount', reserveController.reserveCount);

module.exports = router;
