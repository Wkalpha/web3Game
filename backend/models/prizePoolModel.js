const pool = require('../database/pool');
const { sendWebSocketMessage } = require('../services/webSocketService');

/**
 * 更新主獎金池的金額
 * @param {number} amount - 需要增加的金額 (ETH)
 */
const updateMainPrizePoolAmount = async (amount) => {
    const sql = `UPDATE PrizePool SET Amount = Amount + ? WHERE ID = 1`;
    const [result] = await pool.execute(sql, [amount]);

    // 如果有變更到 PrizePool 表的金額，則發送 WebSocket 通知
    if (result.affectedRows > 0) {
        // 獲取最新的 PrizePool 金額
        const amount = await getMainPrizePoolAmount();
        const message = {
            event: 'PrizePoolUpdated',
            data: {
                prizePoolTimeCoin: amount
            }
        };
        sendWebSocketMessage(message); // 發送 WebSocket 消息
    }
};

/**
 * 遊戲結束後更新主獎金池的金額
 * @param {number} amount - 需要增加的金額
 */
const updateMainPrizePoolAmountAfterGameOver = async (amount, prizePoolOdds) => {
    const sql = `
        UPDATE PrizePool
        SET Amount = Amount + ((? * ?) / 10000)
        WHERE ID = 1
        `;
    const [result] = await pool.execute(sql, [amount, prizePoolOdds]);

    // 如果有變更到 PrizePool 表的金額，則發送 WebSocket 通知
    if (result.affectedRows > 0) {
        // 獲取最新的 PrizePool 金額
        const amount = await getMainPrizePoolAmount();
        const message = {
            event: 'PrizePoolUpdated',
            data: {
                prizePoolTimeCoin: amount
            }
        };
        sendWebSocketMessage(message); // 發送 WebSocket 消息
    }
};

/**
 * 更新排行榜獎金池的金額
 * @param {number} amount - 需要增加的金額 (ETH)
 */
const updateLeaderboardPrizePoolAmount = async (amount) => {
    const sql = `UPDATE PrizePool SET Amount = Amount + (?/10000) WHERE ID = 2`;
    const [result] = await pool.execute(sql, [amount]);

    // 如果有變更到 PrizePool 表的金額，則發送 WebSocket 通知
    if (result.affectedRows > 0) {
        // 獲取最新的 PrizePool 金額
        const amount = await getLeaderboardPrizePoolAmount();
        const message = {
            event: 'LeaderboardPrizePoolUpdated',
            data: {
                prizePoolTimeCoin: amount
            }
        };
        sendWebSocketMessage(message); // 發送 WebSocket 消息
    }
};

/**
 * 查詢主獎金池金額
 * @returns {number} - 返回獎池的當前金額
 */
const getMainPrizePoolAmount = async () => {
    const sql = `SELECT FLOOR(Amount*10000) AS AjustAmount FROM PrizePool WHERE ID = 1`;
    const [rows] = await pool.execute(sql);
    return rows[0]?.AjustAmount || 0; // 如果找不到，返回 0
};

/**
 * 查詢排行榜獎金池金額
 * @returns {number} - 返回獎池的當前金額
 */
const getLeaderboardPrizePoolAmount = async () => {
    const sql = `SELECT FLOOR(Amount*10000) AS AjustAmount FROM PrizePool WHERE ID = 2`;
    const [rows] = await pool.execute(sql);
    return rows[0]?.AjustAmount || 0; // 如果找不到，返回 0
};


module.exports = {
    updateMainPrizePoolAmount,
    getMainPrizePoolAmount,
    updateLeaderboardPrizePoolAmount,
    getLeaderboardPrizePoolAmount,
    updateMainPrizePoolAmountAfterGameOver
};
