const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const router = express.Router();
const { getPrizeItemPool } = require('../controllers/prizeItemPoolController');

router.get('/get-prize-item-pool', getPrizeItemPool);

module.exports = router;