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
            ui.UserId = ? AND ui.Quantity > 0
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

/**
 * 回傳玩家擁有此道具數量
 */
const getUserInventoryCount = async (walletAddress, itemId) => {
    if (!itemId) {
        return 0; // itemId 無效時直接回傳 0，避免後續查詢錯誤
    }

    // 先查詢 UserId
    const queryUserIdSQL = `SELECT Id FROM UserInfo WHERE WalletAddress = ?;`;

    // 查詢 UserInventory 內 ItemId 的數量
    const queryUserInventorySQL = `
        SELECT Quantity
        FROM UserInventory
        WHERE UserId = ? AND ItemId = ?;
    `;

    try {
        // 先查 walletAddress 找 UserId
        const [userRows] = await pool.execute(queryUserIdSQL, [walletAddress]);

        if (userRows.length === 0) {
            console.warn(`User with wallet address ${walletAddress} not found.`);
            return 0; // 如果找不到該玩家，回傳 0
        }

        const userId = userRows[0].Id;

        // 再用 UserId 查詢該玩家的道具數量
        const [inventoryRows] = await pool.execute(queryUserInventorySQL, [userId, itemId]);

        return inventoryRows[0].Quantity; // 回傳擁有的數量
    } catch (error) {
        console.error("Error fetching user inventory count:", error);
        throw error; // 拋出錯誤，讓上層處理
    }
};

module.exports = {
    insertUserInventory,
    queryUserInventory,
    decrementItemQuantity,
    getUserInventoryCount
};
