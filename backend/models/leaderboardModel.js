const pool = require('../database/pool');

/**
 * 更新 Leaderboard 的 Amount
 * @param {string} walletAddress - 使用者的錢包地址
 */
const updateLeaderboardAmount = async (betAmount, toWalletAddress) => {
    const sql = `
        UPDATE Leaderboard
        SET BetAmount = BetAmount + ?
        WHERE WalletAddress = ?
    `;
    await pool.execute(sql, [betAmount, toWalletAddress]);
};

/**
 * 遊戲結束後更新 Leaderboard
 */
const upsertLeaderboardAfterGameOver = async (walletAddress, yearWeek, winIncrement, loseIncrement, scoreAdjustment) => {
    const sql = `
        INSERT INTO Leaderboard (WalletAddress, YearWeek, Win, Lose, Scores, CreatedAt, UpdatedAt)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON DUPLICATE KEY UPDATE 
            Win = Win + ?, 
            Lose = Lose + ?, 
            Scores = Scores + ?, 
            UpdatedAt = CURRENT_TIMESTAMP
    `;
    await pool.execute(sql, [walletAddress, yearWeek, winIncrement, loseIncrement, scoreAdjustment, winIncrement, loseIncrement, scoreAdjustment]);
};

/**
 * 查詢 Leaderboard
 * @param {string} yearWeek - 年星期 202450
 */
const getLeaderboard = async (yearWeek) => {
    const sql = `
        SELECT WalletAddress, YearWeek, Win, Lose, Scores, BetAmount
        FROM Leaderboard
        WHERE YearWeek = ?
        ORDER BY Scores DESC
        LIMIT 50
    `;
    const [leaderboardResults] = await pool.execute(sql, [yearWeek]);
    
    return leaderboardResults;
};

module.exports = {
    updateLeaderboardAmount,
    upsertLeaderboardAfterGameOver,
    getLeaderboard
};
