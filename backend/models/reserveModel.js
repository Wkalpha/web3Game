const pool = require('../database/pool');

/**
 * 插入 Reserve
 * @param {string} userInfo - 錢包地址或Email
 */
const insert = async (userInfo) => {
    try {
        const sql = `
            INSERT INTO Reserve (UserInfo, CreatedAt)
            VALUES (?, NOW())
            `;
        await pool.query(sql, [userInfo]);

        // 取得目前資料表的筆數
        const countSql = `SELECT COUNT(*) AS total FROM Reserve`;

        const [rows] = await pool.query(countSql);

        const totalRows = rows[0].total;

        return {
            success: true,
            totalRows
        };
    } catch (error) {
        // 如果是重複鍵 (ER_DUP_ENTRY)，就表示 UserInfo 已經存在
        if (error.code === 'ER_DUP_ENTRY') {
            return {
                success: false,
                message: 'duplicate'
            };
        }
        // 其他錯誤就繼續往外丟
        throw error;
    }
};
/**
 * 
 */
const queryReserveCount = async () => {
    // 取得目前資料表的筆數
    const countSql = `SELECT COUNT(*) AS total FROM Reserve`;

    const [rows] = await pool.query(countSql);

    const totalRows = rows[0].total;

    return totalRows;
}
module.exports = {
    insert,
    queryReserveCount
};
