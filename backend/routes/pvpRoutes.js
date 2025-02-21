const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');

// 創建房間
router.post('/create-room', roomController.createRoom);

// 分頁取得房間列表
router.get('/rooms', roomController.getRoomList);

// 進入房間
router.post('/join-room/:id', roomController.joinRoom);

// 取得單一房間詳細
router.post('/rooms/:id', roomController.getRoomDetail);

// 離開房間
router.post('/leave-room', roomController.leaveRoom);

// 切換準備狀態
router.post('/toggle-ready', roomController.readyOrNot);

// 開始遊戲
router.post('/game-start', roomController.startGame);

// 剔除玩家
router.post('/kick-player', roomController.kickPlayer);

module.exports = router;
