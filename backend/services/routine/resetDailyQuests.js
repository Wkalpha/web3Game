const pool = require('../../database/pool');

const resetDailyQuests = async () => {
    const connection = await pool.getConnection(); // 獲取資料庫連線

    try {
        await connection.beginTransaction(); // 開啟交易，確保數據一致性

        try {
            await connection.beginTransaction(); // 開啟交易，確保數據一致性

            console.log("🔄 正在重置每日任務進度...");

            // 1️⃣ 清除前一天的進度，讓玩家可以重新完成任務
            const resetProgressSql = `
                UPDATE UserDailyProgress 
                SET Progress = 0, RewardClaimed = FALSE 
                WHERE DATE(CreatedAt) < CURDATE()
            `;
            const [result] = await connection.query(resetProgressSql);

            console.log(`✅ 已重置 ${result.affectedRows} 個玩家的每日任務進度！`);

            await connection.commit(); // 提交交易
        } catch (error) {
            console.error('❌ 重置每日任務時發生錯誤:', error);
            await connection.rollback(); // 發生錯誤時回滾變更
        } finally {
            connection.release(); // 釋放連線
        }
    } catch (error) {
        console.error('更新排行榜時發生錯誤:', error);
        await connection.rollback(); // 發生錯誤時回滾變更
    } finally {
        connection.release(); // 釋放連線
    }
};

module.exports = resetDailyQuests;