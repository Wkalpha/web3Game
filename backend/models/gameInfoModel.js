const pool = require('../database/pool');

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
const updateWhenGameOver = async (gameId) => {
    const sql = `
        INSERT INTO GameLog (WalletAddress, GameId, TargetTime, Round)
        VALUES (?, ?, ?, 1);
    `;
    await pool.execute(sql, [walletAddress, gameId, targetTime]);
};

module.exports = {
    insertWhenGameStart,
    updateWhenGameOver
};
