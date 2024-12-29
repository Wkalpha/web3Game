const userInventoryModel = require('../models/userInventoryModel');
const userInfoModel = require('../models/userModel');
const webSocketService = require('../services/webSocketService');
const prizeItemController = require('../controllers/prizeItemController');

/**
 * 查詢 UserInventory
 */
const getUserInventory = async (req, res) => {
  const { walletAddress } = req.body;
  try {
    const inventory = await userInventoryModel.queryUserInventory(walletAddress);

    res.json({
      inventory
    });
  } catch (error) {
    res.status(500).json({ error: '取得道具失敗', details: error.message });
  }
};

/**
 * 使用道具
 * 1. 根據類型實作不同邏輯
 * 2. 減少道具持有數量
 * 3. 判斷有無需要回傳必要資訊
 */
const useItem = async (req, res) => {
  const { walletAddress, itemId } = req.body;

  try {
    // 1. 查詢玩家背包資訊
    const inventory = await userInventoryModel.queryUserInventory(walletAddress);
    const item = inventory.find(i => i.ItemId === itemId);

    if (!item || item.Quantity <= 0) {
      return res.status(400).json({ error: '道具不存在或數量不足' });
    }

    // 2. 判斷道具類型並執行對應邏輯
    let result = {};
    switch (item.ItemType) {
      case 'Currency': {
        // 貨幣類道具
        await userInfoModel.updateUserTimeCoin(item.EffectValue, walletAddress);
        result.timeCoin = await userInfoModel.getTimeCoin(walletAddress);
        // 通知玩家 Time Coin 變化
        const message = {
          event: 'TimeCoinChange',
          data: {
            walletAddress,
            userTimeCoin: result.timeCoin
          }
        };
        webSocketService.sendToPlayerMessage(walletAddress, message);
        break;
      }
      case 'PermanentBuff': {
        // 永久增益類
        await userInfoModel.updateUserBaseInfo(walletAddress, item.EffectType, item.EffectValue);

        if (item.EffectType == 'BaseLeftOfPlay') {
          // 通知玩家 遊玩次數 變化
          result = await userInfoModel.getTimeCoinPlayTimes(walletAddress);
          const message = {
            event: 'PlayOfTimesChange',
            data: {
              walletAddress,
              leftOfPlay: result.LeftOfPlay
            }
          };
          webSocketService.sendToPlayerMessage(walletAddress, message);
        }

        break;
      }
      case 'Ticket': {
        // 抽獎券
        result = await prizeItemController.performDraw(item.EffectType, walletAddress, true);
        break;
      }
      default: {
        return res.status(400).json({ error: '未支援的道具類型' });
      }
    }

    // 3. 減少道具持有數量
    await userInventoryModel.decrementItemQuantity(item.UserId, itemId, 1);

    // 4. 返回結果
    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '使用道具失敗', details: error.message });
  }
};

module.exports = {
  getUserInventory,
  useItem
};
