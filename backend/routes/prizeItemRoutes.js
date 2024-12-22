const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const router = express.Router();
const { getPrizeItem, drawPrize } = require('../controllers/prizeItemController');

router.post('/get-prize-item', getPrizeItem);
router.post('/draw-prize', drawPrize);

module.exports = router;