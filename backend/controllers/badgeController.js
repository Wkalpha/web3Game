const badgeModel = require('../models/badgeModel');
const userModel = require('../models/userModel');
const userInventoryModel = require('../models/userInventoryModel');
const userBadgeModel = require('../models/userBadgeModel');
const badgeTransferLogModel = require('../models/badgeTransferLogModel');
const webSocketService = require('../services/webSocketService');
const dailyQuestModel = require('../models/dailyQuestModel');

/**
 * 取得所有徽章資訊
 */
const getBadges = async (_, res) => {
  const result = await badgeModel.getBadges();
  res.json({
    badges: result
  });
}

/**
 * 取得使用者的徽章
 */
const getUserBadges = async (req, res) => {
  const walletAddress = req.body.walletAddress;
  const result = await badgeModel.getUserBadges(walletAddress);
  res.json({
    badges: result
  });
}

/**
 * 轉移徽章
 */
const transferBadge = async (req, res) => {
  const { fromWalletAddress, toWalletAddress, badgeId, quantity } = req.body;

  if (fromWalletAddress === toWalletAddress) {
    return res.json({ success: false, message: "不能轉移給自己" });
  }

  const fromUser = await userModel.getUser(fromWalletAddress);
  const toUser = await userModel.getUser(toWalletAddress);

  if (!fromUser || fromUser.AdjustedTimeCoin < 5) {
    return res.json({ success: false, message: "你的 TC 低於 5，無法轉移" });
  }
  if (!toUser) {
    return res.json({ success: false, message: "對方地址不存在" });
  }

  let fromBadge = await userBadgeModel.getUserBadge(fromWalletAddress);

  if (!fromBadge || fromBadge.Quantity < quantity) {
    return res.json({ success: false, message: "你沒有足夠的徽章" });
  }

  // 扣除傳送者的徽章
  await badgeModel.updateUserBadge(fromWalletAddress, badgeId, -quantity);

  // 增加接收者的徽章
  await badgeModel.insertIntoUserBadge(toWalletAddress, badgeId, quantity);

  // Log
  await badgeTransferLogModel.insert(fromWalletAddress, toWalletAddress, quantity, badgeId);

  // 扣 5 TC
  await userModel.deductTimeCoin(fromWalletAddress, 5);

  // 重查 fromUserBadge
  fromBadge = await userBadgeModel.getUserBadge(fromWalletAddress);

  const websocketMsg = {
    event: 'BadgeChange',
    data: {
      walletAddress: fromWalletAddress,
      drawBadgeKey: 1
    }
  };

  webSocketService.sendToPlayerMessage(toWalletAddress, websocketMsg);

  res.json({
    success: true,
    badges: fromBadge
  });
}

/**
 * 抽獎
 */
const drawPrize = async (req, res) => {
  const { walletAddress } = req.body;

  try {
    const result = await performDraw(walletAddress);

    // 延遲 2.5 秒後返回
    setTimeout(() => {
      res.json(result);
    }, 2500);
  } catch (error) {
    res.status(500).json({ error: '抽獎失敗', details: error.message });
  }
};

/**
 * 抽獎邏輯
 */
const performDraw = async (walletAddress) => {
  // 1. 準備好 badgedetail 的資料，包括機率
  const badgeDetailInfo = await badgeModel.getBadges(); // Name, DropRate

  const userInfo = await userModel.getUser(walletAddress);

  // 2. 拿 Id 去 UserInventory 換 ItemId = 25 的 Quantity
  const ticketQuantity = await userInventoryModel.getUserInventoryCount(walletAddress, 25);

  // 3. Quantity > 0 的話，減 1 後執行抽獎
  if (ticketQuantity > 0) {
    const leftTickets = await userInventoryModel.decrementItemQuantity(userInfo.Id, 25, 1);
    const totalRate = badgeDetailInfo.reduce((acc, item) => acc + parseFloat(item.DropRate), 0);

    const random = Math.random() * totalRate;
    let cumulativeRate = 0;
    let prize = null;

    for (const item of badgeDetailInfo) {
      cumulativeRate += parseFloat(item.DropRate);
      if (random <= cumulativeRate) {
        prize = item;
        break;
      }
    }
    // 4. 將抽到的物品的寫入/更新 UserBadge
    await badgeModel.insertIntoUserBadge(walletAddress, prize.Id, 1);

    // 5. 重查 UserBadge 將結果傳回前端
    const userBadgeInfo = await userBadgeModel.getUserBadge(walletAddress);

    await dailyQuestModel.updateQuestProgress(walletAddress, 2);

    const dailyQuestChangeMsg = {
      event: 'DailyQuestChange',
      data: {
      }
    };
    webSocketService.sendToPlayerMessage(walletAddress, dailyQuestChangeMsg);

    return {
      tickets: leftTickets,
      prize: prize,
      badges: userBadgeInfo
    };
  }
};

module.exports = {
  drawPrize, // 單次抽獎
  performDraw,
  getBadges,
  getUserBadges,
  transferBadge
};
