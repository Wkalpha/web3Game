const pool = require('../database/pool');

/**
 * 查詢抽獎池
 */
const queryPrizeItemPool = async () => {
    const sql = `
        SELECT PrizeItemPoolId, PoolName, EntryFee, GuaranteeDraw
        FROM PrizeItemPool
    `;
    const [rows] = await pool.execute(sql);
    return rows;
};

module.exports = {
    queryPrizeItemPool
};
