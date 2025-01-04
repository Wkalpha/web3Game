const pool = require('../database/pool');
/**
 * 取得筆數來當作回合數
 */
const getGameLogCountByGameId = async (gameId) => {
    const sql = `
        SELECT COUNT(*) AS count FROM GameLog WHERE GameId = ?;
    `;

    try {
        const [rows] = await pool.execute(sql, [gameId]);
        return rows[0].count; // 取得筆數
    } catch (error) {
        console.error("Error fetching game log count:", error);
        throw error; // 拋出錯誤，讓上層處理
    }
};


/**
 * 開始遊戲時寫入
 */
const insertWhenGameStart = async ({
    walletAddress,
    gameId,
    round,
    targetTime = null,
    itemId = null,
    itemType = null,
    itemEffectValue = null,
    itemLeftRound = null
}) => {
    const sql = `
        INSERT INTO GameLog (WalletAddress, GameId, Round, TargetTime, ItemId, ItemType, ItemEffectValue, ItemLeftRound)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    `;
    await pool.execute(sql, [walletAddress, gameId, round, targetTime, itemId, itemType, itemEffectValue, itemLeftRound]);
};

/**
 * 取得目標秒數時更新
 */
const updateWhenGetTargetTime = async ({
    walletAddress,
    gameId,
    round,
    targetTime
}) => {
    const sql = `
        UPDATE GameLog
        SET TargetTime = ?
        WHERE WalletAddress = ? AND GameId = ? AND Round = ?;
    `;
    await pool.execute(sql, [targetTime, walletAddress, gameId, round]);
};

/**
 * 開始計時 更新
 */
const updateWhenStartTimer = async (gameId, startTime, round) => {
    let sql = `
        UPDATE GameLog 
        SET StartTime = ?
        WHERE GameId = ? AND Round = ?;
    `;

    const [result] = await pool.execute(sql, [startTime, gameId, round]);
    return result;
};

/**
 * 找到當前回合的開始秒數、目標秒數、道具剩餘次數
 */
const queryByGameIdAndRound = async (gameId) => {
    const queryCurrentRound = `
        SELECT COUNT(*) AS count FROM GameLog WHERE GameId = ?;
    `
    const [queryCurrentRounds] = await pool.execute(queryCurrentRound, [gameId]);
    const currentRound = queryCurrentRounds[0].count;

    const sql = `
        SELECT StartTime, TargetTime, ItemLeftRound, WalletAddress
        FROM GameLog
        WHERE GameId = ? AND Round = ?;
    `;
    const [rows] = await pool.execute(sql, [gameId, currentRound]);
    const { StartTime, TargetTime, ItemLeftRound, WalletAddress } = rows[0];
    return { StartTime, TargetTime, ItemLeftRound, currentRound, WalletAddress };
};

/**
 * 停止計時 更新
 */
const updateWhenEndTimer = async ({ gameId, endTime, elapsedTime, scores }) => {
    const queryCurrentRoundSQL = `
        SELECT COUNT(*) AS count FROM GameLog WHERE GameId = ?;
    `
    const [queryCurrentRounds] = await pool.execute(queryCurrentRoundSQL, [gameId]);
    const currentRound = queryCurrentRounds[0].count;

    const updateGameLogSQL = `
        UPDATE GameLog 
        SET 
            EndTime = ?, 
            ElapsedTime = ?, 
            Scores = ?
        WHERE GameId = ? AND Round = ?;
    `;

    const insertGameLogSQL = `
        INSERT INTO GameLog (WalletAddress, GameId, Round, TargetTime, ItemId, ItemType, ItemEffectValue, ItemLeftRound)
        SELECT gl.WalletAddress, gl.GameId, ?, gl.TargetTime, gl.ItemId, gl.ItemType, gl.ItemEffectValue, 
            CASE WHEN gl.ItemLeftRound > 0 THEN gl.ItemLeftRound - 1 ELSE gl.ItemLeftRound END
        FROM GameLog gl
        JOIN GameInfo gi ON gl.GameId = gi.GameId
        WHERE gl.GameId = ? 
            AND gl.Round = ?
            AND ? <= gi.Round; -- 確保未超過最大回合
    `;

    try {
        // 先更新 GameLog
        await pool.execute(updateGameLogSQL, [endTime, elapsedTime, scores, gameId, currentRound]);

        // 再執行 INSERT
        await pool.execute(insertGameLogSQL, [currentRound + 1, gameId, currentRound, currentRound + 1]);
    } catch (error) {
        console.error("Error updating/inserting GameLog:", error);
        throw error;
    }
};

/**
 * 根據 GameId 加總 Score
 * @param {*} gameId 
 * @returns {number} TotalScore
 */
const sumScoreByGameId = async (gameId) => {
    const sql = `
        SELECT SUM(Scores) AS TotalScore
        FROM GameLog
        WHERE GameId = ?
    `;
    const [rows] = await pool.execute(sql, [gameId]);

    // 從結果中提取總分數
    const totalScore = rows[0]?.TotalScore || 0; // 若無結果，回傳 0
    return totalScore;
};

module.exports = {
    getGameLogCountByGameId,
    insertWhenGameStart,
    updateWhenGetTargetTime,
    updateWhenStartTimer,
    queryByGameIdAndRound,
    updateWhenEndTimer,
    sumScoreByGameId
};
