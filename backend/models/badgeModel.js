const pool = require('../database/pool');

/**
 * 取得徽章資訊
 * @returns 
 */
const getBadges = async () => {
    const sql = `
        SELECT Name, CONCAT(ROUND(DropRate * 100, 2), '%') AS DropRatePercent
        FROM BadgeDetail
    `;

    const [rows] = await pool.execute(sql);
    return rows;
}

module.exports = {
    getBadges
};
