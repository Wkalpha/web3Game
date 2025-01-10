const badgeModel = require('../models/badgeModel');
const prizeItemPoolModel = require('../models/prizeItemPoolModel');
const userModel = require('../models/userModel');
const userDrawCounterModel = require('../models/userDrawCounterModel');
const userInventoryModel = require('../models/userInventoryModel');
const userDrawLogModel = require('../models/userDrawLogModel');
const webSocketService = require('../services/webSocketService');

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
const performDraw = async (poolName, walletAddress, ticket) => {
  // 1. 準備好 badgedetail 的資料，包括機率
  // 2. 抽獎邏輯
  // 3. 拿 WalletAddress 去 UserInfo 換 Id
  // 4. 拿 Id 去 UserInventory 換 ItemId = 25 的 Quantity
  // 5. Quantity > 0 的話，減 1 後執行抽獎
  // 6. 抽到的寫入 UserBadge
  // ...
  const poolInfo = await prizeItemPoolModel.queryPrizeItemPool();
  const filtered = poolInfo.filter(row => row.PoolName === poolName).map(({ PrizeItemPoolId, PoolName, EntryFee, GuaranteeDraw }) => ({
    PrizeItemPoolId,
    PoolName,
    EntryFee,
    GuaranteeDraw
  }));

  if (filtered.length === 0) {
    throw new Error(`No pool found for PoolName: ${poolName}`);
  }

  const entryFee = ticket ? 0 : filtered[0].EntryFee;
  const guaranteeDraw = filtered[0].GuaranteeDraw;
  const prizeItemPoolId = filtered[0].PrizeItemPoolId;

  const userInfo = await userModel.findOrAdd(walletAddress);

  if (userInfo.timeCoin < entryFee) {
    throw new Error('Time Coin不足');
  }

  let userDrawCounter = await userDrawCounterModel.getDrawCounter(userInfo.userId, prizeItemPoolId);

  if (userDrawCounter + 1 >= guaranteeDraw) {
    const prizeItems = await prizeItemModel.queryPrizeItem(poolName);
    const maxPrize = prizeItems.reduce((prev, current) => (prev.ItemValue > current.ItemValue ? prev : current));

    await userInventoryModel.insertUserInventory(userInfo.userId, maxPrize.ItemId, maxPrize.ItemValue);
    await userDrawCounterModel.incrementDrawCounter(userInfo.userId, prizeItemPoolId);
    await userDrawCounterModel.deductDrawCounter(userInfo.userId, prizeItemPoolId, guaranteeDraw);
    await userDrawLogModel.insertUserDrawLog(userInfo.userId, prizeItemPoolId, maxPrize.ItemId, maxPrize.BigPrize);

    return {
      prize: {
        ItemName: maxPrize.ItemName,
        ItemValue: maxPrize.ItemValue
      },
      userDrawCounter: 0
    };
  }

  const prizeItems = await prizeItemModel.queryPrizeItem(poolName);
  const totalRate = prizeItems.reduce((acc, item) => acc + parseFloat(item.DropRate), 0);

  const random = Math.random() * totalRate;
  let cumulativeRate = 0;
  let prize = null;

  for (const item of prizeItems) {
    cumulativeRate += parseFloat(item.DropRate);
    if (random <= cumulativeRate) {
      prize = item;
      break;
    }
  }

  if (!prize) {
    prize = prizeItems[prizeItems.length - 1];
  }

  await userInventoryModel.insertUserInventory(userInfo.userId, prize.ItemId, prize.ItemValue);
  await userModel.deductTimeCoin(walletAddress, entryFee);
  userInfo.timeCoin = await userModel.getTimeCoin(walletAddress);
  const message = {
    event: 'TimeCoinChange',
    data: {
      walletAddress,
      userTimeCoin: userInfo.timeCoin
    }
  };
  webSocketService.sendToPlayerMessage(walletAddress, message);
  await userDrawCounterModel.incrementDrawCounter(userInfo.userId, prizeItemPoolId);
  await userDrawLogModel.insertUserDrawLog(userInfo.userId, prizeItemPoolId, prize.ItemId, prize.BigPrize);

  return {
    prize: {
      ItemName: prize.ItemName,
      ItemValue: prize.ItemValue
    },
    userDrawCounter: userDrawCounter + 1
  };
};

module.exports = {
  drawPrize, // 單次抽獎
  performDraw,
  getBadges
};
