const pool = require('../database/pool');

/**
 * 取得玩家每日任務進度
 */
const getUserDailyQuests = async (walletAddress) => {
    const sql = `
        SELECT 
            dq.Id AS DailyQuestId, 
            dq.Name, 
            dq.Target, 
            dq.Reward, 
            COALESCE(udp.Progress, 0) AS Progress, 
            COALESCE(udp.RewardClaimed, FALSE) AS RewardClaimed
        FROM DailyQuests dq
        LEFT JOIN UserDailyProgress udp 
        ON dq.Id = udp.DailyQuestId AND udp.WalletAddress = ?
    `;

    const [results] = await pool.execute(sql, [walletAddress]);
    return results;
}

/**
 * 更新玩家每日任務進度
 */
const updateQuestProgress = async (walletAddress, questId) => {
    const sql = `
        INSERT INTO UserDailyProgress (WalletAddress, DailyQuestId, Progress)
        VALUES (?, ?, 1)
        ON DUPLICATE KEY UPDATE Progress = Progress + 1
    `;
    await pool.execute(sql, [walletAddress, questId]);
}

/**
 * 領取獎勵
 */
const claimQuestReward = async (walletAddress, questId) => {
    const connection = await pool.getConnection(); // 取得資料庫連線
    try {
        await connection.beginTransaction(); // 開始交易

        // 先更新 UserDailyProgress，標記獎勵已領取
        const updateProgressSql = `
                UPDATE UserDailyProgress 
                SET RewardClaimed = TRUE 
                WHERE WalletAddress = ? AND DailyQuestId = ? 
                AND Progress >= (SELECT Target FROM DailyQuests WHERE Id = ?)
                AND RewardClaimed = FALSE
            `;

        const [result] = await connection.execute(updateProgressSql, [walletAddress, questId, questId]);

        // 確保真的有更新到資料
        if (result.affectedRows === 0) {
            await connection.rollback(); // 如果沒有成功更新，則回滾
            return false;
        }

        // 取得獎勵金額
        const getRewardSql = `SELECT Reward FROM DailyQuests WHERE Id = ?`;
        const [[{ Reward }]] = await connection.execute(getRewardSql, [questId]);

        // 更新 UserInfo，增加 TimeCoin
        const updateUserSql = `
                UPDATE UserInfo 
                SET TimeCoin = TimeCoin + ? 
                WHERE WalletAddress = ?
            `;
        await connection.execute(updateUserSql, [Reward, walletAddress]);

        await connection.commit(); // 提交交易
        return true;
    } catch (error) {
        await connection.rollback(); // 發生錯誤則回滾
        console.error('領取獎勵失敗:', error);
        throw new Error('領取獎勵失敗');
    } finally {
        connection.release(); // 釋放連線
    }
}

module.exports = {
    getUserDailyQuests,
    updateQuestProgress,
    claimQuestReward
};
