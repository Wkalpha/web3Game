const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const router = express.Router();
const clickTraceLogController = require('../controllers/clickTraceLogController');

router.post('/click', clickTraceLogController.click);

module.exports = router;