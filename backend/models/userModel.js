const pool = require('../database/pool');

/**
 * 使用者購買遊玩次數
 * @param {string} walletAddress - 使用者的錢包地址
 * @param {number} balanceChange - 變更的 TimeCoin 數量（負數表示扣除）
 * @param {number} playTimes - 變更的 PlayTimes 數量
 */
const buyPlayTimes = async (walletAddress, amount, playTimes) => {
    const sql = `
    UPDATE UserInfo
    SET TimeCoin = TimeCoin - ?, LeftOfPlay = LeftOfPlay + ?
    WHERE WalletAddress = ?
  `;
    await pool.execute(sql, [amount, playTimes, walletAddress]);
};

/**
 * 取得玩家 餘額 與 剩餘遊玩次數
 * @param {string} walletAddress - 使用者的錢包地址
 */
const getTimeCoinPlayTimes = async (walletAddress) => {
    const sql = `SELECT FLOOR(TimeCoin) AS AdjustedTimeCoin, LeftOfPlay FROM UserInfo WHERE WalletAddress = ?`;
    const [rows] = await pool.execute(sql, [walletAddress]);
    return rows[0];
};

/**
 * 取得玩家 餘額
 * @param {string} walletAddress - 使用者的錢包地址
 */
const getTimeCoin = async (walletAddress) => {
    const sql = `SELECT FLOOR(TimeCoin) AS AdjustedTimeCoin FROM UserInfo WHERE WalletAddress = ?`;
    const [rows] = await pool.execute(sql, [walletAddress]);
    return rows[0];
};

/**
 * 遊戲結束後更新玩家餘額
 * @param {string} walletAddress - 玩家的錢包地址
 */
const updateUserTimeCoinAfterGameOver = async (walletAddress, betAmount, userTimeCoinOdds) => {
    const sql = `
        UPDATE UserInfo
        SET TimeCoin = TimeCoin + (? * ?)
        WHERE WalletAddress = ?
      `;
    const [rows] = await pool.execute(sql, [betAmount, userTimeCoinOdds, walletAddress]);
    return rows[0];
};

const formatTimeCoin = async (walletAddress) => {
    const sql = `SELECT FLOOR(TimeCoin) AS AdjustedTimeCoin FROM UserInfo WHERE WalletAddress = ?`
    const [rows] = await pool.execute(sql, [walletAddress]);
    return rows[0];
}

const deductTimeCoin = async (walletAddress, amount) => {
    const sql = `
    UPDATE UserInfo
    SET TimeCoin = TimeCoin - ?
    WHERE WalletAddress = ?
  `;
    await pool.execute(sql, [amount, walletAddress]);
}

const deductPlayTimes = async (walletAddress) => {
    const sql = `
    UPDATE UserInfo
    SET LeftOfPlay = LeftOfPlay - 1
    WHERE WalletAddress = ?
  `;
    await pool.execute(sql, [walletAddress]);
}

const findOrAdd = async (walletAddress) => {
    const [result] = await pool.execute(`SELECT *, FLOOR(TimeCoin) AS AdjustedTimeCoin FROM UserInfo WHERE WalletAddress = ?`, [walletAddress]);

    if (result.length === 0) {
        await pool.execute(`INSERT INTO UserInfo (WalletAddress, LeftOfPlay, TimeCoin, Creator) VALUES (?, ?, ?, ?)`, [walletAddress, 5, 0, 'System']);
        const rs = {
            isNewUser: true,
            walletAddress: walletAddress,
            leftOfPlay: 5,
            timeCoin: 0
        }
        return rs;
    } else {
        const userInfo = result[0];
        const rs = {
            isNewUser: false,
            walletAddress: userInfo.WalletAddress,
            leftOfPlay: userInfo.LeftOfPlay,
            timeCoin: userInfo.AdjustedTimeCoin,
        }
        return rs;
    }
}

module.exports = {
    getTimeCoinPlayTimes,
    getTimeCoin,
    formatTimeCoin,
    buyPlayTimes,
    deductTimeCoin,
    deductPlayTimes,
    findOrAdd,
    updateUserTimeCoinAfterGameOver
};
