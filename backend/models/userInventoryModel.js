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

/**
 * 更新 UserInventory 數量
 */
const decrementItemQuantity = async (userId, itemId, quantity) => {
    const sql = `
        UPDATE UserInventory
        SET Quantity = Quantity - ?
        WHERE UserId = ? AND ItemId = ?
    `;
    await pool.execute(sql, [quantity, userId, itemId]);
};

/**
 * 查詢 UserInventory
 */
const queryUserInventory = async (walletAddress) => {
    const queryUserInfoSQL = `
        SELECT Id FROM UserInfo WHERE WalletAddress = ?;
    `
    const [row] = await pool.execute(queryUserInfoSQL, [walletAddress]);

    const sql = `
        SELECT
            ui.InventoryId,
            ui.UserId,
            ui.ItemId,
            ui.Quantity,
            ui.AcquiredTime,
            ui.UpdatedAt,
            pi.ItemName,
            pi.ItemType,
            pi.ItemValue,
            pi.Rarity,
            JSON_EXTRACT(pi.Effects, '$.value') AS EffectValue,
            JSON_UNQUOTE(JSON_EXTRACT(Effects, '$.type')) AS EffectType,
            JSON_EXTRACT(pi.Effects, '$.durationRounds') AS EffectDurationRounds,
            pi.DropRate
        FROM
            UserInventory ui
        INNER JOIN
            PrizeItem pi
        ON
            ui.ItemId = pi.ItemId
        WHERE
            ui.UserId = ?
        ORDER BY
            ui.AcquiredTime DESC;
    `;

    try {
        const [rows] = await pool.execute(sql, [row[0].Id]);
        return rows;
    } catch (error) {
        console.error('查詢 UserInventory 發生錯誤:', error);
        throw error;
    }
};

module.exports = {
    insertUserInventory,
    queryUserInventory,
    decrementItemQuantity
};
