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

/**
 * 查詢道具效果
 * @param {道具ID} itemId 
 * @returns 陣列
 */
const getItemInfo = async (itemId) => {
    const sql = `
        SELECT
            ItemId,
            JSON_EXTRACT(pi.Effects, '$.value') AS EffectValue,
            JSON_UNQUOTE(JSON_EXTRACT(Effects, '$.type')) AS EffectType,
            JSON_EXTRACT(pi.Effects, '$.durationRounds') AS EffectDurationRounds,
            pi.DropRate
        FROM PrizeItem pi
        WHERE pi.ItemId = ?
    `;

    try {
        const [rows] = await pool.execute(sql, [itemId]);
        return rows[0];
    } catch (error) {
        console.error('查詢 道具資訊 發生錯誤:', error);
        throw error;
    }
};

/**
 * 根據獎池名稱撈出獎品Id
 */
const getPrizeItemIdByPoolName = async (poolName) => {
    const sql = `
        SELECT ItemId FROM PrizeItem 
        WHERE JSON_UNQUOTE(JSON_EXTRACT(Effects, '$.type')) = ?
    `;

    const [rows] = await pool.execute(sql, [poolName]);
    return rows.length > 0 ? rows[0].ItemId : null; // 只取第一個結果
};

module.exports = {
    queryPrizeItem,
    getItemInfo,
    getPrizeItemIdByPoolName
};
