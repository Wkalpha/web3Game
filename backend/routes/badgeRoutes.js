const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const router = express.Router();
const badgeController = require('../controllers/badgeController');

router.get('/get-badges', badgeController.getBadges);
router.post('/draw-badge', badgeController.drawPrize);
router.post('/get-user-badge', badgeController.getUserBadges);

module.exports = router;