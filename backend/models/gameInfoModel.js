const pool = require('../database/pool');

/**
 * 取得本場遊戲資訊
 * @param {遊戲唯一ID} gameId 
 * @returns 
 */
const queryGameInfoByGameId = async (gameId) => {
    const sql = `
        SELECT WalletAddress, Level, Odds, BetAmount, ItemId, Round, RewardMultiplier, DamageMultiplier
        FROM GameInfo
        WHERE GameId = ?
    `;

    const [rows] = await pool.execute(sql, [gameId]);
    const { WalletAddress, Level, Odds, BetAmount, ItemId, Round, RewardMultiplier, DamageMultiplier } = rows[0];
    return { WalletAddress, Level, Odds, BetAmount, ItemId, Round, RewardMultiplier, DamageMultiplier };
}
/**
 * 取得關卡資訊
 */
const getLevelInfo = async (level) => {
    const sql = `
        SELECT Round, RewardMultiplier, Threshold
        FROM GameLevel
        WHERE Level = ?
    `;

    const [rows] = await pool.execute(sql, [level]);
    const { Round, RewardMultiplier, Threshold } = rows[0];
    return { Round, RewardMultiplier, Threshold };
}

/**
 * 開始遊戲時插入
 */
const insertWhenGameStart = async ({
    walletAddress,
    gameId,
    level,
    round,
    rewardMultiplier,
    damageMultiplier,
    itemId = null,
    odds,
    amountInput
}) => {
    const sql = `
        INSERT INTO GameInfo (WalletAddress, GameId, Level, Round, RewardMultiplier, DamageMultiplier, ItemId, Odds, BetAmount)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;
    await pool.execute(sql, [walletAddress, gameId, level, round, rewardMultiplier, damageMultiplier, itemId, odds, amountInput]);
};

/**
 * 遊戲結束時更新
 */
const updateWhenGameOver = async (gameId, result, profit, userScores) => {
    const sql = `
        UPDATE GameInfo
        SET Result = ?, Profit = ?, UserScores = ?
        WHERE GameId = ?
    `;
    await pool.execute(sql, [result, profit, userScores, gameId]);
};

/**
 * 強制結束玩家的遊戲 (因為斷線或異常)
 * @param {string} walletAddress - 玩家錢包地址
 */
const forceEndGame = async (walletAddress) => {
    try {
        // 避免循環依賴，這裡才載入 `webSocketService`
        const { sendWebSocketMessage } = require('../services/webSocketService');
        
        // 1. 查找當前遊戲的 GameId
        const [gameInfo] = await pool.execute(
            `SELECT GameId, BetAmount FROM GameInfo WHERE WalletAddress = ? AND Result IS NULL`,
            [walletAddress]
        );

        if (!gameInfo.length) {
            console.warn(`找不到進行中的遊戲，walletAddress: ${walletAddress}`);
            return;
        }

        const { GameId: gameId, BetAmount: betAmount } = gameInfo[0];

        // 2. 設定遊戲結果 (異常結束)
        const result = 'disconnect'; // 或 'forfeit'，根據需求決定
        const profit = 0; // 玩家異常離線，沒有獎勵
        const userScores = 0; // 異常遊戲，預設 0 分

        // 3. 更新遊戲結果
        const sql = `
            UPDATE GameInfo
            SET Result = ?, Profit = ?, UserScores = ?
            WHERE GameId = ? AND WalletAddress = ? AND Result IS NULL
        `;

        const [updateResult] = await pool.execute(sql, [result, profit, userScores, gameId, walletAddress]);

        if (updateResult.affectedRows > 0) {
            console.log(`成功強制結束遊戲: GameId = ${gameId}, WalletAddress = ${walletAddress}`);
        } else {
            console.warn(`未能更新遊戲結果，可能遊戲已結束: GameId = ${gameId}, WalletAddress = ${walletAddress}`);
        }

        // 4. 更新獎金池
        const updatePrizePoolSQL = `
            UPDATE PrizePool
            SET Amount = Amount + (? / 10000)
            WHERE ID = 1
            `;
        await pool.execute(updatePrizePoolSQL, [betAmount]);

        // 5. 重查獎金池
        const queryPrizePoolMainAmount = `SELECT FLOOR(Amount*10000) AS AjustAmount FROM PrizePool WHERE ID = 1`;
        const [queryPrizePoolMainAmountResult] = await pool.execute(queryPrizePoolMainAmount);
        const amount = queryPrizePoolMainAmountResult[0]?.AjustAmount || 0; // 如果找不到，返回 0

        // websocket 通知所有線上的使用者
        const message = {
            event: 'PrizePoolUpdated',
            data: {
                prizePoolTimeCoin: amount
            }
        };
        sendWebSocketMessage(message);

    } catch (error) {
        console.error(`強制結束遊戲失敗: walletAddress = ${walletAddress}`, error);
    }
};

module.exports = {
    getLevelInfo,
    forceEndGame,
    insertWhenGameStart,
    updateWhenGameOver,
    queryGameInfoByGameId
};
