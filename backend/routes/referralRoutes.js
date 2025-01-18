const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const router = express.Router();
const referralontroller = require('../controllers/referralController');

// 領取獎勵
router.post('/referral', referralontroller.referral);

module.exports = router;