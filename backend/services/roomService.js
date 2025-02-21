const { v4: uuidv4 } = require('uuid');
const redisClient = require('../services/redis');
const webSocketService = require('../services/webSocketService');
const crypto = require('crypto');

/**
 * 創建房間
 * @param {Object} param0
 * @returns {String} roomId
 */
async function createRoom({ walletAddress, betAmount, players, minBet, password }) {
    const roomId = uuidv4();
    const token = password ? crypto.createHmac('sha256', walletAddress).update(password).digest('hex') : null;
    const roomData = {
        id: roomId,
        maxPlayers: players, // 房間最大玩家限制
        minBet,
        totalBet: betAmount,
        password,
        hasPassword: !!password,
        isOpen: true,
        players: [{
            walletAddress: walletAddress,
            betAmount: betAmount
        }],
        token: token,
        creator: walletAddress,
        createTime: Date.now()
    };

    // 存到 Redis
    await redisClient.set(`room:${roomId}`, JSON.stringify(roomData));

    // 用 ZSET 排序 (以 createTime 為 score，或使用 minBet 做排序)
    await redisClient.zAdd('roomList', [
        { score: roomData.createTime, value: roomId }
    ]);

    return roomId;
}

/**
* 分頁取得房間列表
*/
async function getRoomList(page = 1, limit = 10, sortBy, filterMinBet) {
    // 1. 從 ZSET 裡抓取全部房間ID
    const start = 0;
    const end = -1;
    // 這裡直接一次抓完(示範用)
    const roomIds = await redisClient.zRange('roomList', start, end);

    const allRooms = [];
    for (const roomId of roomIds) {
        const raw = await redisClient.get(`room:${roomId}`);
        if (raw) {
            const roomRaw = JSON.parse(raw);
            // 根據最小資訊暴露原則，只回傳必要的欄位，
            // 不直接回傳 room.password，而是利用 hasPassword 表示房間是否受密碼保護
            const roomInfo = {
                id: roomRaw.id,
                minBet: roomRaw.minBet,
                totalBet: roomRaw.totalBet,
                maxPlayers: roomRaw.maxPlayers,
                playerCount: roomRaw.players.length,
                createTime: roomRaw.createTime,
                hasPassword: !!roomRaw.password  // true 表示有密碼保護，false 表示沒有
            };
            allRooms.push(roomInfo);
        }
    }

    // 2. 如果有提供 filterMinBet，就篩選 minBet >= filterMinBet (或 <= 依你需求)
    let filteredRooms = allRooms;
    if (filterMinBet !== undefined && filterMinBet !== null) {
        // 轉數字
        const filterValue = Number(filterMinBet);
        // 篩選 (範例: 只保留 minBet >= filterValue)
        filteredRooms = filteredRooms.filter(room => room.minBet >= filterValue);
    }

    // 3. 如果有指定 sortBy，就排序 (ascending)
    if (sortBy === 'players') {
        // 依 players 排序 (小 -> 大)
        filteredRooms.sort((a, b) => a.players - b.players);
    } else if (sortBy === 'minBet') {
        // 依 minBet 排序 (小 -> 大)
        filteredRooms.sort((a, b) => a.minBet - b.minBet);
    } else {
        // 預設可以不動 or 用 createTime 排序
        filteredRooms.sort((a, b) => a.createTime - b.createTime);
    }

    // 4. 做分頁
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const pagedRooms = filteredRooms.slice(startIndex, endIndex);

    return pagedRooms;
}

/**
 * 取得單一房間資訊
 */
async function getRoomDetail(roomId, walletAddress, token) {
    const raw = await redisClient.get(`room:${roomId}`);

    if (!raw) throw new Error('房間不存在');

    const roomData = JSON.parse(raw);

    // 檢查是否有權限查看房間詳情
    if (roomData.creator !== walletAddress && roomData.token !== token) {
        throw new Error('無權限');
    }

    // 組合房間資訊
    return {
        id: roomData.id,
        minBet: roomData.minBet,
        totalBet: roomData.totalBet,
        maxPlayers: roomData.maxPlayers,
        players: roomData.players,
        playerCount: roomData.players.length,
        creator: roomData.creator,
        createTime: roomData.createTime
    };
}

/**
 * 加入房間
 */
async function joinRoom(roomId, walletAddress, betAmount, inputPassword) {
    let raw = await redisClient.get(`room:${roomId}`);
    if (!raw) throw new Error('房間不存在');

    let roomData = JSON.parse(raw);

    // 判斷密碼
    if (roomData.hasPassword && roomData.password !== inputPassword) {
        throw new Error('密碼錯誤');
    }

    // 判斷人數
    if (roomData.players.length == roomData.maxPlayers) {
        throw new Error('房間人數已滿');
    }

    const pushPlayerData = {
        walletAddress: walletAddress,
        betAmount: betAmount,
        ready: false
    }

    // 檢查是否已存在相同的 walletAddress
    if (!roomData.players.some(player => player.walletAddress === walletAddress)) {
        roomData.players.push(pushPlayerData);
    }

    roomData.totalBet += betAmount;

    await redisClient.set(`room:${roomId}`, JSON.stringify(roomData));

    raw = await redisClient.get(`room:${roomId}`);
    roomData = JSON.parse(raw);

    const roomInfo = {
        token: roomData.token
    };

    return roomInfo;
}

/**
 * 離開房間
 */
async function leaveRoom(roomId, walletAddress) {
    // 查詢房間資料
    const roomData = await redisClient.get(`room:${roomId}`);

    if (!roomData) {
        throw new Error('無此房間');
    }

    const room = JSON.parse(roomData);

    // 如果 walletAddress 是房主，移除整個房間
    if (room.creator === walletAddress) {
        const websocketMsg = {
            event: 'PvPRoomDestroy',
            data: {
            }
        };

        // 遍歷所有玩家並發送 WebSocket 訊息
        room.players.forEach(player => {
            webSocketService.sendToPlayerMessage(player.walletAddress, websocketMsg);
        });

        webSocketService.sendWebSocketMessage(websocketMsg);

        // 銷毀房間
        await redisClient.del(`room:${roomId}`);
        // 從 roomList 中移除對應的 roomId
        await redisClient.sendCommand(['ZREM', 'roomList', roomId]);

        return;
    }

    const playerIndex = room.players.findIndex(player => player.walletAddress === walletAddress);

    if (playerIndex === -1) {
        console.error("Player not found in room.");
        return;
    }

    // 扣除 betAmount
    const playerBetAmount = room.players[playerIndex].betAmount || 0;
    room.totalBet -= playerBetAmount;

    // 從 players 中移除該玩家
    room.players = room.players.filter(player => player.walletAddress !== walletAddress);

    // 更新房間資訊到 Redis
    await redisClient.set(`room:${roomId}`, JSON.stringify(room));
}

/**
 * 切換準備狀態
 */
async function readyOrNot(roomId, walletAddress) {
    // 查詢房間資料
    const roomData = await redisClient.get(`room:${roomId}`);

    if (!roomData) {
        throw new Error('無此房間');
    }

    const room = JSON.parse(roomData);

    const playerIndex = room.players.findIndex(player => player.walletAddress === walletAddress);

    if (playerIndex === -1) {
        console.error(`找不到玩家 ${walletAddress} 在房間 ${roomId} 中`);
        return;
    }

    // 3. 更新玩家的 ready 狀態
    room.players[playerIndex].ready = !room.players[playerIndex].ready;

    // 更新房間資訊到 Redis
    await redisClient.set(`room:${roomId}`, JSON.stringify(room));

    // 遍歷所有玩家並發送 WebSocket 訊息
    const websocketMsg = {
        event: 'RoomStatusUpdate',
        data: {
            walletAddress: walletAddress,
            ready: room.players[playerIndex].ready
        }
    };

    room.players.forEach(player => {
        webSocketService.sendToPlayerMessage(player.walletAddress, websocketMsg);
    });
}

module.exports = {
    createRoom,
    getRoomList,
    getRoomDetail,
    joinRoom,
    leaveRoom,
    readyOrNot
};