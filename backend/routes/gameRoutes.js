const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');

router.post('/update-balance-when-game-start', gameController.gameStart);
router.post('/update-balance-when-game-over', gameController.gameOver);
router.post('/getTargetTime', gameController.getTargetTime);
router.post('/start-timer', gameController.startTimer);
router.post('/end-timer', gameController.endTimer);

module.exports = router;