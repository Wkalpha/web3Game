const { buyPlayTimes, getTimeCoinPlayTimes, deductTimeCoin, formatTimeCoin, findOrAdd, getTimeCoin } = require('../models/userModel');
const { updateMainPrizePoolAmount, updateLeaderboardPrizePoolAmount, updateMainPrizePoolAmountAfterWithdraw } = require('../models/prizePoolModel');
const { updateLeaderboardAmount, getLeaderboard } = require('../models/leaderboardModel');
const { upsertLeaderboardBetRecord } = require('../models/leaderboardBetRecordModel');
const { transferEthToSpecificAddress, withdraw } = require('../services/web3utlts');

/**
 * 更新用戶餘額，當購買遊戲次數時
 */
const updateUserBalanceWhenBuyPlaytimes = async (req, res) => {
  const { walletAddress, balanceChange, playTimes } = req.body;
  const balanceChangeToETH = balanceChange / 10000; // 轉換為 ETH

  try {
    // 1.更新獎金池的金額
    await updateMainPrizePoolAmount(balanceChangeToETH); // 使用 prizePoolModel 處理

    // 2.更新使用者的 TimeCoin 和剩餘遊戲次數
    await buyPlayTimes(walletAddress, balanceChange, playTimes); // 使用 userModel 處理

    // 3.獲取最新的使用者資訊
    const userInfo = await getTimeCoinPlayTimes(walletAddress);
    res.json({
      leftOfPlay: userInfo?.LeftOfPlay,
      timeCoin: userInfo?.AdjustedTimeCoin
    });
  } catch (error) {
    res.status(500).json({ error: '更新用戶餘額失敗', details: error.message });
  }
};

/**
 * 玩家使用 Time Coin 兌換 Eth
 */
const updateUserBalanceWhenBuyETH = async (req, res) => {
  const { walletAddress, balanceChange } = req.body;

  try {
    // 檢查 Time Coin 是否足夠
    const timeCoin = await getTimeCoin(walletAddress);
    if (timeCoin >= balanceChange) {
      transferEthToSpecificAddress(walletAddress, balanceChange);
    } else {
      res.status(500).json("Time Coin 不足");
    }
  } catch (error) {
    res.status(500).json({ error: 'Time Coin to ETH fail', details: error.message });
  }
};

/**
 * 玩家下注
 */
const leaderboardBet = async (req, res) => {
  const { fromWalletAddress, toWalletAddress, betAmount, yearWeek } = req.body

  try {
    await updateLeaderboardAmount(betAmount, toWalletAddress);
    await upsertLeaderboardBetRecord(fromWalletAddress, toWalletAddress, betAmount);
    await updateLeaderboardPrizePoolAmount(betAmount);
    await deductTimeCoin(fromWalletAddress, betAmount);
    const leaderboardResults = await getLeaderboard(yearWeek);
    const userInfo = await formatTimeCoin(fromWalletAddress);

    res.json({
      leaderboard: leaderboardResults,
      userTimeCoin: userInfo?.AdjustedTimeCoin
    });

  } catch (error) {
    res.status(500).json({ error: 'Bet fail', details: error.message });
  }
};

/**
 * 查詢玩家，若不存在則寫入
 */
const findOrAddUser = async (req, res) => {
  const { walletAddress } = req.body

  try {
    const result = await findOrAdd(walletAddress);
    res.json({
      isNewUser: result.isNewUser,
      walletAddress: result.walletAddress,
      leftOfPlay: result.leftOfPlay,
      timeCoin: result.timeCoin
    })
  } catch (err) {
    console.error('檢查用戶失敗：', err);
    res.status(500).send('資料庫錯誤');
  }
};

/**
 * 提取合約所有 ETH
 */
const withdrawContract = async (req, res) => {
  await updateMainPrizePoolAmountAfterWithdraw();
  await withdraw();
};


module.exports = {
  updateUserBalanceWhenBuyPlaytimes,
  updateUserBalanceWhenBuyETH,
  leaderboardBet,
  findOrAddUser,
  withdrawContract
};
