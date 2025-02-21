// controllers/roomController.js
const webSocketService = require('../services/webSocketService');
const redisClient = require('../services/redis');

const {
    createRoom,
    getRoomList,
    getRoomDetail,
    joinRoom,
    leaveRoom,
    readyOrNot
} = require('../services/roomService');

/**
 * 創建房間的
 */
exports.createRoom = async (req, res) => {
    try {
        const { walletAddress, betAmount, players, minBet, password } = req.body;

        // 這裡可以做一下基礎參數檢查
        if (!betAmount || !players || !minBet) {
            return res.status(400).json({
                success: false,
                message: '缺少必要參數'
            });
        }

        const roomId = await createRoom({ walletAddress, betAmount, players, minBet, password });

        const websocketMsg = {
            event: 'RoomCreated',
            data: {
            }
        };

        webSocketService.sendWebSocketMessage(websocketMsg);

        return res.json({
            success: true,
            roomId
        });
    } catch (error) {
        console.error('createRoomController error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || '創建房間失敗'
        });
    }
};

/**
 * 分頁取得房間列表
 */
exports.getRoomList = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const sortBy = req.query.sortBy;             // 'players' or 'minBet' or undefined
        const filterMinBet = req.query.filterMinBet; // ex: 50

        const rooms = await getRoomList(page, limit, sortBy, filterMinBet);

        return res.json({
            success: true,
            rooms
        });
    } catch (error) {
        console.error('getRoomListController error', error);
        return res.status(500).json({
            success: false,
            message: error.message || '取得房間列表失敗'
        });
    }
};

/**
 * 取得單一房間資訊
 */
exports.getRoomDetail = async (req, res) => {
    try {
        const roomId = req.params.id;
        const { walletAddress, token } = req.body;
        const room = await getRoomDetail(roomId, walletAddress, token);

        return res.json({
            success: true,
            room
        });
    } catch (error) {
        console.error('getRoomDetailController error:', error);
        // 404 表示找不到
        return res.status(404).json({
            success: false,
            message: error.message || '房間不存在'
        });
    }
};

/**
 * 加入房間
 */
exports.joinRoom = async (req, res) => {
    try {
        const roomId = req.params.id;
        const { password, walletAddress, betAmount } = req.body;

        const roomToken = await joinRoom(roomId, walletAddress, betAmount, password);

        const roomInfo = await getRoomDetail(roomId, walletAddress, roomToken.token);

        const websocketMsg = {
            event: 'PlayerJoinRoom',
            data: {
                id: roomInfo.id,
                totalBet: roomInfo.totalBet,
                playerCount: roomInfo.playerCount
            }
        };

        // 遍歷所有玩家並發送 WebSocket 訊息
        roomInfo.players.forEach(player => {
            webSocketService.sendToPlayerMessage(player.walletAddress, websocketMsg);
        });

        webSocketService.sendWebSocketMessage(websocketMsg);

        return res.json({
            success: true,
            token: roomToken.token
        });
    } catch (error) {
        console.error('joinRoomController error:', error);
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * 離開房間
 */
exports.leaveRoom = async (req, res) => {
    try {
        const { walletAddress, roomId } = req.body;

        await leaveRoom(roomId, walletAddress);

        const raw = await redisClient.get(`room:${roomId}`);

        const roomInfo = JSON.parse(raw);

        if (!roomInfo) {
            return res.status(200).json();
        }

        const websocketMsg = {
            event: 'PlayerLeaveRoom',
            data: {
                id: roomInfo.id,
                totalBet: roomInfo.totalBet,
                playerCount: roomInfo.players.length
            }
        };

        // 遍歷所有玩家並發送 WebSocket 訊息
        roomInfo.players.forEach(player => {
            webSocketService.sendToPlayerMessage(player.walletAddress, websocketMsg);
        });

        webSocketService.sendWebSocketMessage(websocketMsg);

        return res.status(200).json();
    } catch (error) {
        console.error('joinRoomController error:', error);
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * 準備/取消準備
 */
exports.readyOrNot = async (req, res) => {
    try {
        const { walletAddress, roomId } = req.body;

        await readyOrNot(roomId, walletAddress);

        return res.status(200).json();

    } catch (error) {
        console.error('joinRoomController error:', error);
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * 開始遊戲
 */
exports.startGame = async (req, res) => {
    try {
        const { roomId } = req.body;

        let raw = await redisClient.get(`room:${roomId}`);

        let roomInfo = JSON.parse(raw);

        if (!roomInfo) {
            return res.status(200).json();
        }

        // 生成 10 筆 Target Time 放進 roomInfo 的 targetTime
        const targetTimes = [];
        for (let i = 0; i < 10; i++) {
            const targetTime = (Math.random() * 9 + 1).toFixed(2); // 1 到 10 秒的目標時間
            targetTimes.push(targetTime);
        }
        roomInfo.targetTime = targetTimes;

        let websocketMsg = {
            event: 'PvPGameStart',
            data: {
                roomInfo
            }
        };

        // 遍歷此房間內的玩家並發送 WebSocket 訊息
        roomInfo.players.forEach(player => {
            webSocketService.sendToPlayerMessage(player.walletAddress, websocketMsg);
        });

        // 將房間詳細資訊存到 Redis，後續遊玩需要用到
        await redisClient.set(`roomDetail:${roomId}`, JSON.stringify(roomInfo));

        // 銷毀房間
        await redisClient.del(`room:${roomId}`);

        // 從 roomList 中移除對應的 roomId
        await redisClient.sendCommand(['ZREM', 'roomList', roomId]);

        raw = await redisClient.get(`room:${roomId}`);

        roomInfo = JSON.parse(raw);

        websocketMsg = {
            event: 'PvPRoomDestroy',
            data: {
                roomInfo
            }
        };

        webSocketService.sendWebSocketMessage(websocketMsg);

        return res.status(200).json();

    } catch (error) {
        console.error('joinRoomController error:', error);
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * 剔除玩家
 */
exports.kickPlayer = async (req, res) => {
    try {
        const { roomId, walletAddress } = req.body;

        await leaveRoom(roomId, walletAddress);

        const raw = await redisClient.get(`room:${roomId}`);

        const roomInfo = JSON.parse(raw);

        let websocketMsg = {
            event: 'PlayerLeaveRoom',
            data: {
                id: roomInfo.id,
                totalBet: roomInfo.totalBet,
                playerCount: roomInfo.players.length
            }
        };

        // 遍歷所有玩家並發送 WebSocket 訊息
        roomInfo.players.forEach(player => {
            webSocketService.sendToPlayerMessage(player.walletAddress, websocketMsg);
        });

        webSocketService.sendWebSocketMessage(websocketMsg);

        websocketMsg = {
            event: 'kickPlayer',
            data: {
            }
        };

        webSocketService.sendToPlayerMessage(walletAddress, websocketMsg);

        return res.status(200).json();

    } catch (error) {
        console.error('joinRoomController error:', error);
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};