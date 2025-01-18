const pool = require('../database/pool');

/**
 * 插入 Referral
 * @param {string} referrerWalletAddress - 被推薦人地址
 * @param {string} refereeWalletAddress - 推薦人地址
 * @param {number} rewardTimeCoin - + Time Coin 數量
 */
const insertReferral = async (referrerWalletAddress, refereeWalletAddress, rewardTimeCoin) => {
    const sql = `
      INSERT INTO Referrals (referrerWalletAddress, refereeWalletAddress, rewardTimeCoin, createdAt)
      VALUES (?, ?, ?, NOW())
    `;
    await pool.query(sql, [referrerWalletAddress, refereeWalletAddress, rewardTimeCoin]);
};

/**
 * 更新被推薦人的推薦人欄位和餘額
 * @param {string} refereeWalletAddress - 被推薦人地址
 * @param {string} referrerWalletAddress - 推薦人地址
 * @param {number} rewardTimeCoin - + Time Coin 數量
 */
const updateReferee = async (refereeWalletAddress, referrerWalletAddress, rewardTimeCoin) => {
    const sql = `
      UPDATE UserInfo
      SET ReferredBy = ?, TimeCoin = TimeCoin + ?
      WHERE walletAddress = ?
    `;
    await pool.query(sql, [referrerWalletAddress, rewardTimeCoin, refereeWalletAddress]);
};


module.exports = {
    insertReferral,
    updateReferee
};
