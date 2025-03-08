const WebSocket = require('ws');
const gameInfoModel = require('../models/gameInfoModel');
const userModel = require('../models/userModel');
const pvpGameLogModel = require('../models/pvpGameLogModel');
const redisClient = require('../services/redis');
const url = require('url'); // 解析 URL 查詢參數

class WebSocketService {
    constructor(port = 3001) {
        this.clients = new Map(); // 儲存 walletAddress -> WebSocket 的映射
        this.port = port;
        this.wss = null;
    }

    /**
     * 啟動 WebSocket 服務器
     */
    start() {
        this.wss = new WebSocket.Server({ port: this.port });

        this.wss.on('connection', (ws, request) => {
            // 1 獲取客戶端的錢包地址 (walletAddress)
            const queryParams = url.parse(request.url, true).query;
            const walletAddress = queryParams.walletAddress?.toLowerCase();

            if (!walletAddress) {
                console.log('無法識別客戶端，關閉 WebSocket 連線');
                ws.close();
                return;
            }

            // 如果該錢包地址已經連接，則關閉舊的 WebSocket 連接
            if (this.clients.has(walletAddress)) {
                const existingClient = this.clients.get(walletAddress);
                existingClient.terminate(); // 立即關閉舊的 WebSocket 連接
            }

            this.clients.set(walletAddress, ws);

            // **新增：處理前端發送過來的訊息**
            ws.on('message', async (message) => {
                try {
                    // 嘗試解析前端發送的 JSON 訊息
                    const parsedMessage = JSON.parse(message);

                    // **在這裡根據 parsedMessage.event 來處理不同的前端事件**
                    if (parsedMessage.event === 'startTimer') {
                        // 處理名為 'startTimer' 的事件
                        const startTimerData = parsedMessage.data;

                        const raw = await redisClient.get(`roomDetail:${startTimerData.roomId}`);

                        const roomInfo = JSON.parse(raw);

                        // 根據 startTimerData.walletAddress 去 roomDetail 的 players 找到對應的玩家
                        const player = roomInfo.players.find(player => player.walletAddress === startTimerData.walletAddress);

                        if (player) {
                            if (!player.gameInfo) {
                                // 如果 player 沒有 GameInfo 屬性，則新增一個空的陣列
                                player.gameInfo = [];
                            }

                            // 取得最新的 round number
                            let latestRound = player.gameInfo.length > 0 ? player.gameInfo[player.gameInfo.length - 1].round : 0;

                            latestRound += 1;

                            // 將新的 round 資訊加入到 GameInfo 陣列中
                            player.gameInfo.push({
                                round: latestRound,
                                startTimer: Date.now()
                            });

                            // 將更新後的 roomInfo 存回 Redis
                            await redisClient.set(`roomDetail:${startTimerData.roomId}`, JSON.stringify(roomInfo));

                        } else {
                            console.log("找不到玩家資料");
                        }

                    } else if (parsedMessage.event === 'endTimer') {
                        const endTimerData = parsedMessage.data;

                        const raw = await redisClient.get(`roomDetail:${endTimerData.roomId}`);

                        const roomInfo = JSON.parse(raw);

                        const player = roomInfo.players.find(player => player.walletAddress === endTimerData.walletAddress);

                        if (player) {
                            // 找 GameInfo 裡面沒有 endTimer 屬性的那筆
                            const gameInfoWithoutEndTimer = player.gameInfo.filter(gameInfo => !gameInfo.endTimer);

                            if (gameInfoWithoutEndTimer.length === 0) {
                                console.log(`GameInfo 中找不到沒有 endTimer 的回合資訊`);
                                return; // 找不到沒有 endTimer 的回合資訊，直接返回
                            }

                            // endTimer 為 Date.now()，score 為差異
                            const endTime = Date.now(); // 取得結束時間
                            const elapsedTime = (((endTime - gameInfoWithoutEndTimer[0].startTimer) % 60000) / 1000).toFixed(2);
                            const difference = Math.abs(elapsedTime - roomInfo.targetTime[gameInfoWithoutEndTimer[0].round - 1]);
                            let scores = Math.max(0, Math.floor((1 - difference / 10) * 10));

                            gameInfoWithoutEndTimer[0].endTimer = endTime;
                            gameInfoWithoutEndTimer[0].scores = scores;

                            if (typeof player.totalScores !== 'number') {
                                player.totalScores = 0;
                            }

                            player.totalScores += scores;

                            if (gameInfoWithoutEndTimer[0].round >= 10) {
                                player.finishedGame = true;

                                // 檢查 roomDetail 內的所有玩家的 finishedGame 是否都是 true
                                const allFinished = roomInfo.players.every(player => player.finishedGame === true);

                                if (allFinished) {
                                    // 比對所有玩家的 totalScores，找出最高分者，roomDetail 新增一個屬性 winner 存放 walletAddress
                                    let winner = null;
                                    let maxScore = -1;
                                    for (const player of roomInfo.players) {
                                        if (player.totalScores > maxScore) {
                                            maxScore = player.totalScores;
                                            winner = player.walletAddress;
                                        }
                                    }
                                    roomInfo.winner = winner;
                                    roomInfo.gameOver = true;

                                    // 派發給優勝者(總獎金的85%)
                                    const winnerTC = Math.floor(roomInfo.totalBet * 0.85);
                                    await userModel.updateUserTimeCoin(winnerTC, winner);

                                    // 紀錄LOG roomInfo 以 JSON 形式
                                    console.log("遊戲結果JSON:",roomInfo);
                                    pvpGameLogModel.insertIntoPvPGameLog(roomInfo);
                                }
                            }

                            roomInfo.players.forEach(player => {
                                const messgae = {
                                    event: 'pvpGameResult',
                                    data: {
                                        roomInfo
                                    }
                                }
                                this.broadcastToClient(player.walletAddress, messgae);
                            });

                            // 如果遊戲結束，則從 Redis 中刪除 roomDetail；否則更新 roomInfo
                            if (roomInfo.gameOver) {
                                await redisClient.del(`roomDetail:${endTimerData.roomId}`);
                            } else {
                                await redisClient.set(`roomDetail:${endTimerData.roomId}`, JSON.stringify(roomInfo));
                            }

                        } else {
                            console.log("找不到玩家資料");
                        }
                    } else if (parsedMessage.event === 'anotherEvent') {
                        // 處理另一個名為 'anotherEvent' 的事件 (您可以根據需要新增更多事件處理)
                        console.log(`收到 'anotherEvent' 事件，資料:`, parsedMessage.data);
                        // ... 針對 'anotherEvent' 的後端邏輯 ...
                    }
                    // ... 可以繼續新增更多事件類型的處理 ...

                } catch (error) {
                    console.error('解析前端訊息錯誤:', error);
                    // 可以選擇回覆錯誤訊息給前端，告知訊息格式不正確
                    const errorMessage = {
                        event: 'errorMessage',
                        data: {
                            error: '訊息格式不正確，請發送 JSON 格式訊息'
                        }
                    };
                    this.broadcastToClient(walletAddress, errorMessage);
                }
            });

            // 當 WebSocket 斷開連接時，從列表中移除客戶端
            ws.on('close', async (code, reason) => {
                const disconnectTime = new Date().toISOString();
                console.log(`${disconnectTime}客戶端已斷開連接，walletAddress: ${walletAddress}，代碼:${code}，原因:${reason}`);
                gameInfoModel.forceEndGame(walletAddress);
                this.clients.delete(walletAddress);

                // TODO
                // 思考當玩家斷線，PVP會發生什麼樣的事情?
                // 需要確定的是，要將 roomDetail 從 redis 刪除
            });

            // 4 WebSocket 錯誤處理
            ws.on('error', (error) => {
                console.error(`WebSocket 錯誤：walletAddress: ${walletAddress}`, error);
            });
        });

        console.log(`WebSocket 服務已啟動，端口：${this.port}`);
    }

    /**
     * 向指定的 walletAddress 發送消息
     * @param {string} walletAddress - 要通知的客戶端的錢包地址
     * @param {object} message - 要發送的消息
     */
    broadcastToClient(walletAddress, message) {
        const ws = this.clients.get(walletAddress?.toLowerCase());
        if (ws && ws.readyState === WebSocket.OPEN) {
            console.log(`發送消息到 ${walletAddress}:`, message);
            ws.send(JSON.stringify(message));
        } else {
            console.log(`無法向 ${walletAddress} 發送消息，可能客戶端未連線`);
        }
    }

    /**
     * 向所有已連接的客戶端發送消息 (可選功能)
     * @param {object} message - 要發送的消息
     */
    broadcastToAll(message) {
        this.clients.forEach((ws, walletAddress) => {
            if (ws.readyState === WebSocket.OPEN) {
                console.log(`發送消息到 ${walletAddress}:`, message);
                ws.send(JSON.stringify(message));
            }
        });
    }

    /**
     * 列出當前連線的客戶端
     */
    listConnectedClients() {
        const connectedClients = Array.from(this.clients.keys());
        console.log('當前已連線的客戶端:', connectedClients);
    }
}

let webSocketServiceInstance = null;

/**
 * 初始化 WebSocket 服務
 * @param {number} port - 服務端口
 * @returns {WebSocketService} - 返回 WebSocket 服務實例
 */
const initWebSocketService = (port) => {
    if (!webSocketServiceInstance) {
        webSocketServiceInstance = new WebSocketService(port);
        webSocketServiceInstance.start();
    }
    return webSocketServiceInstance;
};

/**
 * 發送廣播消息
 * @param {string} event - 事件名稱
 * @param {object} data - 需要發送的數據
 */
const sendWebSocketMessage = (message) => {
    if (webSocketServiceInstance) {
        webSocketServiceInstance.broadcastToAll(message);
    }
};

/**
 * 對特定玩家發送消息
 * 
 * @param {string} walletAddress - 玩家錢包地址，必須是有效的Web3錢包地址。
 * @param {object} message - 傳遞的消息對象，包含事件名稱和數據。
 * @param {string} message.event - 事件名稱，用於標識此消息的類型 (例如 'TokensPurchased', 'GameStarted' 等)。
 * @param {object} message.data - 與該事件關聯的數據對象，內部結構可根據不同的事件名稱自定義。
 * 
 * @example
 * sendToPlayerMessage('0x1234567890abcdef1234567890abcdef12345678', {
 *   event: 'TokensPurchased',
 *   data: {
 *     buyer: '0x9876543210fedcba9876543210fedcba98765432',
 *     userTimeCoin: 100
 *   }
 * });
 * 
 * @example
 * sendToPlayerMessage('0xabcdefabcdefabcdefabcdefabcdefabcdef', {
 *   event: 'GameStarted',
 *   data: {
 *     gameId: 'game_1234',
 *     startTime: '2024-12-18T12:00:00Z'
 *   }
 * });
 */
const sendToPlayerMessage = (walletAddress, message) => {
    if (webSocketServiceInstance) {
        webSocketServiceInstance.broadcastToClient(walletAddress, message);
    }
};

module.exports = {
    initWebSocketService,
    sendWebSocketMessage,
    sendToPlayerMessage
};
