const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const router = express.Router();
const { getPrizeItem } = require('../controllers/prizeItemController');

router.post('/get-prize-item', getPrizeItem);

module.exports = router;