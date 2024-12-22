const { queryPrizeItem } = require('../models/prizeItemModel');
const { queryPrizeItemPool } = require('../models/prizeItemPoolModel');
const { getTimeCoin } = require('../models/userModel');

/**
 * 取得抽獎池
 */
const getPrizeItem = async (req, res) => {
  const { poolName } = req.body;
  try {
    const prizeItems = await queryPrizeItem(poolName);

    res.json({
      prizeItems
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
    const poolInfo = await queryPrizeItemPool()
    const filtered = poolInfo.filter(row => row.PoolName === poolName).map(({ PoolName, EntryFee, GuaranteeDraw }) => ({
      PoolName,
      EntryFee,
      GuaranteeDraw
    }));
    // 2.根據 walletAddress 去 UserInfo 取得使用者的 Time Coin
    const userInfo = await getTimeCoin(walletAddress);
    // 3-1.如果 Time Coin 足夠支付則開始抽獎並根據 DropRate decimal(5,2) 進行抽取
    // 3-2.如果 Time Coin 不足則拒絕抽獎請求
    // 4.抽到的獎品寫入 UserInventory
    // 5.每次抽獎都需要寫入 UserDrawCounter
    // 6.將獎品內容回傳至前端

    res.json({

    });

  } catch (error) {
    res.status(500).json({ error: '抽獎失敗', details: error.message });
  }
};

module.exports = {
  getPrizeItem,
  drawPrize
};
