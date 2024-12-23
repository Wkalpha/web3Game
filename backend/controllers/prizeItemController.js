const { queryPrizeItem } = require('../models/prizeItemModel');
const { queryPrizeItemPool } = require('../models/prizeItemPoolModel');
const userModel = require('../models/userModel');
const userDrawCounterModel = require('../models/userDrawCounterModel');
const { insertUserInventory } = require('../models/userInventoryModel');
const webSocketService = require('../services/webSocketService');


/**
 * 取得抽獎池
 */
const getPrizeItem = async (req, res) => {
  const { poolName, walletAddress } = req.body;
  try {
    const prizeItems = await queryPrizeItem(poolName);

    const poolInfo = await queryPrizeItemPool();
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
    // 1.根據 poolName 去 PrizeItemPool 取得抽獎的費用(如20)
    const poolInfo = await queryPrizeItemPool();
    const filtered = poolInfo.filter(row => row.PoolName === poolName).map(({ PrizeItemPoolId, PoolName, EntryFee, GuaranteeDraw }) => ({
      PrizeItemPoolId,
      PoolName,
      EntryFee,
      GuaranteeDraw
    }));

    // 2.根據 walletAddress 去 UserInfo 取得使用者的 Time Coin
    const userInfo = await userModel.findOrAdd(walletAddress);

    // 3.判斷 Time Coin是否足夠抽獎
    if (filtered.length > 0) {
      if (userInfo.timeCoin >= filtered[0].EntryFee) {
        const guaranteeDraw = filtered[0].GuaranteeDraw;

        // 4.檢查玩家的抽獎次數
        let userDrawCounter = await userDrawCounterModel.getDrawCounter(userInfo.userId, filtered[0].PrizeItemPoolId);

        // 如果達到保底次數，直接送出最大獎
        if (userDrawCounter + 1 >= guaranteeDraw) {
          const prizeItems = await queryPrizeItem(poolName);
          const maxPrize = prizeItems.reduce((prev, current) => (prev.ItemValue > current.ItemValue ? prev : current));

          // 送出最大獎
          await insertUserInventory(userInfo.userId, maxPrize.ItemId, maxPrize.ItemValue);

          // 扣除 Time Coin
          await userModel.deductTimeCoin(walletAddress, filtered[0].EntryFee);
          userInfo.timeCoin = await userModel.getTimeCoin(walletAddress);

          // 通知玩家 Time Coin 變化
          const message = {
            event: 'TimeCoinChange',
            data: {
              walletAddress,
              userTimeCoin: userInfo.timeCoin
            }
          };
          webSocketService.sendToPlayerMessage(walletAddress, message);

          // 重置抽獎次數
          await userDrawCounterModel.deductDrawCounter(userInfo.userId, filtered[0].PrizeItemPoolId, guaranteeDraw);

          // 延遲 2.5 秒後回傳保底獎品
          return setTimeout(() => {
            return res.json({
              prize: {
                ItemName: maxPrize.ItemName,
                ItemValue: maxPrize.ItemValue
              }
            });
          }, 2500);
        }

        // 5.正常抽獎邏輯
        const prizeItems = await queryPrizeItem(poolName);
        const totalRate = prizeItems.reduce((acc, item) => acc + parseFloat(item.DropRate), 0);

        const random = Math.random() * totalRate;

        let cumulativeRate = 0;
        let prizeName = null;
        let prizeValue = null;
        let prizeItemId = null;

        for (const item of prizeItems) {
          cumulativeRate += parseFloat(item.DropRate);
          if (random <= cumulativeRate + Number.EPSILON) {
            prizeItemId = item.ItemId;
            prizeName = item.ItemName;
            prizeValue = item.ItemValue;
            break;
          }
        }

        // 確保總是有值
        if (prizeName === null || prizeValue === null) {
          const fallbackPrize = prizeItems[prizeItems.length - 1];
          prizeItemId = fallbackPrize.ItemId;
          prizeName = fallbackPrize.ItemName;
          prizeValue = fallbackPrize.ItemValue;
        }

        // 寫入獎品到 UserInventory
        await insertUserInventory(userInfo.userId, prizeItemId, prizeValue);

        // 扣除 Time Coin
        await userModel.deductTimeCoin(walletAddress, filtered[0].EntryFee);
        userInfo.timeCoin = await userModel.getTimeCoin(walletAddress);

        // 通知玩家 Time Coin 變化
        const message = {
          event: 'TimeCoinChange',
          data: {
            walletAddress,
            userTimeCoin: userInfo.timeCoin
          }
        };
        webSocketService.sendToPlayerMessage(walletAddress, message);

        // 增加抽獎次數
        await userDrawCounterModel.incrementDrawCounter(userInfo.userId, filtered[0].PrizeItemPoolId);

        userDrawCounter = await userDrawCounterModel.getDrawCounter(userInfo.userId, filtered[0].PrizeItemPoolId);

        // 延遲 2.5 秒後回傳獎品
        setTimeout(() => {
          return res.json({
            prize: {
              ItemName: prizeName,
              ItemValue: prizeValue
            },
            userDrawCounter
          });
        }, 2500);
      } else {
        return res.json({
          prize: {
            ItemName: "無",
            ItemValue: 0
          }
        });
      }
    } else {
      console.log(`No pool found for PoolName: ${poolName}`);
      return res.status(404).json({ error: '抽獎池不存在' });
    }
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
    const poolInfo = await queryPrizeItemPool();
    const pool = poolInfo.find((row) => row.PoolName === poolName);

    if (!pool) {
      return res.status(404).json({ error: '抽獎池不存在' });
    }

    const { PrizeItemPoolId, EntryFee, GuaranteeDraw } = pool;

    // 2. 獲取玩家資訊
    const userInfo = await userModel.findOrAdd(walletAddress);

    // 3. 檢查是否有足夠的 Time Coin
    const totalFee = EntryFee * 10; // 10連抽所需的費用
    if (userInfo.timeCoin < totalFee) {
      return res.status(400).json({ error: 'Time Coin 不足' });
    }

    // 4. 從獎池中獲取所有獎品資訊
    const prizeItems = await queryPrizeItem(poolName);

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
      await insertUserInventory(userInfo.userId, prize.ItemId, prize.ItemValue);
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

module.exports = {
  getPrizeItem,
  drawPrize, // 單次抽獎
  tenDrawPrize // 10連抽
};
