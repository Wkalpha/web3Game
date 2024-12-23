const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const router = express.Router();
const prizeItemPoolController = require('../controllers/prizeItemPoolController');

router.get('/get-prize-item-pool', prizeItemPoolController.getPrizeItemPool);

module.exports = router;