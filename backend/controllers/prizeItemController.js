const prizeItemModel = require('../models/prizeItemModel');
const prizeItemPoolModel = require('../models/prizeItemPoolModel');
const userModel = require('../models/userModel');
const userDrawCounterModel = require('../models/userDrawCounterModel');
const userInventoryModel = require('../models/userInventoryModel');
const userDrawLogModel = require('../models/userDrawLogModel');
const webSocketService = require('../services/webSocketService');
const prizePoolModel = require('../models/prizePoolModel');
const badgeModel = require('../models/badgeModel');


/**
 * 取得抽獎池
 */
const getPrizeItem = async (req, res) => {
  const { poolName, walletAddress } = req.body;
  try {
    const prizeItems = await prizeItemModel.queryPrizeItem(poolName);

    const poolInfo = await prizeItemPoolModel.queryPrizeItemPool();
    const filtered = poolInfo.filter(row => row.PoolName === poolName).map(({ PrizeItemPoolId, PoolName, EntryFee, GuaranteeDraw }) => ({
      PrizeItemPoolId,
      PoolName,
      EntryFee,
      GuaranteeDraw
    }));

    const maxPrize = prizeItems.reduce((prev, current) => (prev.ItemValue > current.ItemValue ? prev : current));

    const userInfo = await userModel.findOrAdd(walletAddress);

    const userDrawCounter = await userDrawCounterModel.getDrawCounter(userInfo.userId, filtered[0].PrizeItemPoolId);

    res.json({
      prizeItems,
      userDrawCounter,
      bigPrize: maxPrize,
      guaranteeDraw: filtered[0].GuaranteeDraw
    });

  } catch (error) {
    res.status(500).json({ error: '取得獎品失敗', details: error.message });
  }
};

/**
 * 抽獎
 */
const drawPrize = async (req, res) => {
  const { poolName, walletAddress } = req.body;

  try {
    const result = await performDraw(poolName, walletAddress, false);

    // 延遲 2.5 秒後返回
    setTimeout(() => {
      res.json(result);
    }, 2500);
  } catch (error) {
    res.status(500).json({ error: '抽獎失敗', details: error.message });
  }
};

/**
 * 10連抽功能
 */
const tenDrawPrize = async (req, res) => {
  const { poolName, walletAddress } = req.body;

  try {
    // 1. 獲取抽獎池資訊
    const poolInfo = await prizeItemPoolModel.queryPrizeItemPool();
    const pool = poolInfo.find((row) => row.PoolName === poolName);

    if (!pool) {
      return res.status(404).json({ error: '抽獎池不存在' });
    }

    const { PrizeItemPoolId, EntryFee, GuaranteeDraw } = pool;

    // 2. 獲取玩家資訊
    const userInfo = await userModel.findOrAdd(walletAddress);

    // PoolName 找出 ItemId
    const itemId = await prizeItemModel.getPrizeItemIdByPoolName(poolName);
    
    // 用 ItemId 去 UserInventory 找出對應數量
    const ticketQuantity = await userInventoryModel.getUserInventoryCount(walletAddress, itemId);

    let totalFee = EntryFee * Math.max(0, (10 - ticketQuantity)); // 10連抽所需的費用

    // 取得使用者抽獎費用降低徽章資訊
    const decraeseDrawFeeBadgeInfo = await badgeModel.getBadgeEffect(walletAddress, 4);0.0

    totalFee =Math.round(totalFee * Math.max(0.5, (1 - decraeseDrawFeeBadgeInfo.quantity * decraeseDrawFeeBadgeInfo.effectValue))); // 最多折抵50%

    if (userInfo.timeCoin < totalFee) {
      return res.status(400).json({ error: 'Time Coin 不足' });
    }

    // 4. 從獎池中獲取所有獎品資訊
    const prizeItems = await prizeItemModel.queryPrizeItem(poolName);

    // 計算獎池總權重
    const totalRate = prizeItems.reduce((acc, item) => acc + parseFloat(item.DropRate), 0);

    // 找出大獎
    const maxPrize = prizeItems.reduce((prev, current) => (prev.ItemValue > current.ItemValue ? prev : current));

    // 5. 進行 10 次抽獎
    const results = [];

    // 取得玩家該獎池的抽獎次數
    let userDrawCounter = await userDrawCounterModel.getDrawCounter(userInfo.userId, PrizeItemPoolId);

    for (let i = 0; i < 10; i++) {
      // 累積抽獎次數增加
      userDrawCounter += 1;

      // 增加抽獎次數
      await userDrawCounterModel.incrementDrawCounter(userInfo.userId, PrizeItemPoolId);

      // 如果累積次數達到保底值，強制送出最低機率的獎品
      if (userDrawCounter >= GuaranteeDraw) {
        results.push(maxPrize);
        userDrawCounter -= GuaranteeDraw
        // 重置抽獎次數
        await userDrawCounterModel.deductDrawCounter(userInfo.userId, PrizeItemPoolId, GuaranteeDraw);
        continue;
      }

      // 正常隨機抽獎
      const random = Math.random() * totalRate;

      let cumulativeRate = 0;
      let selectedPrize = null;

      for (const item of prizeItems) {
        cumulativeRate += parseFloat(item.DropRate);
        if (random <= cumulativeRate + Number.EPSILON) {
          selectedPrize = item;
          break;
        }
      }

      // 確保有選中的獎品
      if (!selectedPrize) {
        selectedPrize = prizeItems[prizeItems.length - 1]; // 如果未選中，預設最後一個獎品
      }

      results.push(selectedPrize);
    }

    // 6. 扣除玩家 Time Coin
    await userModel.deductTimeCoin(walletAddress, totalFee);
    userInfo.timeCoin = await userModel.getTimeCoin(walletAddress);

    // 7. 將獎品批量插入到 UserInventory
    for (const prize of results) {
      await userInventoryModel.insertUserInventory(userInfo.userId, prize.ItemId, prize.ItemValue);
      // 存抽獎紀錄
      await userDrawLogModel.insertUserDrawLog(userInfo.userId, PrizeItemPoolId, prize.ItemId, prize.BigPrize);
    }

    // 8.通知玩家 Time Coin 變化
    const message = {
      event: 'TimeCoinChange',
      data: {
        walletAddress,
        userTimeCoin: userInfo.timeCoin
      }
    };
    webSocketService.sendToPlayerMessage(walletAddress, message);

    userDrawCounter = await userDrawCounterModel.getDrawCounter(userInfo.userId, PrizeItemPoolId);

    await prizePoolModel.updateMainPrizePoolAmountAfterDrawPrize(totalFee);

    // 9. 返回抽獎結果
    // 延遲 3 秒後回傳獎品
    setTimeout(() => {
      return res.json(
        {
          prizes: results.map((prize) => ({
            ItemId: prize.ItemId,
            ItemName: prize.ItemName,
            ItemValue: prize.ItemValue,
          })),
          userDrawCounter
        });
    }, 3000);
  } catch (error) {
    console.error('10連抽失敗:', error.message);
    res.status(500).json({ error: '10連抽失敗', details: error.message });
  }
};

/**
 * 抽獎邏輯
 */
const performDraw = async (poolName, walletAddress, ticket) => {
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

  // 取得使用者抽獎費用降低徽章資訊
  const decraeseDrawFeeBadgeInfo = await badgeModel.getBadgeEffect(walletAddress, 4);
  const entryFee = ticket ? 0 : Math.max(0, Math.round(filtered[0].EntryFee * Math.max(0.5, (1 - decraeseDrawFeeBadgeInfo.quantity * decraeseDrawFeeBadgeInfo.effectValue)))); // 如果使用 Ticket 則不用費用
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
  getPrizeItem,
  drawPrize, // 單次抽獎
  tenDrawPrize, // 10連抽
  performDraw
};
