const pool = require('../database/pool');

/**
 * 取得徽章資訊
 * @returns 
 */
const getUserBadge = async (walletAddress) => {
    const sql = `
        SELECT
            ub.WalletAddress,
            ub.BadgeId,
            bd.Name AS BadgeName, 
            ub.Quantity
        FROM UserBadge ub
        INNER JOIN BadgeDetail bd ON ub.BadgeId = bd.Id
        WHERE ub.WalletAddress = ?;
    `;

    const [rows] = await pool.execute(sql, [walletAddress]);
    return rows;
}

module.exports = {
    getUserBadge
};
