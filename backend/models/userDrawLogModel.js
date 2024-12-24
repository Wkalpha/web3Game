const pool = require('../database/pool');

/**
 * 插入
 */
const insertUserDrawLog = async (userId, prizeItemPoolId, itemId, bigPrize) => {
    const sql = `
        INSERT INTO UserDrawLog (UserId, PrizeItemPoolId, ItemId, BigPrize, DrawTime)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;
    await pool.execute(sql, [userId, prizeItemPoolId, itemId, bigPrize]);
};

/**
 * 找抽到大獎資料
 */
const queryBigPrizeLog = async () => {
    const sql = `
      SELECT 
        UserInfo.WalletAddress,
        PrizeItem.ItemName,
        UserDrawLog.DrawTime
      FROM 
        UserDrawLog
      INNER JOIN 
        UserInfo ON UserDrawLog.UserId = UserInfo.Id
      INNER JOIN 
        PrizeItem ON UserDrawLog.ItemId = PrizeItem.ItemId
        WHERE PrizeItem.BigPrize = 1
        ORDER BY 
        UserDrawLog.DrawTime DESC
        LIMIT 50
    `;
    const [rows] = await pool.execute(sql);

    // 格式化資料為縮短地址
    const formattedResults = rows.map((row) => {
        const shortAddress =
            row.WalletAddress.slice(0, 4) + "..." + row.WalletAddress.slice(-3);
        return `${shortAddress} 抽到了 "${row.ItemName}"`;
    });

    return formattedResults;
};

module.exports = {
    insertUserDrawLog,
    queryBigPrizeLog
};
