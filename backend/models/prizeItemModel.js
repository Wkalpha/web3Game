const pool = require('../database/pool');

/**
 * 查詢獎品
 */
const queryPrizeItem = async (poolName) => {
    const sql = `
        SELECT ItemName, ItemValue, CONCAT(ROUND(DropRate * 100, 2), '%') AS DropRate
        FROM PrizeItem
        WHERE Rarity = ?
    `;
    const [rows] = await pool.execute(sql, [poolName]);
    return rows;
};

module.exports = {
    queryPrizeItem
};
