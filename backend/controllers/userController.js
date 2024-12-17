const { buyPlayTimes, getTimeCoinPlayTimes, deductTimeCoin, deductPlayTimes, formatTimeCoin, findOrAdd, updateUserTimeCoinAfterGameOver, getTimeCoin } = require('../models/userModel');
const { updateMainPrizePoolAmount, updateLeaderboardPrizePoolAmount, updateMainPrizePoolAmountAfterGameOver } = require('../models/prizePoolModel');
const { updateLeaderboardAmount, getLeaderboard, upsertLeaderboardAfterGameOver } = require('../models/leaderboardModel');
const { upsertLeaderboardBetRecord } = require('../models/leaderboardBetRecordModel');
const { transferEthToSpecificAddress } = require('../services/web3utlts');

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
    transferEthToSpecificAddress(walletAddress, balanceChange);
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
 * 開始遊戲
 */
const gameStart = async (req, res) => {

  const { walletAddress, amountInput } = req.body
  try {
    // 1.更新玩家的餘額
    await deductTimeCoin(walletAddress, amountInput);
    // 2.扣除玩家遊戲次數
    await deductPlayTimes(walletAddress);
    // 3.重查玩家餘額與次數回傳
    const userInfo = await getTimeCoinPlayTimes(walletAddress);
    res.json({
      leftOfPlay: userInfo?.LeftOfPlay,
      timeCoin: userInfo?.AdjustedTimeCoin
    });

  } catch (err) {
    console.error('無法開始遊戲：', err);
    res.status(500).send('資料庫錯誤');
  }
};

/**
 * 遊戲結束
 */
const gameOver = async (req, res) => {

  const { walletAddress, betAmount, odds, gameResult, scores } = req.body;

  try {
    let userTimeCoinOdds = gameResult === 'win' ? 1 + odds : 0;
    let prizePoolOdds = gameResult === 'lose' ? 1 : -odds;
    
    await updateUserTimeCoinAfterGameOver(walletAddress, betAmount, userTimeCoinOdds);
    const userTimeCoin = await getTimeCoin(walletAddress);

    // 更新主獎金池金額
    await updateMainPrizePoolAmountAfterGameOver(betAmount, prizePoolOdds);

    // 插入或更新 Leaderboard
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const firstDayOfYear = new Date(year, 0, 1);
    const pastDaysOfYear = Math.floor((currentDate - firstDayOfYear) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7); // 取得當前週數
    const yearWeek = `${year}${weekNumber.toString().padStart(2, '0')}`; // 例如：202450

    const winIncrement = gameResult === 'win' ? 1 : 0;
    const loseIncrement = gameResult === 'lose' ? 1 : 0;
    const scoreAdjustment = gameResult === 'win' ? scores : -scores;

    await upsertLeaderboardAfterGameOver(walletAddress, yearWeek, winIncrement, loseIncrement, scoreAdjustment);

  } catch (err) {
    console.error('遊戲結束但發生錯誤', err);
    res.status(500).send('資料庫錯誤');
  }
};


module.exports = {
  updateUserBalanceWhenBuyPlaytimes,
  updateUserBalanceWhenBuyETH,
  leaderboardBet,
  findOrAddUser,
  gameStart,
  gameOver
};
