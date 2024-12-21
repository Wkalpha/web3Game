const pool = require('../database/pool');

/**
 * 取得目標秒數時插入
 */
const insertWhenGetTargetTime = async (walletAddress, gameId, targetTime, round) => {
    const sql = `
        INSERT INTO GameLog (WalletAddress, GameId, TargetTime, Round)
        VALUES (?, ?, ?, ?);
    `;
    await pool.execute(sql, [walletAddress, gameId, targetTime, round]);
};

/**
 * 開始計時 更新
 */
const updateWhenStartTimer = async (gameId, startTime, round) => {
    const sql = `
        UPDATE GameLog 
        SET StartTime = ?
        WHERE GameId = ? AND Round = ?
    `;
    await pool.execute(sql, [startTime, gameId, round]);
};

/**
 * 找到當前回合的開始秒數
 */
const queryByGameIdAndRound = async (gameId, round) => {
    const sql = `
        SELECT StartTime, TargetTime
        FROM GameLog
        WHERE GameId = ? AND Round = ?;
    `;
    const [rows] = await pool.execute(sql, [gameId, round]);
    const { StartTime, TargetTime } = rows[0];
    return { StartTime, TargetTime };
};

/**
 * 停止計時 更新
 */
const updateWhenEndTimer = async (gameId, endTime, round, elapsedTime, scores) => {
    const sql = `
        UPDATE GameLog 
        SET EndTime = ?, ElapsedTime = ?, Scores = ?
        WHERE GameId = ? AND Round = ?
    `;
    const [result] = await pool.execute(sql, [endTime, elapsedTime, scores, gameId, round]);
    return result;
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
    insertWhenGetTargetTime,
    updateWhenStartTimer,
    queryByGameIdAndRound,
    updateWhenEndTimer,
    sumScoreByGameId
};
