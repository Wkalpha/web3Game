const dailyQuestModel = require('../models/dailyQuestModel');
const userModel = require('../models/userModel');
const webSocketService = require('../services/webSocketService');

/**
 * 取得玩家每日任務
 */
const getUserDailyQuests = async (req, res) => {
  const { walletAddress } = req.body;
  try {
    const quests = await dailyQuestModel.getUserDailyQuests(walletAddress);
    res.json(quests);
  } catch (error) {
    console.error('獲取每日任務錯誤:', error);
    res.status(500).json({ error: '獲取每日任務失敗' });
  }
}

/**
 * 領取獎勵
 */
const claimQuestReward = async (req, res) => {
  const { walletAddress, questId } = req.body;
  try {
    const success = await dailyQuestModel.claimQuestReward(walletAddress, questId);
    if (success) {
      const userTimeCoin = await userModel.getTimeCoin(walletAddress);
      // webSocket
      const timeCoinChangeMessage = {
        event: 'TimeCoinChange',
        data: {
          walletAddress: walletAddress,
          userTimeCoin: userTimeCoin
        }
      };
      webSocketService.sendToPlayerMessage(walletAddress, timeCoinChangeMessage);

      res.json({
        message: '🎉 獎勵領取成功！'
      });
    } else {
      res.status(400).json({ error: '未達成任務目標或已領取' });
    }
  } catch (error) {
    console.error('更新每日任務進度錯誤:', error);
    res.status(500).json({ error: '更新每日任務進度失敗' });
  }
}


module.exports = {
  getUserDailyQuests,
  claimQuestReward
};
