const pool = require('../database/pool');

/**
 * 取得徽章資訊
 * @returns 
 */
const getUserBadges = async (walletAddress) => {
    const sql = `
        SELECT BadgeId
        FROM UserBadge
        WHERE WalletAddress = ?
    `;

    const [rows] = await pool.execute(sql,[walletAddress]);
    return rows;
}

/**
 * 取得徽章資訊
 * @returns 
 */
const getBadges = async () => {
    const sql = `
        SELECT Id, Name, CONCAT(ROUND(DropRate * 100, 2), '%') AS DropRatePercent, DropRate
        FROM BadgeDetail
    `;

    const [rows] = await pool.execute(sql);
    return rows;
}

/**
 * 新增到使用者的徽章
 * @returns 
 */
const insertIntoUserBadge = async (walletAddress, badgeId, quantity) => {
    try {
        const sql = `
            INSERT INTO UserBadge (WalletAddress, BadgeId, Quantity, UpdatedAt)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            ON DUPLICATE KEY UPDATE
            Quantity = Quantity + ?,
            UpdatedAt = CURRENT_TIMESTAMP;
        `;
        const [result] = await pool.execute(sql, [walletAddress, badgeId, quantity, quantity]);
        return result;
    } catch (error) {
        console.error("Database error:", error);
        throw error; // 可以選擇拋出錯誤給上層處理
    }

}

module.exports = {
    getBadges,
    insertIntoUserBadge,
    getUserBadges
};
