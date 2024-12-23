const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const router = express.Router();
const prizeItemController = require('../controllers/prizeItemController');

router.post('/get-prize-item', prizeItemController.getPrizeItem);
router.post('/draw-prize', prizeItemController.drawPrize);
router.post('/ten-draw-prize', prizeItemController.tenDrawPrize);

module.exports = router;