const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const router = express.Router();
const { gameStart, getTargetTime, startTimer, endTimer, gameOver } = require('../controllers/gameController');

router.post('/update-balance-when-game-start', gameStart);
router.post('/update-balance-when-game-over', gameOver);
router.post('/getTargetTime', getTargetTime);
router.post('/start-timer', startTimer);
router.post('/end-timer', endTimer);

module.exports = router;