const userModel = require('../models/userModel');
const prizePoolModel = require('../models/prizePoolModel');
const leaderboardModel = require('../models/leaderboardModel');
const leaderboardBetRecordModel = require('../models/leaderboardBetRecordModel');
const webSocketService = require('../services/webSocketService');
const dailyQuestModel = require('../models/dailyQuestModel');
const { transferEthToSpecificAddress, withdraw } = require('../services/web3utlts');

/**
 * 更新用戶餘額，當購買遊戲次數時
 */
const updateUserBalanceWhenBuyPlaytimes = async (req, res) => {
  const { walletAddress, balanceChange, playTimes } = req.body;
  const balanceChangeToETH = balanceChange / 10000; // 轉換為 ETH

  try {
    // 1.更新獎金池的金額
    await prizePoolModel.updateMainPrizePoolAmount(balanceChangeToETH);

    // 2.更新使用者的 TimeCoin 和剩餘遊戲次數
    await userModel.buyPlayTimes(walletAddress, balanceChange, playTimes);

    // 3.獲取最新的使用者資訊
    const userInfo = await userModel.getTimeCoinPlayTimes(walletAddress);
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
    const timeCoin = await userModel.getTimeCoin(walletAddress);
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
    await leaderboardModel.updateLeaderboardAmount(betAmount, toWalletAddress);
    await leaderboardBetRecordModel.upsertLeaderboardBetRecord(fromWalletAddress, toWalletAddress, betAmount);
    await prizePoolModel.updateLeaderboardPrizePoolAmount(betAmount);
    await userModel.deductTimeCoin(fromWalletAddress, betAmount);
    const leaderboardResults = await leaderboardModel.getLeaderboard(yearWeek);
    const userInfo = await userModel.formatTimeCoin(fromWalletAddress);

    await dailyQuestModel.updateQuestProgress(fromWalletAddress, 3);
    
    const message = {
      event: 'DailyQuestChange',
      data: {
      }
    };

    webSocketService.sendToPlayerMessage(fromWalletAddress, message);

    res.json({
      leaderboard: leaderboardResults,
      userTimeCoin: userInfo.AdjustedTimeCoin
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
    const result = await userModel.findOrAdd(walletAddress);
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
 * 查詢玩家基礎資訊，攻擊力、結算獎勵...等
 */
const getUserBaseInfo = async (req, res) => {
  const { walletAddress } = req.body

  try {
    const result = await userModel.getBaseInfo(walletAddress);

    res.json({
      BaseAttackPower: result.BaseAttackPower,
      RewardMultiplier: result.RewardMultiplier,
      BaseLeftOfPlay: result.BaseLeftOfPlay
    })
  } catch (err) {
    console.error('查詢失敗', err);
    res.status(500).send('資料庫錯誤');
  }
};

/**
 * 提取合約所有 ETH
 */
const withdrawContract = async (req, res) => {
  await prizePoolModel.updateMainPrizePoolAmountAfterWithdraw();
  await withdraw();
};


module.exports = {
  updateUserBalanceWhenBuyPlaytimes,
  updateUserBalanceWhenBuyETH,
  leaderboardBet,
  findOrAddUser,
  withdrawContract,
  getUserBaseInfo
};
