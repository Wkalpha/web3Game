const pool = require('../database/pool');

/**
 * 更新 LeaderboardBetRecord
 * @param {string} walletAddress - 使用者的錢包地址
 */
const upsertLeaderboardBetRecord = async (fromWalletAddress, toWalletAddress, betAmount) => {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const firstDayOfYear = new Date(year, 0, 1);
    const pastDaysOfYear = Math.floor((currentDate - firstDayOfYear) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7); // 取得當前週數
    const yearWeek = `${year}${weekNumber.toString().padStart(2, '0')}`; // 例如：202450

    const sql = `
        INSERT INTO LeaderboardBetRecord (FromWalletAddress, ToWalletAddress, YearWeek, BetAmount, CreatedAt, UpdatedAt)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON DUPLICATE KEY UPDATE 
        BetAmount = BetAmount + ?,
        UpdatedAt = CURRENT_TIMESTAMP
    `;
    await pool.execute(sql, [fromWalletAddress, toWalletAddress, yearWeek, betAmount, betAmount]);
};

module.exports = {
    upsertLeaderboardBetRecord
};
