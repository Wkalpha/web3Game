const pool = require('../database/pool');

/**
 * 新增資料
 * @returns 
 */
const insert = async (fromWalletAddress, toWalletAddress, quantity, badgeId) => {
    const sql = `
        INSERT INTO BadgeTransferLog (FromWalletAddress, ToWalletAddress, Quantity, BadgeId, CreatedAt)
        VALUES 
        (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;

    const [rows] = await pool.execute(sql, [fromWalletAddress, toWalletAddress, quantity, badgeId]);
    return rows;
}

module.exports = {
    insert
};
