const pool = require('../database/pool');

/**
 * 取得本場遊戲資訊
 * @param {遊戲唯一ID} gameId 
 * @returns 
 */
const queryGameInfoByGameId = async (gameId) => {
    const sql = `
        SELECT WalletAddress, Level, Odds, BetAmount, ItemId, Round, RewardMultiplier, DamageMultiplier
        FROM GameInfo
        WHERE GameId = ?
    `;

    const [rows] = await pool.execute(sql, [gameId]);
    const { WalletAddress, Level, Odds, BetAmount, ItemId, Round, RewardMultiplier, DamageMultiplier } = rows[0];
    return { WalletAddress, Level, Odds, BetAmount, ItemId, Round, RewardMultiplier, DamageMultiplier };
}
/**
 * 取得關卡資訊
 */
const getLevelInfo = async (level) => {
    const sql = `
        SELECT Round, RewardMultiplier, Threshold
        FROM GameLevel
        WHERE Level = ?
    `;

    const [rows] = await pool.execute(sql, [level]);
    const { Round, RewardMultiplier, Threshold } = rows[0];
    return { Round, RewardMultiplier, Threshold };
}

/**
 * 開始遊戲時插入
 */
const insertWhenGameStart = async ({
    walletAddress,
    gameId,
    level,
    round,
    rewardMultiplier,
    damageMultiplier,
    itemId = null,
    odds,
    amountInput
}) => {
    const sql = `
        INSERT INTO GameInfo (WalletAddress, GameId, Level, Round, RewardMultiplier, DamageMultiplier, ItemId, Odds, BetAmount)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;
    await pool.execute(sql, [walletAddress, gameId, level, round, rewardMultiplier, damageMultiplier, itemId, odds, amountInput]);
};

/**
 * 遊戲結束時更新
 */
const updateWhenGameOver = async (gameId, result, profit, userScores) => {
    const sql = `
        UPDATE GameInfo
        SET Result = ?, Profit = ?, UserScores = ?
        WHERE GameId = ?
    `;
    await pool.execute(sql, [result, profit, userScores, gameId]);
};

module.exports = {
    getLevelInfo,
    insertWhenGameStart,
    updateWhenGameOver,
    queryGameInfoByGameId
};
