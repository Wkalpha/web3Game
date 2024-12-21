const pool = require('../database/pool');

const queryGameInfoByGameId = async (gameId) => {
    const sql = `
        SELECT WalletAddress, Level, Odds, BetAmount
        FROM GameInfo
        WHERE GameId = ?
    `;

    const [rows] = await pool.execute(sql, [gameId]);
    const { WalletAddress, Level, Odds, BetAmount } = rows[0];
    return { WalletAddress, Level, Odds, BetAmount };
}

/**
 * 開始遊戲時插入
 */
const insertWhenGameStart = async (walletAddress, gameId, level, odds, amountInput) => {
    const sql = `
        INSERT INTO GameInfo (WalletAddress, GameId, Level, Odds, BetAmount)
        VALUES (?, ?, ?, ?, ?);
    `;
    await pool.execute(sql, [walletAddress, gameId, level, odds, amountInput]);
};

/**
 * 遊戲結束時更新
 */
const updateWhenGameOver = async (gameId, result, profit) => {
    const sql = `
        UPDATE GameInfo
        SET Result = ?, Profit = ?
        WHERE GameId = ?
    `;
    await pool.execute(sql, [result, profit, gameId]);
};

module.exports = {
    insertWhenGameStart,
    updateWhenGameOver,
    queryGameInfoByGameId
};
