const pool = require('../database/pool');

/**
 * 取得使用者徽章數量
 * @returns 
 */
const getUserBadges = async (walletAddress) => {
    const sql = `
        SELECT BadgeId, Quantity
        FROM UserBadge
        WHERE WalletAddress = ? AND Quantity > 0
    `;

    const [rows] = await pool.execute(sql, [walletAddress]);

    // 如果沒有資料，回傳空陣列
    return rows.length > 0 ? rows : [];
};

/**
 * 取得使用者傷害徽章資訊
 */
const getBadgeEffect = async (walletAddress, badgeId) => {
    const query = `
        SELECT 
            ub.Quantity, 
            JSON_UNQUOTE(JSON_EXTRACT(bd.Effects, '$.value')) AS effectValue
        FROM UserBadge ub
        JOIN BadgeDetail bd ON ub.BadgeId = bd.Id
        WHERE ub.WalletAddress = ? AND ub.BadgeId = ?;
    `;

    const [rows] = await pool.execute(query, [walletAddress, badgeId]);
    if (rows.length > 0) {
        const { Quantity, effectValue } = rows[0];
        return { quantity: Quantity, effectValue: parseFloat(effectValue) };
    } else {
        return { quantity: 0, effectValue: 0 };
    }
};

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

/**
 * 更新到使用者的徽章
 * @returns 
 */
const updateUserBadge = async (walletAddress, badgeId, quantity) => {
    try {
        const sql = `
            UPDATE UserBadge
            SET Quantity = Quantity + ?
            WHERE WalletAddress = ? AND BadgeId = ?
        `;
        await pool.execute(sql, [quantity, walletAddress, badgeId]);
    } catch (error) {
        console.error("Database error:", error);
        throw error; // 可以選擇拋出錯誤給上層處理
    }

}

module.exports = {
    getBadges,
    insertIntoUserBadge,
    getUserBadges,
    getBadgeEffect,
    updateUserBadge
};
