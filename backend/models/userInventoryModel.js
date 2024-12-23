const pool = require('../database/pool');

/**
 * 插入 UserInventory
 */
const insertUserInventory = async (userId, itemId, quantity) => {
    const sql = `
        INSERT INTO UserInventory (UserId, ItemId, Quantity)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE
        Quantity = Quantity + ?,
        UpdatedAt = CURRENT_TIMESTAMP;
    `;
    await pool.execute(sql, [userId, itemId, quantity, quantity]);
};

module.exports = {
    insertUserInventory
};
