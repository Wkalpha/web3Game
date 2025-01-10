const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const router = express.Router();
const badgeController = require('../controllers/badgeController');

router.get('/get-badges', badgeController.getBadges);

module.exports = router;