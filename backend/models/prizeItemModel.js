const pool = require('../database/pool');

/**
 * 查詢獎品
 */
const queryPrizeItem = async (poolName) => {
    const sql = `
        SELECT ItemId, ItemName, ItemType, ItemValue, CONCAT(ROUND(DropRate * 100, 2), '%') AS DropRatePercent, DropRate, BigPrize
        FROM PrizeItem
        WHERE Rarity = ?
    `;
    const [rows] = await pool.execute(sql, [poolName]);
    return rows;
};

module.exports = {
    queryPrizeItem
};
