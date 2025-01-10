const pool = require('../../database/pool');

const updateTop3Ranks = async (yearWeek = '202502') => {
    const connection = await pool.getConnection(); // 獲取資料庫連線

    try {
        await connection.beginTransaction(); // 開啟交易，確保數據一致性

        console.log(`正在查找 YearWeek = ${yearWeek} 的排行榜前三名...`);

        // 1️⃣ 查詢前三名玩家的 WalletAddress
        const [topPlayers] = await connection.query(`
            SELECT WalletAddress 
            FROM Leaderboard 
            WHERE YearWeek = ? 
            ORDER BY Scores DESC 
            LIMIT 3;
        `, [yearWeek]);

        if (topPlayers.length === 0) {
            console.log(`沒有找到 ${yearWeek} 週的數據`);
            await connection.rollback();
            return;
        }

        console.log(`找到 ${yearWeek} 週的前三名，開始更新排名...`);

        // 2️⃣ 更新前三名的 YearWeekRank
        for (let i = 0; i < topPlayers.length; i++) {
            const walletAddress = topPlayers[i].WalletAddress;
            const rank = i + 1; // 1, 2, 3 名

            console.log(`更新 ${walletAddress} 的排名為 ${rank}`);

            await connection.query(`
                UPDATE Leaderboard 
                SET YearWeekRank = ? 
                WHERE WalletAddress = ? AND YearWeek = ?;
            `, [rank, walletAddress, yearWeek]);
        }

        await connection.commit(); // 提交交易
        console.log(`排行榜更新完成！`);
    } catch (error) {
        console.error('更新排行榜時發生錯誤:', error);
        await connection.rollback(); // 發生錯誤時回滾變更
    } finally {
        connection.release(); // 釋放連線
    }
};

module.exports = updateTop3Ranks;