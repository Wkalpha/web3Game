const pool = require('../../database/pool');

const resetPlayOfTime = async () => {
    const connection = await pool.getConnection(); // 獲取資料庫連線

    try {
        await connection.beginTransaction(); // 開啟交易，確保數據一致性

        try {
            await connection.beginTransaction(); // 開啟交易，確保數據一致性

            console.log("🔄 正在重置遊玩次數...");

            const resetProgressSql = `
                UPDATE timebattle.UserInfo u
                LEFT JOIN (
                    SELECT WalletAddress, COALESCE(SUM(Quantity), 0) * 2 AS NewBonus
                    FROM timebattle.UserBadge
                    WHERE BadgeId = 2
                    GROUP BY WalletAddress
                ) b ON u.WalletAddress = b.WalletAddress
                SET u.LeftOfPlay = u.BaseLeftOfPlay + COALESCE(b.NewBonus, 0)
                WHERE u.LeftOfPlay < u.BaseLeftOfPlay + COALESCE(b.NewBonus, 0);
            `;
            const [result] = await connection.query(resetProgressSql);

            console.log(`✅ 已重置 ${result.affectedRows} 個玩家的遊玩次數！`);

            await connection.commit(); // 提交交易
        } catch (error) {
            console.error('❌ 重置發生錯誤:', error);
            await connection.rollback(); // 發生錯誤時回滾變更
        } finally {
            connection.release(); // 釋放連線
        }
    } catch (error) {
        console.error('發生錯誤:', error);
        await connection.rollback(); // 發生錯誤時回滾變更
    } finally {
        connection.release(); // 釋放連線
    }
};

module.exports = resetPlayOfTime;