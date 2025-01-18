const pool = require('../database/pool');

/**
 * 玩家購買遊玩次數
 * @param {string} walletAddress - 玩家的錢包地址
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
 * 更新玩家 Time Coin
 * @param {string} walletAddress - 玩家的錢包地址
 * @param {number} balanceChange - 變更的 TimeCoin 數量（負數表示扣除）
 * @param {number} playTimes - 變更的 PlayTimes 數量
 */
const updateUserTimeCoin = async (timeCoin, walletAddress) => {
    const sql = `
        UPDATE UserInfo
        SET TimeCoin = TimeCoin + ?
        WHERE WalletAddress = ?
    `;
    await pool.execute(sql, [timeCoin, walletAddress]);
};

/**
 * 取得玩家 餘額 與 剩餘遊玩次數
 * @param {string} walletAddress - 玩家的錢包地址
 */
const getTimeCoinPlayTimes = async (walletAddress) => {
    const sql = `SELECT Id, FLOOR(TimeCoin) AS AdjustedTimeCoin, LeftOfPlay FROM UserInfo WHERE WalletAddress = ?`;
    const [rows] = await pool.execute(sql, [walletAddress]);
    return rows[0];
};

/**
 * 取得玩家 餘額
 * @param {string} walletAddress - 玩家的錢包地址
 */
const getTimeCoin = async (walletAddress) => {
    const sql = `SELECT FLOOR(TimeCoin) AS AdjustedTimeCoin FROM UserInfo WHERE WalletAddress = ?`;
    const [rows] = await pool.execute(sql, [walletAddress]);
    return rows[0].AdjustedTimeCoin;
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
    await pool.execute(sql, [betAmount, userTimeCoinOdds, walletAddress]);
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

/**
 * 查詢或新增玩家
 * @param {*} walletAddress 
 * @returns 
 */
const findOrAdd = async (walletAddress) => {
    const [result] = await pool.execute(`SELECT *, FLOOR(TimeCoin) AS AdjustedTimeCoin FROM UserInfo WHERE WalletAddress = ?`, [walletAddress]);

    if (result.length === 0) {
        await pool.execute(`
            INSERT INTO UserInfo (WalletAddress, LeftOfPlay, TimeCoin, Creator, BaseAttackPower, RewardMultiplier) 
            VALUES (?, ?, ?, ?, 1, 1)
            `, [walletAddress, 5, 0, 'System']);
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
            userId: userInfo.Id,
            walletAddress: userInfo.WalletAddress,
            leftOfPlay: userInfo.LeftOfPlay,
            timeCoin: userInfo.AdjustedTimeCoin,
            referredBy: userInfo.ReferredBy
        }
        return rs;
    }
}

/**
 * 查詢玩家資訊
 */
const getUser = async (walletAddress) => {
    const [result] = await pool.execute(`SELECT *, FLOOR(TimeCoin) AS AdjustedTimeCoin FROM UserInfo WHERE WalletAddress = ?`, [walletAddress]);

    return result[0];
}

/**
 * 查詢玩家基礎攻擊力、結算獎勵...等基礎資訊
 */
const getBaseInfo = async (walletAddress) => {
    const [result] = await pool.execute(`SELECT WalletAddress, BaseAttackPower, RewardMultiplier, BaseLeftOfPlay FROM UserInfo WHERE WalletAddress = ?`, [walletAddress]);

    return result[0];
}

/**
 * 更新玩家的基礎攻擊力或結算獎勵
 */
const updateUserBaseInfo = async (walletAddress, effectType, value) => {
    switch (effectType) {
        case 'BaseAttackPower': {
            // 基礎攻擊
            const sql = `
                UPDATE UserInfo
                SET BaseAttackPower = BaseAttackPower + ?
                WHERE WalletAddress = ?
            `;
            await pool.execute(sql, [value, walletAddress]);
            break;
        }
        case 'RewardMultiplier': {
            // 獎勵結算
            const sql = `
                UPDATE UserInfo
                SET RewardMultiplier = RewardMultiplier + ?
                WHERE WalletAddress = ?
            `;
            await pool.execute(sql, [value, walletAddress]);
            break;
        }
        case 'BaseLeftOfPlay': {
            // 遊玩次數
            const sql = `
                UPDATE UserInfo
                SET BaseLeftOfPlay = BaseLeftOfPlay + ? , LeftOfPlay = LeftOfPlay + ?
                WHERE WalletAddress = ?
            `;
            await pool.execute(sql, [value, value, walletAddress]);
            break;
        }
        default: {
            return res.status(400).json({ error: '更新 UserInfoBase 失敗' });
        }
    }
}

module.exports = {
    getUser,
    getTimeCoinPlayTimes,
    getTimeCoin,
    formatTimeCoin,
    buyPlayTimes,
    deductTimeCoin,
    deductPlayTimes,
    findOrAdd,
    updateUserTimeCoinAfterGameOver,
    updateUserTimeCoin,
    updateUserBaseInfo,
    getBaseInfo
};
